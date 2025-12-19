import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ScrollText, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  Filter,
  Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AuditLog {
  id: string;
  action: string;
  admin_user_id: string | null;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const PAGE_SIZE = 20;

const ACTION_COLORS: Record<string, string> = {
  'update_feature_flag': 'bg-blue-500',
  'update_prompt_template': 'bg-purple-500',
  'reset_prompt_templates': 'bg-orange-500',
  'rate_limit_hit': 'bg-red-500',
  'tarot_interpretation_generated': 'bg-green-500',
  'edge_test_failure': 'bg-red-500',
  'bootstrap_first_admin': 'bg-yellow-500',
};

const ACTION_LABELS: Record<string, string> = {
  'update_feature_flag': 'Feature Flag MAJ',
  'update_prompt_template': 'Prompt MAJ',
  'reset_prompt_templates': 'Prompts Reset',
  'rate_limit_hit': 'Rate Limit',
  'tarot_interpretation_generated': 'Interprétation',
  'edge_test_failure': 'Test Échoué',
  'bootstrap_first_admin': 'Bootstrap Admin',
};

export default function AdminAuditLogs() {
  const [page, setPage] = useState(0);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-audit-logs', page, actionFilter, dateFrom],
    queryFn: async () => {
      let query = supabase
        .from('admin_audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }

      if (dateFrom) {
        query = query.gte('created_at', `${dateFrom}T00:00:00`);
      }

      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;
      return { logs: data as AuditLog[], total: count || 0 };
    },
  });

  // Get unique actions for filter
  const { data: actions } = useQuery({
    queryKey: ['admin-audit-log-actions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_audit_logs')
        .select('action')
        .limit(1000);

      if (error) throw error;
      const unique = [...new Set(data.map(d => d.action))];
      return unique.sort();
    },
  });

  // Filter by search
  const filteredLogs = data?.logs.filter(log => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.target_type?.toLowerCase().includes(q) ||
      log.target_id?.toLowerCase().includes(q) ||
      JSON.stringify(log.metadata).toLowerCase().includes(q)
    );
  }) || [];

  const totalPages = Math.ceil((data?.total || 0) / PAGE_SIZE);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">Erreur lors du chargement des logs</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <ScrollText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="font-serif text-2xl md:text-3xl font-semibold">
                  Audit Logs
                </h1>
                <p className="text-muted-foreground">
                  {data?.total || 0} entrées au total
                </p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link to="/admin">← Dashboard</Link>
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtres
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Toutes les actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les actions</SelectItem>
                    {actions?.map(action => (
                      <SelectItem key={action} value={action}>
                        {ACTION_LABELS[action] || action}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      setPage(0);
                    }}
                    className="w-[150px]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logs Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-medium">Date</th>
                      <th className="text-left p-4 font-medium">Action</th>
                      <th className="text-left p-4 font-medium">Type</th>
                      <th className="text-left p-4 font-medium">Target</th>
                      <th className="text-left p-4 font-medium">Metadata</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                          Aucun log trouvé
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => (
                        <tr key={log.id} className="border-b hover:bg-muted/30">
                          <td className="p-4 whitespace-nowrap">
                            <span className="text-xs text-muted-foreground">
                              {new Date(log.created_at).toLocaleString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </td>
                          <td className="p-4">
                            <Badge className={ACTION_COLORS[log.action] || 'bg-gray-500'}>
                              {ACTION_LABELS[log.action] || log.action}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <span className="text-muted-foreground">
                              {log.target_type || '—'}
                            </span>
                          </td>
                          <td className="p-4">
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {log.target_id || '—'}
                            </code>
                          </td>
                          <td className="p-4 max-w-[300px]">
                            {log.metadata ? (
                              <details className="cursor-pointer">
                                <summary className="text-xs text-muted-foreground truncate">
                                  {JSON.stringify(log.metadata).substring(0, 50)}...
                                </summary>
                                <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              </details>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </Button>
              
              <span className="text-sm text-muted-foreground">
                Page {page + 1} sur {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
