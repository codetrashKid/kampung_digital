import { NextResponse, type NextRequest } from "next/server";
import { PUBLIC_CACHE, withCommunity } from "@/lib/api";
import { getBusiness } from "@/lib/queries";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

/** GET /api/v1/businesses/{slug}: detail usaha beserta jam buka. */
export async function GET(req: NextRequest, ctx: Ctx) {
  const { slug } = await ctx.params;
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return NextResponse.json({ error: "Usaha tidak ditemukan" }, { status: 404 });
  return withCommunity(async (community) => {
    const data = await getBusiness(community.id, slug);
    if (!data) return NextResponse.json({ error: "Usaha tidak ditemukan" }, { status: 404 });
    return NextResponse.json({ business: data.business, hours: data.hours }, { headers: PUBLIC_CACHE });
  })(req);
}
