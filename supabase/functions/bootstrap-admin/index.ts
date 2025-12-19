import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-bootstrap-token',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // POST only
  if (req.method !== 'POST') {
    console.error('[bootstrap-admin] Method not allowed:', req.method);
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Get required environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const expectedToken = Deno.env.get('ADMIN_BOOTSTRAP_TOKEN');
    const expectedEmail = Deno.env.get('ADMIN_BOOTSTRAP_EMAIL');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[bootstrap-admin] Missing Supabase configuration');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!expectedToken || !expectedEmail) {
      console.error('[bootstrap-admin] Missing bootstrap secrets');
      return new Response(
        JSON.stringify({ error: 'Bootstrap not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate bootstrap token from header
    const providedToken = req.headers.get('x-admin-bootstrap-token');
    if (!providedToken || providedToken !== expectedToken) {
      console.error('[bootstrap-admin] Invalid or missing bootstrap token');
      return new Response(
        JSON.stringify({ error: 'Invalid bootstrap token' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate JWT - get user from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[bootstrap-admin] Missing or invalid Authorization header');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const jwt = authHeader.replace('Bearer ', '');
    
    // Create Supabase client with user's JWT to get their identity
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') || '', {
      global: { headers: { Authorization: `Bearer ${jwt}` } }
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    
    if (userError || !user) {
      console.error('[bootstrap-admin] Invalid JWT:', userError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email matches expected admin email
    if (user.email?.toLowerCase() !== expectedEmail.toLowerCase()) {
      console.error('[bootstrap-admin] Email mismatch:', user.email, 'expected:', expectedEmail);
      return new Response(
        JSON.stringify({ error: 'Email not authorized for bootstrap' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client for privileged operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check if bootstrap has already been used (one-shot protection)
    const { data: flagsData, error: flagsError } = await supabaseAdmin
      .from('feature_flags')
      .select('admin_bootstrap_used')
      .eq('id', 1)
      .single();

    if (flagsError) {
      console.error('[bootstrap-admin] Error checking bootstrap flag:', flagsError.message);
      return new Response(
        JSON.stringify({ error: 'Failed to check bootstrap status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (flagsData?.admin_bootstrap_used === true) {
      console.error('[bootstrap-admin] Bootstrap already used - one-shot protection');
      return new Response(
        JSON.stringify({ error: 'Bootstrap has already been used. This is a one-time operation.' }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Upsert admin role for the authenticated user
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .upsert(
        { user_id: user.id, role: 'admin' },
        { onConflict: 'user_id,role' }
      );

    if (roleError) {
      console.error('[bootstrap-admin] Error assigning admin role:', roleError.message);
      return new Response(
        JSON.stringify({ error: 'Failed to assign admin role' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark bootstrap as used (one-shot)
    const { error: updateFlagError } = await supabaseAdmin
      .from('feature_flags')
      .update({ admin_bootstrap_used: true })
      .eq('id', 1);

    if (updateFlagError) {
      console.error('[bootstrap-admin] Error updating bootstrap flag:', updateFlagError.message);
      // Don't fail here - admin role is already assigned
    }

    // Log the action in audit logs
    const { error: auditError } = await supabaseAdmin
      .from('admin_audit_logs')
      .insert({
        action: 'bootstrap_admin',
        admin_user_id: user.id,
        target_id: user.id,
        target_type: 'user',
        metadata: {
          email: user.email,
          timestamp: new Date().toISOString(),
          method: 'edge_function'
        }
      });

    if (auditError) {
      console.error('[bootstrap-admin] Error logging audit:', auditError.message);
      // Don't fail - role assignment succeeded
    }

    console.log('[bootstrap-admin] SUCCESS - Admin role assigned to:', user.email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Admin role successfully assigned',
        user_id: user.id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[bootstrap-admin] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
