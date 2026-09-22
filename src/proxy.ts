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
        const raw = Buffer.from(sessionCookie.value, 'base64').toString('utf-8');
        const session = JSON.parse(raw);
        if (session.email && session.role === 'super_admin') {
          isAuthenticated = true;
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
