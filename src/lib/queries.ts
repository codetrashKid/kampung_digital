import { getDb } from "./db";

export type Community = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

export type Category = { id: string; slug: string; name: string; icon: string | null };

export type Business = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  address: string | null;
  phone_wa: string | null;
  rating_avg: number;
  rating_count: number;
  category_name: string;
  category_slug: string;
};

export type BusinessHour = {
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  published_at: Date | null;
};

/** Lingkungan aktif untuk portal ini. Nanti bisa diganti berdasarkan subdomain. */
export async function getCurrentCommunity(): Promise<Community | null> {
  const sql = getDb();
  const slug = process.env.DEFAULT_COMMUNITY_SLUG ?? "contoh-kampung";
  const rows = await sql<Community[]>`
    select id, name, slug, description
    from communities
    where slug = ${slug} and is_active and deleted_at is null
    limit 1`;
  return rows[0] ?? null;
}

export async function listCategories(): Promise<Category[]> {
  const sql = getDb();
  return sql<Category[]>`
    select id, slug, name, icon from categories
    where is_active order by sort_order, name`;
}

export async function listBusinesses(opts: {
  communityId: string;
  q?: string;
  categorySlug?: string;
  limit?: number;
}): Promise<Business[]> {
  const sql = getDb();
  const limit = Math.min(Math.max(opts.limit ?? 24, 1), 100);
  const q = opts.q?.trim();
  const rows = await sql`
    select b.id, b.slug, b.name, b.description, b.address, b.phone_wa,
           b.rating_avg, b.rating_count,
           c.name as category_name, c.slug as category_slug
    from businesses b
    join categories c on c.id = b.category_id
    where b.community_id = ${opts.communityId}
      and b.status = 'active'
      and b.deleted_at is null
      ${q ? sql`and b.name ilike ${"%" + q + "%"}` : sql``}
      ${opts.categorySlug ? sql`and c.slug = ${opts.categorySlug}` : sql``}
    order by b.rating_count desc, b.name
    limit ${limit}`;
  return rows.map((r) => ({ ...r, rating_avg: Number(r.rating_avg) })) as unknown as Business[];
}

export async function getBusiness(communityId: string, slug: string) {
  const sql = getDb();
  const rows = await sql`
    select b.id, b.slug, b.name, b.description, b.address, b.phone_wa,
           b.rating_avg, b.rating_count,
           c.name as category_name, c.slug as category_slug
    from businesses b
    join categories c on c.id = b.category_id
    where b.community_id = ${communityId} and b.slug = ${slug}
      and b.status = 'active' and b.deleted_at is null
    limit 1`;
  if (!rows[0]) return null;
  const business = { ...rows[0], rating_avg: Number(rows[0].rating_avg) } as unknown as Business;
  const hours = await sql<BusinessHour[]>`
    select day_of_week, open_time, close_time, is_closed
    from business_hours where business_id = ${business.id}
    order by day_of_week`;
  return { business, hours };
}

export async function listAnnouncements(communityId: string, limit = 3): Promise<Announcement[]> {
  const sql = getDb();
  return sql<Announcement[]>`
    select id, title, body, published_at
    from announcements
    where community_id = ${communityId} and status = 'active' and deleted_at is null
    order by published_at desc nulls last
    limit ${limit}`;
}
