/**
 * Route Validator - Ensures all paths are ASCII-only
 * Runs in development to catch non-ASCII routes early
 */

const ASCII_ROUTE_PATTERN = /^\/[a-z0-9/_:-]*$/;

export function validateRoutes(paths: string[]): void {
  // ALWAYS validate - both dev AND prod build (critical security gate)
  
  const invalidRoutes: string[] = [];
  
  for (const path of paths) {
    // Skip wildcard route
    if (path === '*') continue;
    
    // Check if path starts with /
    if (!path.startsWith('/')) {
      invalidRoutes.push(`"${path}" - must start with /`);
      continue;
    }
    
    // Check ASCII pattern (allows :param for dynamic segments)
    if (!ASCII_ROUTE_PATTERN.test(path)) {
      invalidRoutes.push(`"${path}" - contains non-ASCII characters (spaces, accents, apostrophes)`);
    }
  }
  
  if (invalidRoutes.length > 0) {
    const errorMessage = `[ROUTE VALIDATOR] Invalid routes detected:\n${invalidRoutes.join('\n')}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
  
  console.log('[ROUTE VALIDATOR] All routes are valid ASCII');
}

// Canonical routes for the application
export const CANONICAL_ROUTES = {
  // Public
  HOME: '/',
  AUTH: '/auth',
  DISCLAIMER: '/disclaimer',
  STATUS: '/status',
  LEGAL_PRIVACY: '/legal/privacy',
  LEGAL_TERMS: '/legal/terms',
  LEGAL_IMPRINT: '/legal/imprint',
  
  // Private (auth required)
  APP: '/app',
  APP_ONBOARDING: '/app/onboarding',
  APP_NEW: '/app/new',
  APP_HISTORY: '/app/history',
  APP_FAVORITES: '/app/favorites',
  APP_READING: '/app/reading/:id',
  APP_PROFILE: '/app/profile',
  
  // Admin (admin only)
  ADMIN: '/admin',
  ADMIN_FLAGS: '/admin/flags',
  ADMIN_PROMPTS: '/admin/prompts',
  ADMIN_AUDIT_LOGS: '/admin/audit-logs',
  ADMIN_EDGE_TEST: '/admin/edge-test',
} as const;

// Legacy redirect mappings (from -> to) - ALL ASCII ONLY
export const LEGACY_REDIRECTS: Record<string, string> = {
  '/statut': '/status',
  '/clause-non-responsabilite': '/disclaimer',
  '/juridique/confidentialite': '/legal/privacy',
  '/mentions/juridiques': '/legal/terms',
  '/mentions-juridiques': '/legal/terms',
  '/mentions-legales': '/legal/imprint',
  '/app/lecture/:id': '/app/reading/:id',
  '/admin/journaux-audit': '/admin/audit-logs',
};
