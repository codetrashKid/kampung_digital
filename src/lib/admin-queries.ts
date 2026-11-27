import { getDb } from "./db";
import { slugify, type AnnouncementInput, type BusinessInput, type EventInput, type ReleaseInput } from "./validation";

// Query khusus panel admin. Semua query ke tabel ber-community_id WAJIB memfilternya.

export type AdminBusiness = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  address: string | null;
  phone_wa: string | null;
  status: string;
  category_id: string;
  category_name: string;
  updated_at: Date;
};

export type AdminAnnouncement = {
  id: string;
  title: string;
  body: string;
  status: string;
  published_at: Date | null;
  updated_at: Date;
};

export type AdminEvent = {
  id: string;
  title: string;
  description: string | null;
  location_text: string | null;
  starts_at: Date;
  ends_at: Date | null;
  status: string;
};

export type AdminReport = {
  id: string;
  category: string;
  title: string;
  description: string;
  location_text: string | null;
  reporter_name: string | null;
  reporter_phone: string | null;
  status: string;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
};

export type AdminRelease = {
  id: string;
  platform: "android" | "ios";
  version_name: string;
  build_number: number;
  download_url: string;
  release_notes: string | null;
  is_mandatory: boolean;
  is_active: boolean;
  created_at: Date;
};

export async function writeAudit(
  communityId: string | null,
  actorId: string | null,
  action: string,
  entityType: string,
  entityId: string,
  metadata: Record<string, string> = {},
): Promise<void> {
  const sql = getDb();
  await sql`
    insert into audit_logs (community_id, actor_id, action, entity_type, entity_id, metadata)
    values (${communityId}, ${actorId}, ${action}, ${entityType}, ${entityId}, ${sql.json(metadata)})`;
}

export async function adminCounts(communityId: string) {
  const sql = getDb();
  const [row] = await sql<{ businesses: number; draft: number; announcements: number; events: number; reports_new: number }[]>`
    select
      (select count(*)::int from businesses where community_id = ${communityId} and deleted_at is null and status = 'active') as businesses,
      (select count(*)::int from businesses where community_id = ${communityId} and deleted_at is null and status in ('draft','pending')) as draft,
      (select count(*)::int from announcements where community_id = ${communityId} and deleted_at is null and status = 'active') as announcements,
      (select count(*)::int from events where community_id = ${communityId} and deleted_at is null and status = 'active' and starts_at >= now()) as events,
      (select count(*)::int from reports where community_id = ${communityId} and deleted_at is null and status = 'baru') as reports_new`;
  return row;
}

export async function recentAudit(communityId: string, limit = 8) {
  const sql = getDb();
  return sql<{ id: string; action: string; entity_type: string; created_at: Date; actor_name: string | null }[]>`
    select a.id::text, a.action, a.entity_type, a.created_at, u.full_name as actor_name
    from audit_logs a left join users u on u.id = a.actor_id
    where a.community_id = ${communityId}
    order by a.created_at desc limit ${limit}`;
}

// ---------- Usaha ----------

export async function adminListBusinesses(communityId: string, opts: { q?: string; status?: string }) {
  const sql = getDb();
  const q = opts.q?.trim();
  return sql<AdminBusiness[]>`
    select b.id, b.slug, b.name, b.description, b.address, b.phone_wa, b.status,
           b.category_id, c.name as category_name, b.updated_at
    from businesses b join categories c on c.id = b.category_id
    where b.community_id = ${communityId} and b.deleted_at is null
      ${q ? sql`and b.name ilike ${"%" + q + "%"}` : sql``}
      ${opts.status ? sql`and b.status = ${opts.status}::publish_status` : sql``}
    order by b.updated_at desc
    limit 200`;
}

export async function adminGetBusiness(communityId: string, id: string) {
  const sql = getDb();
  const rows = await sql<AdminBusiness[]>`
    select b.id, b.slug, b.name, b.description, b.address, b.phone_wa, b.status,
           b.category_id, c.name as category_name, b.updated_at
    from businesses b join categories c on c.id = b.category_id
    where b.community_id = ${communityId} and b.id = ${id} and b.deleted_at is null
    limit 1`;
  return rows[0] ?? null;
}

async function uniqueBusinessSlug(communityId: string, name: string): Promise<string> {
  const sql = getDb();
  const base = slugify(name) || "usaha";
  const rows = await sql<{ slug: string }[]>`
    select slug from businesses
    where community_id = ${communityId} and (slug = ${base} or slug like ${base + "-%"})`;
  const taken = new Set(rows.map((r) => r.slug));
  if (!taken.has(base)) return base;
  for (let i = 2; ; i++) if (!taken.has(`${base}-${i}`)) return `${base}-${i}`;
}

