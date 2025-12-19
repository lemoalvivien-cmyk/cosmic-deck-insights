import { Layout } from '@/components/layout/Layout';
import { useAdminStats } from '@/hooks/useAdminStats';
import { 
  Shield, 
  Users, 
  Sparkles, 
  CalendarDays, 
  Settings, 
  Clock,
  FileText,
  ScrollText,
  FlaskConical,
  Image as ImageIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TarotCard, DrawnCard } from '@/types/tarot';
import { useTarotCards } from '@/hooks/useTarotCards';

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: cards } = useTarotCards();

  // Create a map for quick card lookup
  const cardMap = new Map<string, TarotCard>();
  cards?.forEach(card => cardMap.set(card.id, card));

  const getCardName = (cardsJson: unknown): string => {
    try {
      const drawnCards = cardsJson as DrawnCard[];
      if (drawnCards && drawnCards.length > 0) {
        const card = cardMap.get(drawnCards[0].card_id);
        return card?.nom_fr ?? drawnCards[0].card_id;
      }
    } catch {
      return '—';
    }
    return '—';
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="font-serif text-2xl md:text-3xl font-semibold">
                  Administration
                </h1>
                <p className="text-muted-foreground">Tableau de bord</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-5 gap-4">
            <Button asChild variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <Link to="/admin/flags">
                <Settings className="h-5 w-5" />
                <span>Feature Flags</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <Link to="/admin/prompts">
                <FileText className="h-5 w-5" />
                <span>Prompts IA</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <Link to="/admin/audit-logs">
                <ScrollText className="h-5 w-5" />
                <span>Audit Logs</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <Link to="/admin/edge-test">
                <FlaskConical className="h-5 w-5" />
                <span>Tests Edge</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <Link to="/admin/card-assets">
                <ImageIcon className="h-5 w-5" />
                <span>Images Cartes</span>
              </Link>
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Utilisateurs
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-3xl font-serif font-semibold">{stats?.totalUsers ?? 0}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tirages totaux
                </CardTitle>
                <Sparkles className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-3xl font-serif font-semibold">{stats?.totalReadings ?? 0}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Aujourd'hui
                </CardTitle>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-3xl font-serif font-semibold">{stats?.todayReadings ?? 0}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Readings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Derniers tirages
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : stats?.recentReadings && stats.recentReadings.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentReadings.map((reading) => (
                    <div
                      key={reading.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {getCardName(reading.cards)}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {reading.question || 'Sans question'}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                        {new Date(reading.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Aucun tirage pour le moment
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
