import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import Cookies from "js-cookie";
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

interface LoginConfigData {
  data: {
    access_token: string;
    role: {
      name: string;
    };
  };
}
  


// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
    await updateSession(request);
    const cookie = request.cookies.get("authToken");
    if(!cookie) {
        return NextResponse.redirect(new URL('/home', request.url))
    }
}

//See "Matching Paths" below to learn more
export const config = {
    matcher: ['/superadmin/:path*', '/admin/:path*', '/teacher/:path*'],    
  }

export async function updateSession(request: NextRequest) {
    const authToken = request.cookies.get("authToken")?.value;
    if (!authToken) return;

    // Refresh the auth so it doesn't expire
    const expires = new Date(Date.now() + 60 * 60 * 60 * 10);
    const res = NextResponse.next();
    res.cookies.set({
        name: "authToken",
        value: authToken,
        httpOnly: true,
        expires: expires,
    });
    return res;
}


export function handleLoginRedirectAndToken(
  data: LoginConfigData,
  router: AppRouterInstance
): void {
  if (!data?.data?.access_token || !data?.data?.role?.name) return;

  const expireToken = new Date(Date.now() + 60 * 60 * 60 * 10);
  Cookies.set("authToken", data.data.access_token, { expires: expireToken });

  const roleToRouteMap: Record<string, string> = {
    super_admin: "/superadmin/dashboard",
    school_admin: "/admin/dashboard",
    teacher: "/teacher/dashboard",
    student: "/student/dashboard",
  };

  const route = roleToRouteMap[data.data.role.name];
  if (route) {
    router.push(route);
  }
}
