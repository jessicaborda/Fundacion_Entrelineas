import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

export const COOKIE_NAME = 'entrelineas_session';

function getSecret() {
  const secret = import.meta.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET no configurado');
  return new TextEncoder().encode(secret);
}

export async function signToken(payload: { id: string; email: string; name: string }) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('8h')
    .setIssuedAt()
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<{ id: string; email: string; name: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as { id: string; email: string; name: string };
  } catch {
    return null;
  }
}

export function getTokenFromRequest(request: Request): string | null {
  const cookie = request.headers.get('cookie') ?? '';
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  if (match) return decodeURIComponent(match[1]);

  const auth = request.headers.get('authorization') ?? '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);

  return null;
}

export async function getUserFromRequest(request: Request) {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifyToken(token);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
