import { Roles } from "@/@types";

/**
 * Maps role names to their corresponding cookie names
 */
export const ROLE_COOKIE_MAP: Record<string, string> = {
  [Roles.SUPER_ADMIN]: "superAdminToken",
  [Roles.SCHOOL_ADMIN]: "adminToken",
  [Roles.TEACHER]: "teacherToken",
  [Roles.STUDENT]: "studentToken",
};

/**
 * Maps route paths to role names
 */
export const ROUTE_TO_ROLE_MAP: Record<string, string> = {
  "/superadmin": Roles.SUPER_ADMIN,
  "/admin": Roles.SCHOOL_ADMIN,
  "/teacher": Roles.TEACHER,
  "/student": Roles.STUDENT,
};

/**
 * Gets the role name from a URL path
 * @param pathname - The URL pathname
 * @returns The role name or null if not found
 */
export function getRoleFromPath(pathname: string): string | null {
  for (const [route, role] of Object.entries(ROUTE_TO_ROLE_MAP)) {
    if (pathname.startsWith(route)) {
      return role;
    }
  }
  return null;
}

/**
 * Gets the cookie name for a given role
 * @param roleName - The role name (e.g., "super_admin", "school_admin")
 * @returns The cookie name (e.g., "superAdminToken", "adminToken")
 */
export function getCookieNameForRole(roleName: string): string | null {
  return ROLE_COOKIE_MAP[roleName] || null;
}

/**
 * Gets the cookie name for a given route path
 * @param pathname - The URL pathname
 * @returns The cookie name or null if not found
 */
export function getCookieNameForPath(pathname: string): string | null {
  const role = getRoleFromPath(pathname);
  if (!role) return null;
  return getCookieNameForRole(role);
}

