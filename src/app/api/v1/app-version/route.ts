import { NextResponse, type NextRequest } from "next/server";
import { buildUpdateResponse, parseBuild, parsePlatform } from "@/lib/app-version";
import { isDbConfigured } from "@/lib/db";
import { getLatestReleaseAbove } from "@/lib/queries";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/app-version?platform=android&build=12
 * Dipakai aplikasi mobile saat dibuka untuk tahu apakah perlu update (opsional atau wajib).
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const platform = parsePlatform(params.get("platform"));
  const build = parseBuild(params.get("build"));
  if (!platform || !build) {
    return NextResponse.json({ error: "Parameter platform (android|ios) dan build (bilangan bulat > 0) wajib." }, { status: 400 });
  }
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "DATABASE_URL belum diatur" }, { status: 503 });
  }
  try {
    const latest = await getLatestReleaseAbove(platform, build);
    return NextResponse.json(buildUpdateResponse(platform, build, latest), {
      // Boleh di-cache CDN sebentar agar ribuan pembukaan aplikasi tidak membebani database.
      headers: { "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
