import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Cache-Control": "public, max-age=30",
};

const SAFE_DEFAULTS = {
  maintenance_mode: false,
  enable_waitlist: false,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    console.log(`[public-config] Method not allowed: ${req.method}`);
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    console.log("[public-config] Fetching public configuration...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[public-config] Missing required secrets", {
        hasSupabaseUrl: !!supabaseUrl,
        hasServiceRoleKey: !!supabaseServiceKey,
      });

      return new Response(JSON.stringify(SAFE_DEFAULTS), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from("feature_flags")
      .select("maintenance_mode, enable_waitlist")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      console.error("[public-config] Database error:", error);

      return new Response(JSON.stringify(SAFE_DEFAULTS), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const publicConfig = {
      maintenance_mode: data?.maintenance_mode ?? false,
      enable_waitlist: data?.enable_waitlist ?? false,
    };

    console.log("[public-config] Returning config:", publicConfig);

    return new Response(JSON.stringify(publicConfig), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[public-config] Unexpected error:", error);

    return new Response(JSON.stringify(SAFE_DEFAULTS), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
