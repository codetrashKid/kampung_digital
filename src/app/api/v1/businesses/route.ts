import { NextResponse, type NextRequest } from "next/server";
import { isDbConfigured } from "@/lib/db";
import { getCurrentCommunity, listBusinesses } from "@/lib/queries";

export const dynamic = "force-dynamic";

/** GET /api/v1/businesses?q=nasi&kategori=makanan&limit=20 (dipakai web dan Flutter) */
export async function GET(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "DATABASE_URL belum diatur" }, { status: 503 });
  }
  const params = req.nextUrl.searchParams;
  const limitParam = Number.parseInt(params.get("limit") ?? "24", 10);
  const limit = Number.isFinite(limitParam) ? limitParam : 24;

  try {
    const community = await getCurrentCommunity();
    if (!community) return NextResponse.json({ error: "Lingkungan tidak ditemukan" }, { status: 404 });

    const data = await listBusinesses({
      communityId: community.id,
      q: params.get("q") ?? undefined,
      categorySlug: params.get("kategori") ?? undefined,
      limit,
    });
    return NextResponse.json({ community: community.slug, data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
