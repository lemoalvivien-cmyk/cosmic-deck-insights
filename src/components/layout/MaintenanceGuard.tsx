import { ReactNode, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePublicConfig } from '@/hooks/usePublicConfig';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { LoadingScreen } from '@/components/ui/loading-screen';

interface MaintenanceGuardProps {
  children: ReactNode;
}

// Routes that are always accessible (ASCII-only, no bootstrap-admin)
const ALWAYS_ALLOWED_ROUTES = [
  '/status',
  '/statut',
  '/legal/privacy',
  '/legal/terms',
  '/legal/imprint',
  '/disclaimer',
  '/auth',
];

export function MaintenanceGuard({ children }: MaintenanceGuardProps) {
  // Use public config (via edge function) instead of direct table access
  const { data: publicConfig, isLoading: configLoading } = usePublicConfig();
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    async function checkAdmin() {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      
      setCheckingAdmin(true);
      try {
        const { data, error } = await supabase.rpc('is_admin', { _user_id: user.id });
        setIsAdmin(error ? false : !!data);
      } catch {
        setIsAdmin(false);
      } finally {
        setCheckingAdmin(false);
      }
    }
    
    checkAdmin();
  }, [user]);

  // Handle maintenance mode redirection
  useEffect(() => {
    if (configLoading || authLoading || checkingAdmin) return;
    if (!publicConfig?.maintenance_mode) return;

    const currentPath = location.pathname;

    // Always allow certain routes
    if (ALWAYS_ALLOWED_ROUTES.some(route => currentPath.startsWith(route))) {
      return;
    }

    // Allow admin routes for admins
    if (currentPath.startsWith('/admin') && isAdmin) {
      return;
    }

    // Redirect everyone else to status page
    navigate('/status', { replace: true });
  }, [publicConfig, configLoading, authLoading, checkingAdmin, isAdmin, location.pathname, navigate]);

  if (configLoading || authLoading || (user && checkingAdmin)) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}
