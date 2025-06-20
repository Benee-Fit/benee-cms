export const USER_ROLES = {
  ADMIN: 'org:admin',
  MGA: 'org:mga',
  SENIOR_BROKER: 'org:senior_broker',
  BROKER: 'org:broker',
  HR_ADMIN: 'org:hr_admin',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export const PORTAL_ACCESS = {
  MAIN_APP: 'main-app',
  BROKER_PORTAL: 'broker-portal',
  HR_PORTAL: 'hr-portal',
} as const;

export type PortalAccess = typeof PORTAL_ACCESS[keyof typeof PORTAL_ACCESS];

// Role hierarchy and portal access mapping
export const ROLE_PORTAL_ACCESS: Record<UserRole, PortalAccess[]> = {
  [USER_ROLES.ADMIN]: [
    PORTAL_ACCESS.MAIN_APP,
    PORTAL_ACCESS.BROKER_PORTAL,
    PORTAL_ACCESS.HR_PORTAL,
  ],
  [USER_ROLES.MGA]: [
    PORTAL_ACCESS.MAIN_APP,
    PORTAL_ACCESS.BROKER_PORTAL,
    PORTAL_ACCESS.HR_PORTAL,
  ],
  [USER_ROLES.SENIOR_BROKER]: [
    PORTAL_ACCESS.MAIN_APP,
    PORTAL_ACCESS.BROKER_PORTAL,
    PORTAL_ACCESS.HR_PORTAL,
  ],
  [USER_ROLES.BROKER]: [
    PORTAL_ACCESS.BROKER_PORTAL,
    PORTAL_ACCESS.HR_PORTAL,
  ],
  [USER_ROLES.HR_ADMIN]: [
    PORTAL_ACCESS.HR_PORTAL,
  ],
};

// Portal URLs
export const PORTAL_URLS = {
  [PORTAL_ACCESS.MAIN_APP]: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  [PORTAL_ACCESS.BROKER_PORTAL]: process.env.NEXT_PUBLIC_BROKER_PORTAL_URL || 'http://localhost:3006',
  [PORTAL_ACCESS.HR_PORTAL]: process.env.NEXT_PUBLIC_HR_PORTAL_URL || 'http://localhost:9002',
} as const;

// Helper functions
export function hasPortalAccess(role: UserRole | null | undefined, portal: PortalAccess): boolean {
  if (!role) return false;
  return ROLE_PORTAL_ACCESS[role]?.includes(portal) ?? false;
}

export function getHighestAccessPortal(role: UserRole | null | undefined): PortalAccess | null {
  if (!role) return null;
  const access = ROLE_PORTAL_ACCESS[role];
  if (!access || access.length === 0) return null;
  
  // Priority order: MAIN_APP > BROKER_PORTAL > HR_PORTAL
  if (access.includes(PORTAL_ACCESS.MAIN_APP)) return PORTAL_ACCESS.MAIN_APP;
  if (access.includes(PORTAL_ACCESS.BROKER_PORTAL)) return PORTAL_ACCESS.BROKER_PORTAL;
  if (access.includes(PORTAL_ACCESS.HR_PORTAL)) return PORTAL_ACCESS.HR_PORTAL;
  
  return null;
}

export function getPortalUrl(portal: PortalAccess): string {
  return PORTAL_URLS[portal];
}

export function getRoleBasedRedirectUrl(role: UserRole | null | undefined): string {
  const highestPortal = getHighestAccessPortal(role);
  if (!highestPortal) {
    // Default to main app sign-in if no role or access
    return `${PORTAL_URLS[PORTAL_ACCESS.MAIN_APP]}/sign-in`;
  }
  return getPortalUrl(highestPortal);
}

export function isValidRedirectForRole(role: UserRole | null | undefined, redirectUrl: string): boolean {
  if (!role || !redirectUrl) return false;
  
  // Extract the base URL from the redirect
  const url = new URL(redirectUrl, 'http://localhost');
  const baseUrl = `${url.protocol}//${url.host}`;
  
  // Check if the user has access to any portal with this base URL
  const allowedPortals = ROLE_PORTAL_ACCESS[role] || [];
  return allowedPortals.some(portal => {
    const portalUrl = new URL(PORTAL_URLS[portal]);
    const portalBaseUrl = `${portalUrl.protocol}//${portalUrl.host}`;
    return baseUrl === portalBaseUrl;
  });
}