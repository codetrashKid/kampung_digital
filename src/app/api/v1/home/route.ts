import { NextResponse } from "next/server";
import { PUBLIC_CACHE, withCommunity } from "@/lib/api";
import {
  listAnnouncements,
  listBusinesses,
  listCategoriesWithCount,
  listPublicReports,
  listUpcomingEvents,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

/** GET /api/v1/home: semua yang dibutuhkan beranda dalam satu panggilan (dipakai aplikasi mobile). */
export const GET = withCommunity(async (community) => {
  const [announcements, events, reports, categories, businesses] = await Promise.all([
    listAnnouncements(community.id, 3),
    listUpcomingEvents(community.id, 4),
    listPublicReports(community.id, { limit: 3 }),
    listCategoriesWithCount(community.id),
    listBusinesses({ communityId: community.id, limit: 6 }),
  ]);
  return NextResponse.json(
    {
      community: { name: community.name, slug: community.slug, description: community.description },
      stats: { businesses: categories.reduce((sum, c) => sum + c.total, 0), events: events.length },
      announcements,
      events,
      reports,
      categories,
      businesses,
    },
    { headers: PUBLIC_CACHE },
  );
});
