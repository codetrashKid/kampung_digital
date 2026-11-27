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

export type EventItem = {
  id: string;
  title: string;
  description: string | null;
  location_text: string | null;
  starts_at: Date;
  ends_at: Date | null;
};

/** Agenda yang akan datang (atau sedang berlangsung) di sebuah lingkungan. */
export async function listUpcomingEvents(communityId: string, limit = 4): Promise<EventItem[]> {
  const sql = getDb();
  return sql<EventItem[]>`
    select id, title, description, location_text, starts_at, ends_at
    from events
    where community_id = ${communityId} and status = 'active' and deleted_at is null
      and coalesce(ends_at, starts_at + interval '3 hours') >= now()
    order by starts_at
    limit ${limit}`;
}

/** Jumlah usaha aktif per kategori di sebuah lingkungan. */
export async function listCategoriesWithCount(communityId: string): Promise<(Category & { total: number })[]> {
  const sql = getDb();
  return sql<(Category & { total: number })[]>`
    select c.id, c.slug, c.name, c.icon,
           (select count(*)::int from businesses b
             where b.category_id = c.id and b.community_id = ${communityId}
               and b.status = 'active' and b.deleted_at is null) as total
    from categories c
    where c.is_active
    order by c.sort_order, c.name`;
}

// ---------- Laporan warga (kirim dari form publik) ----------

/** Jumlah laporan dari hash IP yang sama dalam sejam terakhir (pembatasan spam tanpa state di server). */
export async function countRecentReportsByIp(ipHash: string, minutes = 60): Promise<number> {
  const sql = getDb();
  const [row] = await sql<{ n: number }[]>`
    select count(*)::int as n from reports
    where ip_hash = ${ipHash} and created_at > now() - make_interval(mins => ${minutes})`;
  return row.n;
}

export async function createReport(
  communityId: string,
  v: {
    category: string;
    title: string;
    description: string;
    location_text: string | null;
    reporter_name: string | null;
    reporter_phone: string | null;
  },
  ipHash: string | null,
): Promise<string> {
  const sql = getDb();
  const [row] = await sql<{ id: string }[]>`
    insert into reports (community_id, category, title, description, location_text, reporter_name, reporter_phone, ip_hash)
    values (${communityId}, ${v.category}, ${v.title}, ${v.description}, ${v.location_text},
            ${v.reporter_name}, ${v.reporter_phone}, ${ipHash})
    returning id`;
  return row.id;
}

export type PublicReport = {
  id: string;
  category: string;
  title: string;
  description: string;
  location_text: string | null;
  status: string;
  created_at: Date;
};

/** Laporan yang disetujui pengurus untuk tampil publik. Tidak pernah memuat data pelapor. */
export async function listPublicReports(
  communityId: string,
  opts: { status?: string; category?: string; limit?: number } = {},
): Promise<PublicReport[]> {
  const sql = getDb();
  const limit = Math.min(Math.max(opts.limit ?? 30, 1), 100);
  return sql<PublicReport[]>`
    select id, category, title, description, location_text, status::text as status, created_at
    from reports
    where community_id = ${communityId} and is_public and deleted_at is null and status <> 'ditolak'
      ${opts.status ? sql`and status = ${opts.status}::report_status` : sql``}
      ${opts.category ? sql`and category = ${opts.category}` : sql``}
    order by created_at desc
    limit ${limit}`;
}

export async function countPublicReportsByStatus(communityId: string): Promise<Record<string, number>> {
  const sql = getDb();
  const rows = await sql<{ status: string; n: number }[]>`
    select status::text as status, count(*)::int as n from reports
    where community_id = ${communityId} and is_public and deleted_at is null and status <> 'ditolak'
    group by status`;
  return Object.fromEntries(rows.map((r) => [r.status, r.n]));
}
