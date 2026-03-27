import { useState, useCallback } from 'react';
import { Layout } from '@/components/layout/Layout';
import { CheckCircle, AlertCircle, XCircle, HelpCircle, Clock, RefreshCw, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

type ServiceStatus = 'operational' | 'degraded' | 'down' | 'unknown';

interface ServiceCheck {
  name: string;
  status: ServiceStatus;
  latency_ms: number | null;
  detail: string | null;
}

interface HealthResponse {
  overall: ServiceStatus;
  maintenance_mode: boolean;
  checked_at: string;
  services: ServiceCheck[];
}

const SERVICE_LABELS: Record<string, string> = {
  configuration: 'Configuration',
  database: 'Base de données',
  auth: 'Authentification',
  storage: 'Stockage fichiers',
  ai_engine: 'Moteur IA',
};

const STATUS_LABELS: Record<ServiceStatus, string> = {
  operational: 'Opérationnel',
  degraded: 'Dégradé',
  down: 'Indisponible',
  unknown: 'Inconnu',
};

function StatusIcon({ status, size = 'md' }: { status: ServiceStatus; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'h-8 w-8' : size === 'md' ? 'h-5 w-5' : 'h-4 w-4';
  switch (status) {
    case 'operational':
      return <CheckCircle className={`${sizeClass} text-emerald-500`} />;
    case 'degraded':
      return <AlertCircle className={`${sizeClass} text-amber-500`} />;
    case 'down':
      return <XCircle className={`${sizeClass} text-red-500`} />;
    default:
      return <HelpCircle className={`${sizeClass} text-muted-foreground`} />;
  }
}

function StatusDot({ status }: { status: ServiceStatus }) {
  const color = {
    operational: 'bg-emerald-500',
    degraded: 'bg-amber-500',
    down: 'bg-red-500',
    unknown: 'bg-muted-foreground',
  }[status];
  return <span className={`w-2.5 h-2.5 rounded-full ${color}`} />;
}

function OverallBanner({ status, maintenance }: { status: ServiceStatus; maintenance: boolean }) {
  const styles = {
    operational: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300',
    degraded: 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300',
    down: 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300',
    unknown: 'bg-muted border-border text-muted-foreground',
  }[status];

  const message = {
    operational: 'Tous les systèmes sont opérationnels',
    degraded: maintenance ? 'Maintenance en cours — certains services sont indisponibles' : 'Certains services rencontrent des problèmes',
    down: 'Plusieurs services sont indisponibles',
    unknown: 'Impossible de déterminer l\'état des services',
  }[status];

  return (
    <div className={`p-6 rounded-2xl border-2 ${styles}`}>
      <div className="flex items-center gap-4">
        <StatusIcon status={status} size="lg" />
        <div>
          <h2 className="font-semibold text-lg">{message}</h2>
          {maintenance && (
            <p className="text-sm mt-1 flex items-center gap-1.5 opacity-80">
              <ShieldAlert className="h-3.5 w-3.5" />
              Mode maintenance activé
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Status() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('health-check');
      if (fnError) throw fnError;
      setHealth(data as HealthResponse);
      setCheckedAt(new Date().toISOString());
    } catch (err) {
      console.error('[Status] Health check failed:', err);
      setError(true);
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useState(() => { fetchHealth(); });

  const overallStatus: ServiceStatus = error ? 'unknown' : (health?.overall ?? 'unknown');

  if (loading && !health) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <Skeleton className="w-16 h-16 rounded-full mx-auto" />
              <Skeleton className="h-10 w-48 mx-auto" />
            </div>
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4 animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted">
              <StatusIcon status={overallStatus} size="lg" />
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold">
              État du service
            </h1>
          </div>

          {/* Overall banner */}
          {error ? (
            <div className="p-6 rounded-2xl border-2 bg-muted border-border text-muted-foreground">
              <div className="flex items-center gap-4">
                <HelpCircle className="h-8 w-8" />
                <div>
                  <h2 className="font-semibold text-lg text-foreground">Vérification impossible</h2>
                  <p className="text-sm mt-1">Le endpoint de santé n'a pas répondu. L'état des services est inconnu.</p>
                </div>
              </div>
            </div>
          ) : (
            <OverallBanner status={overallStatus} maintenance={health?.maintenance_mode ?? false} />
          )}

          {/* Refresh + timestamp */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {checkedAt
                ? `Vérifié le ${new Date(checkedAt).toLocaleString('fr-FR')}`
                : 'Jamais vérifié'}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchHealth}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Vérifier
            </Button>
          </div>

          {/* Services list */}
          <div className="space-y-4">
            <h3 className="font-serif text-lg font-semibold">Services</h3>
            <div className="space-y-2">
              {health?.services ? (
                health.services.map((svc) => (
                  <div
                    key={svc.name}
                    className="flex items-center justify-between p-4 rounded-lg bg-card border border-border/50"
                  >
                    <span className="font-medium">{SERVICE_LABELS[svc.name] ?? svc.name}</span>
                    <div className="flex items-center gap-3">
                      {svc.latency_ms !== null && svc.status === 'operational' && (
                        <span className="text-xs text-muted-foreground">{svc.latency_ms}ms</span>
                      )}
                      <span className="flex items-center gap-2 text-sm">
                        <StatusDot status={svc.status} />
                        {STATUS_LABELS[svc.status]}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                // No data — show unknown for all expected services
                ['Configuration', 'Base de données', 'Authentification', 'Stockage fichiers', 'Moteur IA'].map((name) => (
                  <div
                    key={name}
                    className="flex items-center justify-between p-4 rounded-lg bg-card border border-border/50"
                  >
                    <span className="font-medium">{name}</span>
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <StatusDot status="unknown" />
                      Inconnu
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Contact */}
          <div className="text-center p-6 rounded-xl bg-muted/50">
            <p className="text-sm text-muted-foreground">
              Un problème ? Contactez-nous via les informations présentes dans nos{' '}
              <a href="/legal/imprint" className="text-primary hover:underline">mentions légales</a>.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
