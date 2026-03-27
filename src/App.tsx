import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { MaintenanceGuard } from "@/components/layout/MaintenanceGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { validateRoutes, CANONICAL_ROUTES, LEGACY_REDIRECTS } from "@/utils/routeValidator";

import { lazy, Suspense } from "react";
import { LoadingScreen } from "@/components/ui/loading-screen";

// Public Pages — eagerly loaded (landing + auth are entry points)
import Landing from "./pages/public/Landing";
import Auth from "./pages/public/Auth";
import NotFound from "./pages/NotFound";

// Public Pages — lazy
const Disclaimer = lazy(() => import("./pages/public/Disclaimer"));
const Status = lazy(() => import("./pages/public/Status"));
const Privacy = lazy(() => import("./pages/legal/Privacy"));
const Terms = lazy(() => import("./pages/legal/Terms"));
const Imprint = lazy(() => import("./pages/legal/Imprint"));

// Protected App Pages — lazy
const Dashboard = lazy(() => import("./pages/app/Dashboard"));
const Onboarding = lazy(() => import("./pages/app/Onboarding"));
const NewReading = lazy(() => import("./pages/app/NewReading"));
const History = lazy(() => import("./pages/app/History"));
const Favorites = lazy(() => import("./pages/app/Favorites"));
const ReadingDetail = lazy(() => import("./pages/app/ReadingDetail"));
const ReadingRedirect = lazy(() => import("./pages/app/ReadingRedirect"));
const Profile = lazy(() => import("./pages/app/Profile"));

// Admin Pages — lazy (heavy, rarely visited)
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminFeatureFlags = lazy(() => import("./pages/admin/AdminFeatureFlags"));
const AdminPrompts = lazy(() => import("./pages/admin/AdminPrompts"));
const AdminAuditLogs = lazy(() => import("./pages/admin/AdminAuditLogs"));
const AdminEdgeTest = lazy(() => import("./pages/admin/AdminEdgeTest"));
const AdminCardAssets = lazy(() => import("./pages/admin/AdminCardAssets"));

const queryClient = new QueryClient();

// Validate all routes at startup (dev AND build - throws if invalid)
const allPaths = [
  ...Object.values(CANONICAL_ROUTES),
  ...Object.keys(LEGACY_REDIRECTS),
];
validateRoutes(allPaths);

// Log route dump for verification (dev only)
if (import.meta.env.DEV) {
  console.log('[ROUTE DUMP] Canonical routes:');
  console.table(Object.entries(CANONICAL_ROUTES).map(([key, path]) => ({ key, path })));
  console.log('[ROUTE DUMP] Legacy redirects:');
  console.table(Object.entries(LEGACY_REDIRECTS).map(([from, to]) => ({ from, to })));
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <MaintenanceGuard>
              <Suspense fallback={<LoadingScreen />}>
              <Routes>
                {/* ========== PUBLIC ROUTES (ASCII only) ========== */}
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/disclaimer" element={<Disclaimer />} />
                <Route path="/status" element={<Status />} />
                <Route path="/legal/privacy" element={<Privacy />} />
                <Route path="/legal/terms" element={<Terms />} />
                <Route path="/legal/imprint" element={<Imprint />} />
                
                {/* ========== PROTECTED APP ROUTES (ASCII only) ========== */}
                <Route path="/app" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/app/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/app/onboarding" element={<ProtectedRoute requireOnboarding={false}><Onboarding /></ProtectedRoute>} />
                <Route path="/app/new" element={<ProtectedRoute><NewReading /></ProtectedRoute>} />
                <Route path="/app/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
                <Route path="/app/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
                <Route path="/app/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/app/reading/:id" element={<ProtectedRoute><ReadingDetail /></ProtectedRoute>} />
                
                {/* ========== ADMIN ROUTES (ASCII only) ========== */}
                <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/admin/flags" element={<AdminRoute><AdminFeatureFlags /></AdminRoute>} />
                <Route path="/admin/prompts" element={<AdminRoute><AdminPrompts /></AdminRoute>} />
                <Route path="/admin/audit-logs" element={<AdminRoute><AdminAuditLogs /></AdminRoute>} />
                <Route path="/admin/edge-test" element={<AdminRoute><AdminEdgeTest /></AdminRoute>} />
                <Route path="/admin/card-assets" element={<AdminRoute><AdminCardAssets /></AdminRoute>} />
                
                {/* ========== LEGACY REDIRECTS (ASCII slugs only) ========== */}
                <Route path="/statut" element={<Navigate to="/status" replace />} />
                <Route path="/clause-non-responsabilite" element={<Navigate to="/disclaimer" replace />} />
                <Route path="/juridique/confidentialite" element={<Navigate to="/legal/privacy" replace />} />
                <Route path="/mentions/juridiques" element={<Navigate to="/legal/terms" replace />} />
                <Route path="/mentions-juridiques" element={<Navigate to="/legal/terms" replace />} />
                <Route path="/mentions-legales" element={<Navigate to="/legal/imprint" replace />} />
                <Route path="/app/lecture/:id" element={<ReadingRedirect />} />
                <Route path="/admin/journaux-audit" element={<Navigate to="/admin/audit-logs" replace />} />
                
                {/* ========== 404 ========== */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </Suspense>
            </MaintenanceGuard>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
