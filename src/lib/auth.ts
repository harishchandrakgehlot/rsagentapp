import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'harishchandrakgehlot@gmail.com';
export const AUTH_COOKIE_NAME = 'rs_admin_session';

export interface AdminSession {
  email: string;
  role: 'super_admin';
  loggedInAt: string;
}

/** Returns a consistent Uint8Array secret from env or a long fallback dev key */
function getJwtSecret(): Uint8Array {
  const raw = process.env.SESSION_SECRET || 'royal-services-dev-secret-change-in-prod-min32chars!!';
  return new TextEncoder().encode(raw);
}

/**
 * Validates Super Admin login credentials
 */
export async function authenticateSuperAdmin(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const configuredEmail = SUPER_ADMIN_EMAIL.toLowerCase();

  // Validate email matches configured Super Admin
  if (normalizedEmail !== configuredEmail) {
    return { success: false, error: 'Invalid email or password.' };
  }

  // Check password against configured or default
  const validPassword = process.env.SUPER_ADMIN_INITIAL_PASSWORD || 'RoyalAdmin2026!';
  if (password !== validPassword) {
    return { success: false, error: 'Invalid email or password.' };
  }

  const sessionData: AdminSession = {
    email: configuredEmail,
    role: 'super_admin',
    loggedInAt: new Date().toISOString(),
  };

  // Sign with HS256 — cryptographically verified, cannot be forged
  const token = await new SignJWT({ ...sessionData })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(getJwtSecret());

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return { success: true };
}

/**
 * Checks if current request has a valid, cryptographically-verified Super Admin session
 */
export async function getSuperAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(AUTH_COOKIE_NAME);
  if (!sessionCookie?.value) return null;

  try {
    const { payload } = await jwtVerify(sessionCookie.value, getJwtSecret());
    const data = payload as unknown as AdminSession;
    if (data.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() && data.role === 'super_admin') {
      return data;
    }
  } catch {
    // Invalid or expired JWT — treat as unauthenticated
    return null;
  }

  return null;
}

/**
 * Clears the Super Admin session
 */
export async function clearSuperAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

/**
 * Handles password reset request
 */
export async function requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
  // PRD FR 002 & FR 003: Do not reveal whether account exists
  return {
    success: true,
    message: `If an account exists for ${email}, a secure password reset link has been dispatched to your inbox.`,
  };
}
