import { SignJWT, jwtVerify } from 'jose';
import { createHmac, timingSafeEqual } from 'crypto';

const AGENT_AUTH_SECRET = process.env.SESSION_SECRET || 'royal-services-agent-otp-secret-32-chars-minimum-required!!';

function getSecretBytes(): Uint8Array {
  return new TextEncoder().encode(AGENT_AUTH_SECRET);
}

/**
 * Computes a timing-safe HMAC hash of the OTP bound to the normalized phone number
 */
function hashOtp(phone: string, otp: string): string {
  return createHmac('sha256', AGENT_AUTH_SECRET)
    .update(`${phone}:${otp.trim()}`)
    .digest('hex');
}

/**
 * Creates a stateless signed JWT session token valid for 10 minutes containing the OTP hash
 */
export async function createAgentOtpSession(phone: string, otp: string): Promise<string> {
  const otpHash = hashOtp(phone, otp);

  return await new SignJWT({ phone, otpHash })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('10m')
    .setIssuedAt()
    .sign(getSecretBytes());
}

/**
 * Verifies the OTP against the signed session token
 */
export async function verifyAgentOtpSession(
  sessionToken: string,
  enteredOtp: string
): Promise<{ success: boolean; phone?: string; error?: string }> {
  try {
    const { payload } = await jwtVerify(sessionToken, getSecretBytes());
    const phone = payload.phone as string;
    const expectedHash = payload.otpHash as string;

    if (!phone || !expectedHash) {
      return { success: false, error: 'Invalid session token format.' };
    }

    const calculatedHash = hashOtp(phone, enteredOtp);

    const match =
      calculatedHash.length === expectedHash.length &&
      timingSafeEqual(Buffer.from(calculatedHash), Buffer.from(expectedHash));

    if (!match) {
      return { success: false, error: 'Invalid verification code. Please check the OTP sent to your WhatsApp.' };
    }

    return { success: true, phone };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Session expired or invalid.';
    if (msg.includes('exp') || msg.includes('expired')) {
      return { success: false, error: 'OTP has expired. Please request a new verification code.' };
    }
    return { success: false, error: 'Invalid or expired OTP session. Please request a new code.' };
  }
}

/**
 * Creates a 7-day authenticated agent tracking token
 */
export async function createAgentAuthToken(phone: string): Promise<string> {
  return await new SignJWT({ phone, role: 'agent' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(getSecretBytes());
}

/**
 * Validates an agent auth token and returns the authenticated phone number
 */
export async function verifyAgentAuthToken(
  token: string
): Promise<{ success: boolean; phone?: string; error?: string }> {
  try {
    const { payload } = await jwtVerify(token, getSecretBytes());
    const phone = payload.phone as string;
    if (!phone) {
      return { success: false, error: 'Invalid token payload.' };
    }
    return { success: true, phone };
  } catch {
    return { success: false, error: 'Agent session expired or invalid. Please verify via WhatsApp OTP.' };
  }
}
