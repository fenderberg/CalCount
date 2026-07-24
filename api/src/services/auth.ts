import { createHmac, timingSafeEqual } from 'node:crypto';

const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 dagen

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error('AUTH_SECRET niet geconfigureerd');
  return s;
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('hex');
}

/** Simpele single-user login: vaste username/wachtwoord uit env, geen users-tabel. */
export function checkCredentials(username: string, password: string): boolean {
  const expectedUser = process.env.AUTH_USERNAME ?? '';
  const expectedPass = process.env.AUTH_PASSWORD ?? '';
  // Lengte-gelijke buffers vereist voor timingSafeEqual; anders altijd false
  // (voorkomt een crash op mismatch i.p.v. een timing-neutrale afwijzing).
  const userOk =
    username.length === expectedUser.length &&
    timingSafeEqual(Buffer.from(username), Buffer.from(expectedUser));
  const passOk =
    password.length === expectedPass.length &&
    timingSafeEqual(Buffer.from(password), Buffer.from(expectedPass));
  return userOk && passOk;
}

/** Stateless sessietoken: base64url-payload + HMAC-handtekening, geen sessieopslag nodig. */
export function createSessionToken(): string {
  const exp = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = Buffer.from(JSON.stringify({ exp })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;
  const expected = sign(payload);
  if (
    expected.length !== signature.length ||
    !timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  ) {
    return false;
  }
  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return typeof exp === 'number' && exp > Date.now();
  } catch {
    return false;
  }
}

export function parseCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

export function sessionCookieHeader(token: string): string {
  const secure = process.env.COOKIE_SECURE === 'true';
  const attrs = [
    `session=${token}`,
    'HttpOnly',
    'Path=/',
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
    `SameSite=${secure ? 'None' : 'Lax'}`,
  ];
  if (secure) attrs.push('Secure');
  return attrs.join('; ');
}

export function clearSessionCookieHeader(): string {
  const secure = process.env.COOKIE_SECURE === 'true';
  const attrs = ['session=', 'HttpOnly', 'Path=/', 'Max-Age=0', `SameSite=${secure ? 'None' : 'Lax'}`];
  if (secure) attrs.push('Secure');
  return attrs.join('; ');
}
