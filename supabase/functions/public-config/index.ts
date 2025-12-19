import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'public, max-age=30', // Cache for 30 seconds
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    console.log(`[public-config] Method not allowed: ${req.method}`);
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    console.log('[public-config] Fetching public configuration...');

    // Use service role to bypass RLS (since this is a public endpoint)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('feature_flags')
      .select('maintenance_mode, enable_waitlist')
      .eq('id', 1)
      .single();

    if (error) {
      console.error('[public-config] Database error:', error);
      throw error;
    }

    // Return only the safe public fields
    const publicConfig = {
      maintenance_mode: data?.maintenance_mode ?? false,
      enable_waitlist: data?.enable_waitlist ?? false,
    };

    console.log('[public-config] Returning config:', publicConfig);

    return new Response(
      JSON.stringify(publicConfig),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('[public-config] Error:', error);
    
    // Return safe defaults on error (fail open for maintenance check)
    return new Response(
      JSON.stringify({ 
        maintenance_mode: false, 
        enable_waitlist: false,
        error: 'Failed to fetch configuration' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
