import { useEffect, useState, ReactNode, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { LoadingScreen } from '@/components/ui/loading-screen';

interface ProtectedRouteProps {
  children: ReactNode;
  requireOnboarding?: boolean;
}

const MAX_PROFILE_RETRIES = 5;
const RETRY_DELAY = 300;

export function ProtectedRoute({ children, requireOnboarding = true }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);

  // Check authentication - redirect only when we're sure there's no user
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { state: { from: location.pathname }, replace: true });
    }
  }, [user, authLoading, navigate, location.pathname]);

  // Check onboarding status with retry logic for race condition
  const checkOnboardingStatus = useCallback(async (retryCount = 0): Promise<void> => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('[ProtectedRoute] Error fetching profile:', error);
        throw error;
      }
      
      // If no profile exists yet (trigger hasn't fired), retry a few times
      if (!data) {
        if (retryCount < MAX_PROFILE_RETRIES) {
          console.log(`[ProtectedRoute] Profile not found, retry ${retryCount + 1}/${MAX_PROFILE_RETRIES}`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          return checkOnboardingStatus(retryCount + 1);
        }
        // After max retries, assume not onboarded
        console.log('[ProtectedRoute] Profile not found after retries, assuming not onboarded');
        setOnboardingCompleted(false);
      } else {
        setOnboardingCompleted(data.onboarding_completed ?? false);
      }
    } catch (error) {
      console.error('[ProtectedRoute] Error checking onboarding:', error);
      // On error, allow access but assume not onboarded
      setOnboardingCompleted(false);
    } finally {
      setCheckingOnboarding(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setCheckingOnboarding(false);
      return;
    }

    if (!requireOnboarding) {
      setCheckingOnboarding(false);
      return;
    }

    setCheckingOnboarding(true);
    checkOnboardingStatus();
  }, [user, requireOnboarding, checkOnboardingStatus]);

  // Redirect to onboarding if not completed (but not if already on onboarding)
  useEffect(() => {
    if (
      !checkingOnboarding &&
      requireOnboarding &&
      onboardingCompleted === false &&
      location.pathname !== '/app/onboarding'
    ) {
      navigate('/app/onboarding', { replace: true });
    }
  }, [checkingOnboarding, requireOnboarding, onboardingCompleted, navigate, location.pathname]);

  // Show loading while checking auth or onboarding
  if (authLoading || checkingOnboarding) {
    return <LoadingScreen />;
  }

  // If no user, we're redirecting - don't render anything
  if (!user) {
    return null;
  }

  // Allow access to onboarding page regardless of onboarding status
  if (location.pathname === '/app/onboarding') {
    return <>{children}</>;
  }

  // Block access to other /app/* routes if onboarding not completed
  if (requireOnboarding && !onboardingCompleted) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}
