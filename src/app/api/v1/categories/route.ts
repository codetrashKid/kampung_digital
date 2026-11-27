import { NextResponse } from "next/server";
import { PUBLIC_CACHE, withCommunity } from "@/lib/api";
import { listCategoriesWithCount } from "@/lib/queries";

export const dynamic = "force-dynamic";

/** GET /api/v1/categories: kategori usaha beserta jumlah usaha aktif di lingkungan ini. */
export const GET = withCommunity(async (community) => {
  const data = await listCategoriesWithCount(community.id);
  return NextResponse.json({ data }, { headers: PUBLIC_CACHE });
});
