import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_COOKIE_NAME = 'rs_admin_session';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin routes
  if (pathname.startsWith('/admin')) {
    const isLoginPage = pathname === '/admin/login';
    const sessionCookie = request.cookies.get(AUTH_COOKIE_NAME);

    let isAuthenticated = false;
    if (sessionCookie?.value) {
      try {
        const val = sessionCookie.value;
        if (val.includes('.')) {
          // JWT format: header.payload.signature
          const parts = val.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
            if (payload.email && payload.role === 'super_admin') {
              isAuthenticated = true;
            }
          }
        } else {
          // Legacy Base64 JSON format
          const raw = Buffer.from(val, 'base64').toString('utf-8');
          const session = JSON.parse(raw);
          if (session.email && session.role === 'super_admin') {
            isAuthenticated = true;
          }
        }
      } catch {
        isAuthenticated = false;
      }
    }


    // If attempting to access login while already authenticated, redirect to /admin dashboard
    if (isLoginPage && isAuthenticated) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    // If attempting to access private admin pages without authentication, redirect to /admin/login
    if (!isLoginPage && !isAuthenticated) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
