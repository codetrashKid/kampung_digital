import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb, isDbConfigured } from "./db";
import { getCurrentCommunity, type Community } from "./queries";
import { MIN_SECRET_LENGTH, SESSION_COOKIE, SESSION_TTL_MS, createSessionToken, verifySessionToken } from "./session";

export type AdminContext = {
  user: { id: string; full_name: string; email: string | null };
  community: Community;
  role: "super_admin" | "admin_lingkungan" | "pengurus";
};

export function getAuthSecret(): string {
  return process.env.AUTH_SECRET ?? "";
}

export function isAuthConfigured(): boolean {
  return getAuthSecret().length >= MIN_SECRET_LENGTH;
}

/** Aturan otorisasi: super admin platform, atau pengurus/admin lingkungan yang aktif di lingkungan ini. */
export function resolveAdminRole(
  platformRole: string,
  memberRole: string | null,
  memberStatus: string | null,
): AdminContext["role"] | null {
  if (platformRole === "super_admin") return "super_admin";
  if (memberStatus !== "active") return null;
  if (memberRole === "admin_lingkungan" || memberRole === "pengurus") return memberRole;
  return null;
}

type UserRow = {
  id: string;
  full_name: string;
  email: string | null;
  platform_role: string;
  member_role: string | null;
  member_status: string | null;
};

/** Memuat pengguna beserta perannya di lingkungan; null bila tidak berhak jadi admin. */
export async function loadAdmin(userId: string, community: Community): Promise<AdminContext | null> {
  const sql = getDb();
  const rows = await sql<UserRow[]>`
    select u.id, u.full_name, u.email, u.platform_role,
           m.role as member_role, m.status as member_status
    from users u
    left join community_members m on m.user_id = u.id and m.community_id = ${community.id}
    where u.id = ${userId} and u.deleted_at is null
    limit 1`;
  const u = rows[0];
  if (!u) return null;
  const role = resolveAdminRole(u.platform_role, u.member_role, u.member_status);
  if (!role) return null;
  return { user: { id: u.id, full_name: u.full_name, email: u.email }, community, role };
}

/** Admin yang sedang login (dicek ulang ke database di setiap request), atau null. */
export const getAdmin = cache(async (): Promise<AdminContext | null> => {
  if (!isDbConfigured() || !isAuthConfigured()) return null;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const userId = verifySessionToken(token, getAuthSecret());
  if (!userId) return null;
  const community = await getCurrentCommunity();
  if (!community) return null;
  return loadAdmin(userId, community);
});

/** Wajib dipanggil di setiap halaman dan server action admin. */
export async function requireAdmin(): Promise<AdminContext> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

/** Untuk fitur tingkat platform (mis. rilis aplikasi): hanya super_admin. */
export async function requireSuperAdmin(): Promise<AdminContext> {
  const admin = await requireAdmin();
  if (admin.role !== "super_admin") redirect("/admin");
  return admin;
}

export async function startSession(userId: string): Promise<void> {
  const token = createSessionToken(userId, getAuthSecret());
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function endSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
