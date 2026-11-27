import { NextResponse, type NextRequest } from "next/server";
import { isDbConfigured } from "./db";
import { getCurrentCommunity, type Community } from "./queries";

/** Cache CDN singkat untuk data publik yang dibaca banyak klien (web dan mobile). */
export const PUBLIC_CACHE = { "Cache-Control": "public, max-age=0, s-maxage=30, stale-while-revalidate=60" };

type Handler = (community: Community, req: NextRequest) => Promise<NextResponse>;

/**
 * Pembungkus endpoint /api/v1 publik: 503 tanpa DATABASE_URL, 404 bila lingkungan tidak ada,
 * 500 tanpa membocorkan detail error. Logika bisnis tetap di server (satu API untuk web dan mobile).
 */
export function withCommunity(handler: Handler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    if (!isDbConfigured()) return NextResponse.json({ error: "DATABASE_URL belum diatur" }, { status: 503 });
    try {
      const community = await getCurrentCommunity();
      if (!community) return NextResponse.json({ error: "Lingkungan tidak ditemukan" }, { status: 404 });
      return await handler(community, req);
    } catch (err) {
      console.error(err);
      return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
    }
  };
}