export async function createBusiness(communityId: string, ownerId: string, v: BusinessInput): Promise<string> {
  const sql = getDb();
  const slug = await uniqueBusinessSlug(communityId, v.name);
  const [row] = await sql<{ id: string }[]>`
    insert into businesses (community_id, owner_id, category_id, slug, name, description, phone_wa, address, status)
    values (${communityId}, ${ownerId}, ${v.category_id}, ${slug}, ${v.name}, ${v.description}, ${v.phone_wa}, ${v.address}, ${v.status}::publish_status)
    returning id`;
  return row.id;
}

export async function updateBusiness(communityId: string, id: string, v: BusinessInput): Promise<boolean> {
  const sql = getDb();
  const rows = await sql`
    update businesses set category_id = ${v.category_id}, name = ${v.name}, description = ${v.description},
      phone_wa = ${v.phone_wa}, address = ${v.address}, status = ${v.status}::publish_status
    where community_id = ${communityId} and id = ${id} and deleted_at is null
    returning id`;
  return rows.length > 0;
}

export async function setBusinessStatus(communityId: string, id: string, status: string): Promise<boolean> {
  const sql = getDb();
  const rows = await sql`
    update businesses set status = ${status}::publish_status
    where community_id = ${communityId} and id = ${id} and deleted_at is null returning id`;
  return rows.length > 0;
}

export async function softDeleteBusiness(communityId: string, id: string): Promise<boolean> {
  const sql = getDb();
  const rows = await sql`
    update businesses set deleted_at = now()
    where community_id = ${communityId} and id = ${id} and deleted_at is null returning id`;
  return rows.length > 0;
}

// ---------- Pengumuman ----------

export async function adminListAnnouncements(communityId: string) {
  const sql = getDb();
  return sql<AdminAnnouncement[]>`
    select id, title, body, status, published_at, updated_at
    from announcements
    where community_id = ${communityId} and deleted_at is null
    order by updated_at desc limit 200`;
}

export async function adminGetAnnouncement(communityId: string, id: string) {
  const sql = getDb();
  const rows = await sql<AdminAnnouncement[]>`
    select id, title, body, status, published_at, updated_at
    from announcements
    where community_id = ${communityId} and id = ${id} and deleted_at is null limit 1`;
  return rows[0] ?? null;
}

export async function createAnnouncement(communityId: string, authorId: string, v: AnnouncementInput): Promise<string> {
  const sql = getDb();
  const [row] = await sql<{ id: string }[]>`
    insert into announcements (community_id, author_id, title, body, status, published_at)
    values (${communityId}, ${authorId}, ${v.title}, ${v.body}, ${v.status}::publish_status,
            case when ${v.status}::text = 'active' then now() else null end)
    returning id`;
  return row.id;
}

export async function updateAnnouncement(communityId: string, id: string, v: AnnouncementInput): Promise<boolean> {
  const sql = getDb();
  const rows = await sql`
    update announcements set title = ${v.title}, body = ${v.body}, status = ${v.status}::publish_status,
      published_at = case when ${v.status}::text = 'active' then coalesce(published_at, now()) else published_at end
    where community_id = ${communityId} and id = ${id} and deleted_at is null returning id`;
  return rows.length > 0;
}

export async function softDeleteAnnouncement(communityId: string, id: string): Promise<boolean> {
  const sql = getDb();
  const rows = await sql`
    update announcements set deleted_at = now()
    where community_id = ${communityId} and id = ${id} and deleted_at is null returning id`;
  return rows.length > 0;
}

// ---------- Agenda ----------

export async function adminListEvents(communityId: string) {
  const sql = getDb();
  return sql<AdminEvent[]>`
    select id, title, description, location_text, starts_at, ends_at, status
    from events
    where community_id = ${communityId} and deleted_at is null
    order by starts_at desc limit 200`;
}

export async function adminGetEvent(communityId: string, id: string) {
  const sql = getDb();
  const rows = await sql<AdminEvent[]>`
    select id, title, description, location_text, starts_at, ends_at, status
    from events
    where community_id = ${communityId} and id = ${id} and deleted_at is null limit 1`;
  return rows[0] ?? null;
}

export async function createEvent(communityId: string, authorId: string, v: EventInput): Promise<string> {
  const sql = getDb();
  const [row] = await sql<{ id: string }[]>`
    insert into events (community_id, author_id, title, description, location_text, starts_at, ends_at, status)
    values (${communityId}, ${authorId}, ${v.title}, ${v.description}, ${v.location_text},
            ${v.starts_at}, ${v.ends_at}, ${v.status}::publish_status)
    returning id`;
  return row.id;
}

