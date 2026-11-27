import { createHash } from "node:crypto";
import { getDb } from "./db";
import { generateInviteCode, isInviteUsable, THROTTLE, type MemberRole, type ProfileInput } from "./resident";

// Query warga, kode undangan, dan pembatasan laju. Semua query ke tabel ber-community_id memfilternya.

// ---------- Pembatasan laju ----------

/** Hash (rahasia server + jenis + nilai): cukup untuk membatasi laju tanpa menyimpan IP/nomor asli. */
export function attemptKey(kind: string, value: string): string {
  return createHash("sha256").update(`${process.env.AUTH_SECRET ?? ""}|${kind}|${value}`).digest("hex");
}

export async function recordFailure(kind: string, value: string): Promise<void> {
  const sql = getDb();
  await sql`insert into auth_attempts (kind, key_hash) values (${kind}, ${attemptKey(kind, value)})`;
}

export async function countFailures(kind: string, value: string, minutes: number): Promise<number> {
  const sql = getDb();
  const [row] = await sql<{ n: number }[]>`
    select count(*)::int as n from auth_attempts
    where kind = ${kind} and key_hash = ${attemptKey(kind, value)}
      and created_at > now() - make_interval(mins => ${minutes})`;
  return row.n;
}

// ---------- Pendaftaran ----------

export class RegisterError extends Error {
  constructor(public reason: "invite" | "phone_taken") {
    super(reason);
  }
}

export type NewResident = ProfileInput & {
  code: string;
  full_name: string;
  phone: string;
  passwordHash: string;
};

/**
 * Mendaftarkan warga dalam satu transaksi: kunci baris kode, cek masih berlaku, buat akun, keanggotaan aktif,
 * profil, dan tambah pemakaian kode. Melempar RegisterError bila kode tidak sah atau nomor sudah terdaftar.
 */
export async function registerResident(communityId: string, v: NewResident): Promise<{ userId: string }> {
  const sql = getDb();
  try {
    return await sql.begin(async (tx) => {
      const invites = await tx<{ id: string; is_active: boolean; max_uses: number | null; used_count: number; expires_at: Date | null }[]>`
        select id, is_active, max_uses, used_count, expires_at from invite_codes
        where code = ${v.code} and community_id = ${communityId} and deleted_at is null
        for update`;
      const inv = invites[0];
      if (!inv || !isInviteUsable(inv)) throw new RegisterError("invite");

      const existing = await tx`select 1 from users where phone = ${v.phone}`;
      if (existing.length) throw new RegisterError("phone_taken");

      const [user] = await tx<{ id: string }[]>`
        insert into users (phone, full_name, password_hash)
        values (${v.phone}, ${v.full_name}, ${v.passwordHash}) returning id`;
      await tx`
        insert into community_members (community_id, user_id, role, status)
        values (${communityId}, ${user.id}, 'warga', 'active')`;
      await tx`
        insert into residents (community_id, user_id, address_block, house_number, rt, rw, show_in_directory, consented_at)
        values (${communityId}, ${user.id}, ${v.address_block}, ${v.house_number}, ${v.rt}, ${v.rw}, ${v.show_in_directory}, now())`;
      await tx`update invite_codes set used_count = used_count + 1 where id = ${inv.id}`;
      return { userId: user.id };
    });
  } catch (err) {
    // Balapan dua pendaftaran dengan nomor yang sama: indeks unik users.phone menolak yang kedua.
    if ((err as { code?: string }).code === "23505") throw new RegisterError("phone_taken");
    throw err;
  }
}

// ---------- Login & akun ----------

export type LoginUser = { id: string; password_hash: string | null };

export async function findUserByPhone(phone: string): Promise<LoginUser | null> {
  const sql = getDb();
  const rows = await sql<LoginUser[]>`
    select id, password_hash from users where phone = ${phone} and deleted_at is null limit 1`;
  return rows[0] ?? null;
}

export async function getMembership(communityId: string, userId: string) {
  const sql = getDb();
  const rows = await sql<{ role: MemberRole; status: string }[]>`
    select role, status from community_members where community_id = ${communityId} and user_id = ${userId} limit 1`;
  return rows[0] ?? null;
}

export async function touchLogin(userId: string): Promise<void> {
  const sql = getDb();
  await sql`update users set last_login_at = now() where id = ${userId}`;
}

export type MyAccount = {
  id: string;
  full_name: string;
  phone: string;
  platform_role: string;
  password_hash: string | null;
  role: MemberRole;
  address_block: string | null;
  house_number: string | null;
  rt: string | null;
  rw: string | null;
  show_in_directory: boolean;
};

export async function getMyAccount(communityId: string, userId: string): Promise<MyAccount | null> {
  const sql = getDb();
  const rows = await sql<MyAccount[]>`
    select u.id, u.full_name, u.phone, u.platform_role, u.password_hash, m.role,
           r.address_block, r.house_number, r.rt, r.rw, coalesce(r.show_in_directory, false) as show_in_directory
    from users u
    join community_members m on m.user_id = u.id and m.community_id = ${communityId} and m.status = 'active'
    left join residents r on r.user_id = u.id and r.community_id = ${communityId}
    where u.id = ${userId} and u.deleted_at is null
    limit 1`;
  return rows[0] ?? null;
}

export async function updateMyProfile(communityId: string, userId: string, v: ProfileInput): Promise<void> {
  const sql = getDb();
  await sql`
    insert into residents (community_id, user_id, address_block, house_number, rt, rw, show_in_directory, consented_at)
    values (${communityId}, ${userId}, ${v.address_block}, ${v.house_number}, ${v.rt}, ${v.rw}, ${v.show_in_directory}, now())
    on conflict (community_id, user_id) do update
      set address_block = excluded.address_block, house_number = excluded.house_number,
          rt = excluded.rt, rw = excluded.rw, show_in_directory = excluded.show_in_directory`;
}

