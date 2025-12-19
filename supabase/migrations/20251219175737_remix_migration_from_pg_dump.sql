CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'user'
);


--
-- Name: card_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.card_type AS ENUM (
    'major',
    'minor'
);


--
-- Name: bootstrap_first_admin(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.bootstrap_first_admin(allowed_email text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  admin_count integer;
  current_user_email text;
  current_user_id uuid;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Check if any admin exists
  SELECT COUNT(*) INTO admin_count
  FROM public.user_roles
  WHERE role = 'admin';
  
  IF admin_count > 0 THEN
    RAISE EXCEPTION 'Admin already exists. Bootstrap not allowed.';
  END IF;
  
  -- Get current user's email from profiles
  SELECT email INTO current_user_email
  FROM public.profiles
  WHERE id = current_user_id;
  
  IF current_user_email IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;
  
  -- Check if email matches
  IF LOWER(current_user_email) != LOWER(allowed_email) THEN
    RAISE EXCEPTION 'Email mismatch. Your email does not match the allowed email.';
  END IF;
  
  -- Insert admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (current_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Log the action
  INSERT INTO public.admin_audit_logs (action, admin_user_id, target_id, target_type, metadata)
  VALUES ('bootstrap_first_admin', current_user_id, current_user_id::text, 'user', jsonb_build_object('email', current_user_email));
  
  RETURN true;
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: is_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: validate_tarot_card_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_tarot_card_id() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $_$
BEGIN
  -- Validate major arcana: major_00 to major_21 (zero-padded 2 digits)
  IF NEW.type = 'major' THEN
    IF NEW.id !~ '^major_([0-1][0-9]|2[0-1])$' THEN
      RAISE EXCEPTION 'Invalid major arcana ID format: %. Expected: major_00 to major_21', NEW.id;
    END IF;
  -- Validate minor arcana: minor_{suit}_{rank} without zero-padding
  ELSIF NEW.type = 'minor' THEN
    IF NEW.id !~ '^minor_(wands|cups|swords|pentacles)_(ace|[2-9]|10|page|knight|queen|king)$' THEN
      RAISE EXCEPTION 'Invalid minor arcana ID format: %. Expected: minor_{suit}_{ace|2-10|page|knight|queen|king}', NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$_$;


SET default_table_access_method = heap;

--
-- Name: admin_audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    admin_user_id uuid,
    action text NOT NULL,
    target_type text,
    target_id text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ai_prompt_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_prompt_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    content text NOT NULL,
    description text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ai_usage_daily; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_usage_daily (
    user_id uuid NOT NULL,
    day date NOT NULL,
    count integer DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: feature_flags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feature_flags (
    id integer DEFAULT 1 NOT NULL,
    enable_billing boolean DEFAULT false,
    enable_waitlist boolean DEFAULT false,
    enable_shop boolean DEFAULT false,
    maintenance_mode boolean DEFAULT false,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    admin_bootstrap_used boolean DEFAULT false NOT NULL,
    CONSTRAINT feature_flags_id_check CHECK ((id = 1))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    display_name text,
    intention text,
    preferred_domain text,
    onboarding_completed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tarot_cards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tarot_cards (
    id text NOT NULL,
    type public.card_type NOT NULL,
    numero integer,
    nom_fr text NOT NULL,
    name_en text,
    meaning_upright text,
    meaning_reversed text,
    meaning_upright_fr text,
    meaning_reversed_fr text,
    keywords text[],
    keywords_fr text[],
    image_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tarot_readings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tarot_readings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    spread_id text,
    question text,
    cards jsonb DEFAULT '[]'::jsonb NOT NULL,
    ai_interpretation jsonb,
    user_notes text,
    is_favorite boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tarot_spreads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tarot_spreads (
    id text NOT NULL,
    name text NOT NULL,
    name_fr text NOT NULL,
    description text,
    description_fr text,
    positions jsonb DEFAULT '[]'::jsonb NOT NULL,
    card_count integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'user'::public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: admin_audit_logs admin_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_audit_logs
    ADD CONSTRAINT admin_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: ai_prompt_templates ai_prompt_templates_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_prompt_templates
    ADD CONSTRAINT ai_prompt_templates_key_key UNIQUE (key);


--
-- Name: ai_prompt_templates ai_prompt_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_prompt_templates
    ADD CONSTRAINT ai_prompt_templates_pkey PRIMARY KEY (id);


--
-- Name: ai_usage_daily ai_usage_daily_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_usage_daily
    ADD CONSTRAINT ai_usage_daily_pkey PRIMARY KEY (user_id, day);


--
-- Name: feature_flags feature_flags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: tarot_cards tarot_cards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tarot_cards
    ADD CONSTRAINT tarot_cards_pkey PRIMARY KEY (id);


--
-- Name: tarot_readings tarot_readings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tarot_readings
    ADD CONSTRAINT tarot_readings_pkey PRIMARY KEY (id);


--
-- Name: tarot_spreads tarot_spreads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tarot_spreads
    ADD CONSTRAINT tarot_spreads_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: idx_ai_prompts_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_prompts_key ON public.ai_prompt_templates USING btree (key);


--
-- Name: idx_audit_logs_admin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_admin ON public.admin_audit_logs USING btree (admin_user_id);


--
-- Name: idx_audit_logs_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_created ON public.admin_audit_logs USING btree (created_at DESC);


--
-- Name: idx_profiles_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_created_at ON public.profiles USING btree (created_at);


--
-- Name: idx_readings_spread; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_readings_spread ON public.tarot_readings USING btree (spread_id);


--
-- Name: idx_readings_user_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_readings_user_created ON public.tarot_readings USING btree (user_id, created_at DESC);


--
-- Name: idx_readings_user_favorite; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_readings_user_favorite ON public.tarot_readings USING btree (user_id, is_favorite);


--
-- Name: idx_tarot_cards_nom_fr; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tarot_cards_nom_fr ON public.tarot_cards USING btree (nom_fr);


--
-- Name: idx_tarot_cards_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tarot_cards_type ON public.tarot_cards USING btree (type);


--
-- Name: idx_user_roles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id);


--
-- Name: ai_prompt_templates update_ai_prompts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_ai_prompts_updated_at BEFORE UPDATE ON public.ai_prompt_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: feature_flags update_feature_flags_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON public.feature_flags FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: tarot_cards validate_tarot_card_id_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER validate_tarot_card_id_trigger BEFORE INSERT OR UPDATE ON public.tarot_cards FOR EACH ROW EXECUTE FUNCTION public.validate_tarot_card_id();


--
-- Name: admin_audit_logs admin_audit_logs_admin_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_audit_logs
    ADD CONSTRAINT admin_audit_logs_admin_user_id_fkey FOREIGN KEY (admin_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: ai_usage_daily ai_usage_daily_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_usage_daily
    ADD CONSTRAINT ai_usage_daily_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: tarot_readings tarot_readings_spread_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tarot_readings
    ADD CONSTRAINT tarot_readings_spread_id_fkey FOREIGN KEY (spread_id) REFERENCES public.tarot_spreads(id);


--
-- Name: tarot_readings tarot_readings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tarot_readings
    ADD CONSTRAINT tarot_readings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: ai_prompt_templates Admins can delete prompts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete prompts" ON public.ai_prompt_templates FOR DELETE USING (public.is_admin(auth.uid()));


--
-- Name: user_roles Admins can delete roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (public.is_admin(auth.uid()));


--
-- Name: tarot_spreads Admins can delete spreads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete spreads" ON public.tarot_spreads FOR DELETE USING (public.is_admin(auth.uid()));


--
-- Name: tarot_cards Admins can delete tarot cards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete tarot cards" ON public.tarot_cards FOR DELETE USING (public.is_admin(auth.uid()));


--
-- Name: admin_audit_logs Admins can insert audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert audit logs" ON public.admin_audit_logs FOR INSERT WITH CHECK (public.is_admin(auth.uid()));


--
-- Name: ai_prompt_templates Admins can insert prompts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert prompts" ON public.ai_prompt_templates FOR INSERT WITH CHECK (public.is_admin(auth.uid()));


--
-- Name: user_roles Admins can insert roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (public.is_admin(auth.uid()));


--
-- Name: tarot_spreads Admins can insert spreads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert spreads" ON public.tarot_spreads FOR INSERT WITH CHECK (public.is_admin(auth.uid()));


--
-- Name: tarot_cards Admins can insert tarot cards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert tarot cards" ON public.tarot_cards FOR INSERT WITH CHECK (public.is_admin(auth.uid()));


--
-- Name: feature_flags Admins can update feature flags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update feature flags" ON public.feature_flags FOR UPDATE USING (public.is_admin(auth.uid()));


--
-- Name: ai_prompt_templates Admins can update prompts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update prompts" ON public.ai_prompt_templates FOR UPDATE USING (public.is_admin(auth.uid()));


--
-- Name: user_roles Admins can update roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE USING (public.is_admin(auth.uid()));


--
-- Name: tarot_spreads Admins can update spreads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update spreads" ON public.tarot_spreads FOR UPDATE USING (public.is_admin(auth.uid()));


--
-- Name: tarot_cards Admins can update tarot cards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update tarot cards" ON public.tarot_cards FOR UPDATE USING (public.is_admin(auth.uid()));


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));


--
-- Name: tarot_readings Admins can view all readings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all readings" ON public.tarot_readings FOR SELECT USING (public.is_admin(auth.uid()));


--
-- Name: user_roles Admins can view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.is_admin(auth.uid()));


--
-- Name: ai_usage_daily Admins can view all usage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all usage" ON public.ai_usage_daily FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));


--
-- Name: admin_audit_logs Admins can view audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view audit logs" ON public.admin_audit_logs FOR SELECT USING (public.is_admin(auth.uid()));


--
-- Name: ai_prompt_templates Admins can view prompts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view prompts" ON public.ai_prompt_templates FOR SELECT USING (public.is_admin(auth.uid()));


--
-- Name: tarot_spreads Anyone can view spreads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view spreads" ON public.tarot_spreads FOR SELECT TO authenticated USING (true);


--
-- Name: tarot_cards Anyone can view tarot cards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view tarot cards" ON public.tarot_cards FOR SELECT TO authenticated USING (true);


--
-- Name: feature_flags Authenticated users can view feature flags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view feature flags" ON public.feature_flags FOR SELECT TO authenticated USING ((id = 1));


--
-- Name: ai_usage_daily Block user delete on ai_usage_daily; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Block user delete on ai_usage_daily" ON public.ai_usage_daily FOR DELETE TO authenticated USING (false);


--
-- Name: ai_usage_daily Block user insert on ai_usage_daily; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Block user insert on ai_usage_daily" ON public.ai_usage_daily FOR INSERT TO authenticated WITH CHECK (false);


--
-- Name: ai_usage_daily Block user update on ai_usage_daily; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Block user update on ai_usage_daily" ON public.ai_usage_daily FOR UPDATE TO authenticated USING (false);


--
-- Name: profiles Deny anonymous select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny anonymous select" ON public.profiles FOR SELECT TO anon USING (false);


--
-- Name: admin_audit_logs Prevent audit log deletion; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Prevent audit log deletion" ON public.admin_audit_logs FOR DELETE USING (false);


--
-- Name: admin_audit_logs Prevent audit log modification; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Prevent audit log modification" ON public.admin_audit_logs FOR UPDATE USING (false);


--
-- Name: feature_flags Prevent flag deletion; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Prevent flag deletion" ON public.feature_flags FOR DELETE USING (false);


--
-- Name: feature_flags Prevent flag insertion; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Prevent flag insertion" ON public.feature_flags FOR INSERT WITH CHECK (false);


--
-- Name: profiles Users can delete their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own profile" ON public.profiles FOR DELETE USING ((auth.uid() = id));


--
-- Name: tarot_readings Users can delete their own readings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own readings" ON public.tarot_readings FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: tarot_readings Users can insert their own readings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own readings" ON public.tarot_readings FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: tarot_readings Users can update their own readings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own readings" ON public.tarot_readings FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING ((auth.uid() = id));


--
-- Name: tarot_readings Users can view their own readings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own readings" ON public.tarot_readings FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: ai_usage_daily Users can view their own usage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own usage" ON public.ai_usage_daily FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: admin_audit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_prompt_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_prompt_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_usage_daily; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_usage_daily ENABLE ROW LEVEL SECURITY;

--
-- Name: feature_flags; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: tarot_cards; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tarot_cards ENABLE ROW LEVEL SECURITY;

--
-- Name: tarot_readings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tarot_readings ENABLE ROW LEVEL SECURITY;

--
-- Name: tarot_spreads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tarot_spreads ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;