export async function updateEvent(communityId: string, id: string, v: EventInput): Promise<boolean> {
  const sql = getDb();
  const rows = await sql`
    update events set title = ${v.title}, description = ${v.description}, location_text = ${v.location_text},
      starts_at = ${v.starts_at}, ends_at = ${v.ends_at}, status = ${v.status}::publish_status
    where community_id = ${communityId} and id = ${id} and deleted_at is null returning id`;
  return rows.length > 0;
}

export async function softDeleteEvent(communityId: string, id: string): Promise<boolean> {
  const sql = getDb();
  const rows = await sql`
    update events set deleted_at = now()
    where community_id = ${communityId} and id = ${id} and deleted_at is null returning id`;
  return rows.length > 0;
}

// ---------- Laporan warga ----------

export async function adminReportCounts(communityId: string): Promise<Record<string, number>> {
  const sql = getDb();
  const rows = await sql<{ status: string; n: number }[]>`
    select status::text as status, count(*)::int as n from reports
    where community_id = ${communityId} and deleted_at is null group by status`;
  return Object.fromEntries(rows.map((r) => [r.status, r.n]));
}

export async function adminListReports(communityId: string, status?: string) {
  const sql = getDb();
  return sql<AdminReport[]>`
    select id, category, title, description, location_text, reporter_name, reporter_phone, status, is_public, created_at, updated_at
    from reports
    where community_id = ${communityId} and deleted_at is null
      ${status ? sql`and status = ${status}::report_status` : sql``}
    order by created_at desc limit 200`;
}

export async function adminGetReport(communityId: string, id: string) {
  const sql = getDb();
  const rows = await sql<AdminReport[]>`
    select id, category, title, description, location_text, reporter_name, reporter_phone, status, is_public, created_at, updated_at
    from reports
    where community_id = ${communityId} and id = ${id} and deleted_at is null limit 1`;
  return rows[0] ?? null;
}

export async function setReportStatus(communityId: string, id: string, status: string): Promise<boolean> {
  const sql = getDb();
  const rows = await sql`
    update reports set status = ${status}::report_status
    where community_id = ${communityId} and id = ${id} and deleted_at is null returning id`;
  return rows.length > 0;
}

export async function setReportPublic(communityId: string, id: string, isPublic: boolean): Promise<boolean> {
  const sql = getDb();
  const rows = await sql`
    update reports set is_public = ${isPublic}
    where community_id = ${communityId} and id = ${id} and deleted_at is null returning id`;
  return rows.length > 0;
}

// ---------- Rilis aplikasi (tingkat platform, tanpa community_id) ----------

export async function adminListReleases() {
  const sql = getDb();
  return sql<AdminRelease[]>`
    select id, platform, version_name, build_number, download_url, release_notes, is_mandatory, is_active, created_at
    from app_releases where deleted_at is null
    order by platform, build_number desc limit 200`;
}

export async function adminGetRelease(id: string) {
  const sql = getDb();
  const rows = await sql<AdminRelease[]>`
    select id, platform, version_name, build_number, download_url, release_notes, is_mandatory, is_active, created_at
    from app_releases where id = ${id} and deleted_at is null limit 1`;
  return rows[0] ?? null;
}

export async function createRelease(createdBy: string, v: ReleaseInput): Promise<string> {
  const sql = getDb();
  const [row] = await sql<{ id: string }[]>`
    insert into app_releases (platform, version_name, build_number, download_url, release_notes, is_mandatory, is_active, created_by)
    values (${v.platform}::app_platform, ${v.version_name}, ${v.build_number}, ${v.download_url}, ${v.release_notes},
            ${v.is_mandatory}, ${v.is_active}, ${createdBy})
    returning id`;
  return row.id;
}

/** Platform dan nomor build tidak bisa diubah setelah dibuat. */
export async function updateRelease(id: string, v: ReleaseInput): Promise<boolean> {
  const sql = getDb();
  const rows = await sql`
    update app_releases set version_name = ${v.version_name}, download_url = ${v.download_url},
      release_notes = ${v.release_notes}, is_mandatory = ${v.is_mandatory}, is_active = ${v.is_active}
    where id = ${id} and deleted_at is null returning id`;
  return rows.length > 0;
}

export async function setReleaseActive(id: string, active: boolean): Promise<boolean> {
  const sql = getDb();
  const rows = await sql`
    update app_releases set is_active = ${active} where id = ${id} and deleted_at is null returning id`;
  return rows.length > 0;
}

export async function softDeleteRelease(id: string): Promise<boolean> {
  const sql = getDb();
  const rows = await sql`update app_releases set deleted_at = now() where id = ${id} and deleted_at is null returning id`;
  return rows.length > 0;
}
