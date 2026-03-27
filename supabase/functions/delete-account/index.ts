import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Authenticate user from JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Non authentifié' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUser = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    })

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Utilisateur non trouvé' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userId = user.id

    // Parse and validate confirmation
    const body = await req.json().catch(() => ({}))
    if (body.confirmation !== 'SUPPRIMER') {
      return new Response(JSON.stringify({ error: 'Confirmation requise. Envoyez {"confirmation": "SUPPRIMER"}.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Service role client for privileged operations
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })

    // 1. Delete application data
    const deletions = await Promise.allSettled([
      supabaseAdmin.from('tarot_readings').delete().eq('user_id', userId),
      supabaseAdmin.from('ai_usage_daily').delete().eq('user_id', userId),
      supabaseAdmin.from('user_roles').delete().eq('user_id', userId),
      supabaseAdmin.from('profiles').delete().eq('id', userId),
    ])

    const failedDeletions = deletions
      .map((r, i) => r.status === 'rejected' ? ['tarot_readings', 'ai_usage_daily', 'user_roles', 'profiles'][i] : null)
      .filter(Boolean)

    if (failedDeletions.length > 0) {
      console.error(`[delete-account] Failed to delete data from: ${failedDeletions.join(', ')} for user ${userId}`)
    }

    // 2. Delete the Auth user (irreversible)
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteAuthError) {
      console.error(`[delete-account] Failed to delete auth user ${userId}:`, deleteAuthError.message)
      return new Response(JSON.stringify({ error: 'Impossible de supprimer le compte. Veuillez réessayer ou contacter le support.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Audit log (best-effort, user is already deleted)
    await supabaseAdmin.from('admin_audit_logs').insert({
      action: 'user_self_delete',
      admin_user_id: null,
      target_id: userId,
      target_type: 'user',
      metadata: { email: user.email, deleted_at: new Date().toISOString() },
    }).then(({ error }) => {
      if (error) console.error('[delete-account] Audit log failed:', error.message)
    })

    console.log(`[delete-account] User ${userId} fully deleted`)

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[delete-account] Unexpected error:', err)
    return new Response(JSON.stringify({ error: 'Erreur interne. Veuillez réessayer.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
