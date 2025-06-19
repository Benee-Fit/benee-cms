/**
 * Define which roles can access each application
 */
export const APP_ACCESS = {
  MAIN_APP: ['admin', 'mga', 'sr_broker'],
  BROKER_PORTAL: ['admin', 'mga', 'sr_broker', 'broker'],
  HR_PORTAL: ['admin', 'mga', 'sr_broker', 'broker', 'hr_admin']
};

/**
 * Check if a user has access to a specific application
 * @param appName - The application to check access for
 * @param userRoles - Array of user roles
 * @returns boolean indicating if user has access
 */
export function hasAppAccess(appName: keyof typeof APP_ACCESS, userRoles: string[]): boolean {
  if (!userRoles || !userRoles.length) return false;
  return APP_ACCESS[appName].some(role => userRoles.includes(role));
}
