import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'


// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
    await updateSession(request);
    const cookie = request.cookies.get("authToken");
    if(!cookie) {
        return NextResponse.redirect(new URL('/auth/login', request.url))
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