-- 1. Create the missing trigger on auth.users to auto-create profile + role on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 2. Fix bootstrap_first_admin: profiles has no email column, read from auth.users via auth.jwt()
CREATE OR REPLACE FUNCTION public.bootstrap_first_admin(allowed_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  admin_count integer;
  current_user_email text;
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  SELECT COUNT(*) INTO admin_count
  FROM public.user_roles
  WHERE role = 'admin';
  
  IF admin_count > 0 THEN
    RAISE EXCEPTION 'Admin already exists. Bootstrap not allowed.';
  END IF;
  
  -- Read email from auth.users (not profiles, which has no email column)
  SELECT email INTO current_user_email
  FROM auth.users
  WHERE id = current_user_id;
  
  IF current_user_email IS NULL THEN
    RAISE EXCEPTION 'User not found in auth';
  END IF;
  
  IF LOWER(current_user_email) != LOWER(allowed_email) THEN
    RAISE EXCEPTION 'Email mismatch. Your email does not match the allowed email.';
  END IF;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (current_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  INSERT INTO public.admin_audit_logs (action, admin_user_id, target_id, target_type, metadata)
  VALUES ('bootstrap_first_admin', current_user_id, current_user_id::text, 'user', jsonb_build_object('email', current_user_email));
  
  RETURN true;
END;
$$;

-- 3. Seed feature_flags singleton
INSERT INTO public.feature_flags (id, maintenance_mode, enable_waitlist, enable_billing, enable_shop, admin_bootstrap_used)
VALUES (1, false, false, false, false, false)
ON CONFLICT (id) DO NOTHING;

-- 4. Seed minimal tarot spreads (required by the reading flow)
INSERT INTO public.tarot_spreads (id, name, name_fr, description, description_fr, card_count, positions)
VALUES 
  ('single', 'Single Card', 'Carte unique', 'Draw a single card for quick guidance.', 'Tirez une seule carte pour une guidance rapide.', 1, '[{"index":0,"label":"Card","label_fr":"Carte"}]'::jsonb),
  ('three-card', 'Three Card Spread', 'Tirage en trois cartes', 'Past, Present, Future reading.', 'Tirage Passé, Présent, Futur.', 3, '[{"index":0,"label":"Past","label_fr":"Passé"},{"index":1,"label":"Present","label_fr":"Présent"},{"index":2,"label":"Future","label_fr":"Futur"}]'::jsonb),
  ('celtic-cross', 'Celtic Cross', 'Croix celtique', 'The classic 10-card spread for deep insight.', 'Le tirage classique en 10 cartes pour une vision approfondie.', 10, '[{"index":0,"label":"Present","label_fr":"Présent"},{"index":1,"label":"Challenge","label_fr":"Défi"},{"index":2,"label":"Past","label_fr":"Passé"},{"index":3,"label":"Future","label_fr":"Futur"},{"index":4,"label":"Above","label_fr":"Dessus"},{"index":5,"label":"Below","label_fr":"Dessous"},{"index":6,"label":"Advice","label_fr":"Conseil"},{"index":7,"label":"External","label_fr":"Externe"},{"index":8,"label":"Hopes","label_fr":"Espoirs"},{"index":9,"label":"Outcome","label_fr":"Issue"}]'::jsonb)
ON CONFLICT (id) DO NOTHING;