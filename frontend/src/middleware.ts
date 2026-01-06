import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import Cookies from "js-cookie";
import { getCookieNameForPath, getCookieNameForRole } from "@/utils/auth";

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    "/superadmin/:path*",
    "/admin/:path*",
    "/teacher/:path*",
    "/student/:path*",
  ],
};

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    "/superadmin/:path*",
    "/admin/:path*",
    "/teacher/:path*",
    "/student/:path*",
  ],
};

interface LoginConfigData {
  data: {
    access_token: string;
    refresh_token: string;
    role: {
      name: string;
    };
  };
}

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isAuthPage =
    pathname.includes("/auth/") ||
    pathname.includes("/login") ||
    pathname.includes("/forgotPassword") ||
    pathname.includes("/signup") ||
    pathname.includes("/complete-registration") ||
    pathname === "/home" ||
    pathname === "/";

  if (isAuthPage) {
    return NextResponse.next();
  }

  const cookieName = getCookieNameForPath(pathname);

  if (!cookieName) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  const cookie = request.cookies.get(cookieName);
  if (!cookie) {
    return NextResponse.redirect(new URL("/home", request.url));
  } else {
    await updateSession(request, cookieName);
  }
}

export async function updateSession(request: NextRequest, cookieName: string) {
  const authToken = request.cookies.get(cookieName)?.value;
  if (!authToken) return;

  // Refresh the auth so it doesn't expire
  const expires = new Date(Date.now() + 6 * 60 * 60 * 1000);
  const res = NextResponse.next();
  res.cookies.set({
    name: cookieName,
    value: authToken,
    httpOnly: true,
    expires: expires,
  });
  return res;
}

export function handleLoginRedirectAndToken(
  data: LoginConfigData
): void {
  if (
    !data?.data?.access_token ||
    !data?.data?.refresh_token ||
    !data?.data?.role?.name
  )
    return;

  const roleName = data.data.role.name;
  const cookieName = getCookieNameForRole(roleName);
  const refreshCookieName = `${cookieName}Refresh`;

  if (!cookieName) {
    console.error(`No cookie name found for role: ${roleName}`);
    return;
  }

  // Store access token (15 minutes expiry)
  const accessTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);
  Cookies.set(cookieName, data.data.access_token, {
    expires: accessTokenExpiry,
  });

  // Store refresh token (expiry matches backend configuration)
  // Default is 7 days, but can be configured via JWT_REFRESH_TOKEN_EXPIRES_DAYS
  const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  Cookies.set(refreshCookieName, data.data.refresh_token, {
    expires: refreshTokenExpiry,
  });

  const roleToRouteMap: Record<string, string> = {
    super_admin: "/superadmin/dashboard",
    school_admin: "/admin/dashboard",
    teacher: "/teacher/students",
    student: "/student/profile",
  };

  const route = roleToRouteMap[roleName];
  if (route) {
    // Use window.location.href instead of router.push to ensure cookies are sent with the request
    // This forces a full page reload so the middleware can see the cookies
    window.location.href = route;
  }
}
