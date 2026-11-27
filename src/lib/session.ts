import { createHmac, timingSafeEqual } from "node:crypto";

// Sesi tanpa state di server (cocok untuk Vercel): token = base64url(payload).tanda-tangan HMAC.
export const SESSION_COOKIE = "kd_session";
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const MIN_SECRET_LENGTH = 32;

type Payload = { uid: string; exp: number };

function sign(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data).digest("base64url");
}

export function createSessionToken(
  userId: string,
  secret: string,
  now = Date.now(),
  ttlMs = SESSION_TTL_MS,
): string {
  if (secret.length < MIN_SECRET_LENGTH) throw new Error("AUTH_SECRET terlalu pendek");
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp: now + ttlMs } satisfies Payload)).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

/** Mengembalikan id pengguna bila token sah dan belum kedaluwarsa, selain itu null. */
export function verifySessionToken(token: string | undefined, secret: string, now = Date.now()): string | null {
  if (!token || secret.length < MIN_SECRET_LENGTH) return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra !== undefined) return null;
  const expected = Buffer.from(sign(payload, secret));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<Payload>;
    if (typeof data.uid !== "string" || typeof data.exp !== "number" || data.exp <= now) return null;
    return data.uid;
  } catch {
    return null;
  }
}