export async function setPasswordHash(userId: string, hash: string): Promise<void> {
  const sql = getDb();
  await sql`update users set password_hash = ${hash} where id = ${userId}`;
}

/**
 * Hapus akun atas permintaan pemilik: data pribadi dikosongkan (anonimisasi), profil warga dihapus,
 * keanggotaan ditangguhkan. Baris users tetap ada (soft delete) agar relasi lama tidak rusak.
 */
export async function anonymizeAccount(userId: string): Promise<void> {
  const sql = getDb();
  await sql.begin(async (tx) => {
    await tx`delete from residents where user_id = ${userId}`;
    await tx`update community_members set status = 'suspended' where user_id = ${userId}`;
    await tx`
      update users set full_name = 'Warga (akun dihapus)', phone = ${"dihapus-" + userId}, email = null,
        password_hash = null, avatar_url = null, deleted_at = now()
      where id = ${userId}`;
  });
}

// ---------- Panel admin: data warga ----------

export type AdminResident = {
  user_id: string;
  full_name: string;
  role: MemberRole;
  status: string;
  address_block: string | null;
  house_number: string | null;
  rt: string | null;
  rw: string | null;
  show_in_directory: boolean;
  joined_at: Date;
};

export async function adminListResidents(communityId: string, opts: { q?: string; status?: string }) {
  const sql = getDb();
  const q = opts.q?.trim();
  return sql<AdminResident[]>`
    select u.id as user_id, u.full_name, m.role, m.status::text as status, r.address_block, r.house_number, r.rt, r.rw,
           coalesce(r.show_in_directory, false) as show_in_directory, m.joined_at
    from community_members m
    join users u on u.id = m.user_id and u.deleted_at is null
    left join residents r on r.community_id = m.community_id and r.user_id = m.user_id
    where m.community_id = ${communityId}
      ${q ? sql`and (u.full_name ilike ${"%" + q + "%"} or r.address_block ilike ${"%" + q + "%"})` : sql``}
      ${opts.status ? sql`and m.status = ${opts.status}::member_status` : sql``}
    order by u.full_name
    limit 300`;
}

export type AdminResidentDetail = AdminResident & {
  phone: string;
  email: string | null;
  platform_role: string;
  last_login_at: Date | null;
  consented_at: Date | null;
};

export async function adminGetResident(communityId: string, userId: string) {
  const sql = getDb();
  const rows = await sql<AdminResidentDetail[]>`
    select u.id as user_id, u.full_name, u.phone, u.email, u.platform_role, u.last_login_at,
           m.role, m.status::text as status, m.joined_at,
           r.address_block, r.house_number, r.rt, r.rw, coalesce(r.show_in_directory, false) as show_in_directory, r.consented_at
    from community_members m
    join users u on u.id = m.user_id and u.deleted_at is null
    left join residents r on r.community_id = m.community_id and r.user_id = m.user_id
    where m.community_id = ${communityId} and m.user_id = ${userId}
    limit 1`;
  return rows[0] ?? null;
}

export async function setMemberStatus(communityId: string, userId: string, status: "active" | "suspended"): Promise<boolean> {
  const sql = getDb();
  const rows = await sql`
    update community_members set status = ${status}::member_status
    where community_id = ${communityId} and user_id = ${userId} returning user_id`;
  return rows.length > 0;
}

export async function setMemberRole(communityId: string, userId: string, role: MemberRole): Promise<boolean> {
  const sql = getDb();
  const rows = await sql`
    update community_members set role = ${role}::member_role
    where community_id = ${communityId} and user_id = ${userId} returning user_id`;
  return rows.length > 0;
}

// ---------- Panel admin: kode undangan ----------

export type AdminInvite = {
  id: string;
  code: string;
  label: string | null;
  max_uses: number | null;
  used_count: number;
  expires_at: Date | null;
  is_active: boolean;
  created_at: Date;
};

export async function adminListInvites(communityId: string) {
  const sql = getDb();
  return sql<AdminInvite[]>`
    select id, code, label, max_uses, used_count, expires_at, is_active, created_at
    from invite_codes where community_id = ${communityId} and deleted_at is null
    order by created_at desc limit 100`;
}

export async function createInvite(
  communityId: string,
  createdBy: string,
  v: { label: string | null; max_uses: number | null; expires_in_days: number | null },
): Promise<{ id: string; code: string }> {
  const sql = getDb();
  // Tabrakan kode sangat jarang (32^8), tetapi indeks unik menjaganya; ulangi bila terjadi.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateInviteCode();
    try {
      const [row] = await sql<{ id: string }[]>`
        insert into invite_codes (community_id, code, label, max_uses, expires_at, created_by)
        values (${communityId}, ${code}, ${v.label}, ${v.max_uses},
                ${v.expires_in_days === null ? null : sql`now() + make_interval(days => ${v.expires_in_days})`}, ${createdBy})
        returning id`;
      return { id: row.id, code };
    } catch (err) {
      if ((err as { code?: string }).code !== "23505") throw err;
    }
  }
  throw new Error("Gagal membuat kode undangan unik");
}

export async function setInviteActive(communityId: string, id: string, active: boolean): Promise<boolean> {
  const sql = getDb();
  const rows = await sql`
    update invite_codes set is_active = ${active}
    where community_id = ${communityId} and id = ${id} and deleted_at is null returning id`;
  return rows.length > 0;
}

export { THROTTLE };
