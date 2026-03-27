import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type ServiceStatus = 'operational' | 'degraded' | 'down' | 'unknown'

interface ServiceCheck {
  name: string
  status: ServiceStatus
  latency_ms: number | null
  detail: string | null
}

interface HealthResponse {
  overall: ServiceStatus
  maintenance_mode: boolean
  checked_at: string
  services: ServiceCheck[]
}

async function checkService(name: string, fn: () => Promise<string | null>): Promise<ServiceCheck> {
  const start = Date.now()
  try {
    const detail = await fn()
    return { name, status: 'operational', latency_ms: Date.now() - start, detail }
  } catch (err) {
    return { name, status: 'down', latency_ms: Date.now() - start, detail: String(err?.message ?? err) }
  }
}

function overallStatus(services: ServiceCheck[], maintenance: boolean): ServiceStatus {
  if (maintenance) return 'degraded'
  const statuses = services.map(s => s.status)
  if (statuses.every(s => s === 'operational')) return 'operational'
  if (statuses.some(s => s === 'down')) return 'degraded'
  return 'unknown'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')

  // 1. Configuration check
  const configCheck: ServiceCheck = (supabaseUrl && serviceRoleKey && anonKey)
    ? { name: 'configuration', status: 'operational', latency_ms: 0, detail: null }
    : { name: 'configuration', status: 'down', latency_ms: 0, detail: 'Variables d\'environnement manquantes' }

  if (configCheck.status === 'down') {
    const res: HealthResponse = {
      overall: 'down',
      maintenance_mode: false,
      checked_at: new Date().toISOString(),
      services: [configCheck],
    }
    return new Response(JSON.stringify(res), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl!, serviceRoleKey!, {
    auth: { persistSession: false },
  })

  // Run checks in parallel
  const [dbCheck, authCheck, storageCheck, aiCheck, flagsResult] = await Promise.all([
    // 2. Database — lightweight query
    checkService('database', async () => {
      const { count, error } = await supabase
        .from('tarot_spreads')
        .select('*', { count: 'exact', head: true })
      if (error) throw error
      return `${count} spreads`
    }),

    // 3. Auth — check auth health via admin API
    checkService('auth', async () => {
      // List 1 user to verify auth service responds
      const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 })
      if (error) throw error
      return `service actif`
    }),

    // 4. Storage — check bucket exists
    checkService('storage', async () => {
      const { data, error } = await supabase.storage.getBucket('tarot-cards')
      if (error) throw error
      return data.public ? 'bucket public' : 'bucket privé'
    }),

    // 5. AI engine — check if API key is configured
    checkService('ai_engine', async () => {
      const apiKey = Deno.env.get('TAROT_API_KEY')
      const lovableKey = Deno.env.get('LOVABLE_API_KEY')
      if (!apiKey && !lovableKey) {
        throw new Error('Aucune clé API IA configurée')
      }
      return apiKey ? 'TAROT_API_KEY configurée' : 'LOVABLE_API_KEY configurée'
    }),

    // 6. Feature flags (for maintenance_mode)
    supabase.from('feature_flags').select('maintenance_mode').eq('id', 1).single(),
  ])

  const maintenanceMode = flagsResult.data?.maintenance_mode ?? false

  const services: ServiceCheck[] = [configCheck, dbCheck, authCheck, storageCheck, aiCheck]

  const res: HealthResponse = {
    overall: overallStatus(services, maintenanceMode),
    maintenance_mode: maintenanceMode,
    checked_at: new Date().toISOString(),
    services,
  }

  const httpStatus = res.overall === 'operational' ? 200 : res.overall === 'down' ? 503 : 200

  return new Response(JSON.stringify(res), {
    status: httpStatus,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
