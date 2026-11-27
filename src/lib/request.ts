import { headers } from "next/headers";

/** IP klien dari header proxy (Vercel mengisinya). Null di lokal; pembatasan per-IP dilewati bila null. */
export async function clientIp(): Promise<string | null> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip") || null;
}
