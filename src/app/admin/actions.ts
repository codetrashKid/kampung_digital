"use server";

import { notFound, redirect } from "next/navigation";
import {
  createAnnouncement,
  createBusiness,
  createEvent,
  createRelease,
  setBusinessStatus,
  setReportPublic,
  setReleaseActive,
  setReportStatus,
  softDeleteRelease,
  updateRelease,
  softDeleteAnnouncement,
  softDeleteBusiness,
  softDeleteEvent,
  updateAnnouncement,
  updateBusiness,
  updateEvent,
  writeAudit,
} from "@/lib/admin-queries";
import { endSession, isAuthConfigured, loadAdmin, requireAdmin, requireSuperAdmin, startSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { getCurrentCommunity } from "@/lib/queries";
import { clientIp } from "@/lib/request";
import {
  MEMBER_ROLES,
  THROTTLE,
  THROTTLE_ERROR,
  canChangeRoles,
  canManageMember,
  isThrottled,
  parseInviteCreate,
  type MemberRole,
} from "@/lib/resident";
import {
  adminGetResident,
  countFailures,
  createInvite,
  recordFailure,
  setInviteActive,
  setMemberRole,
  setMemberStatus,
} from "@/lib/resident-queries";
import { PUBLISH_STATUSES, REPORT_STATUSES, isUuid, parseAnnouncement, parseBusiness, parseEvent, parseRelease } from "@/lib/validation";

export type FormState = { errors: string[] } | null;

const GENERIC_ERROR = "Terjadi kesalahan pada server. Coba lagi.";

function requireId(id: string): void {
  if (!isUuid(id)) notFound();
}

// ---------- Login / logout ----------

let dummyHash: string | null = null;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!isAuthConfigured()) return { errors: ["AUTH_SECRET belum diatur (minimal 32 karakter). Lihat .env.example."] };
  const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 254);
  const password = String(formData.get("password") ?? "").slice(0, 200);
  const fail = { errors: ["Email atau sandi salah."] };
  if (!email || !password) return fail;

  try {
    const ip = await clientIp();
    const accountFails = await countFailures("admin-login-akun", email, THROTTLE.windowMinutes);
    const ipFails = ip ? await countFailures("admin-login-ip", ip, THROTTLE.windowMinutes) : 0;
    if (isThrottled(accountFails, THROTTLE.accountMax) || isThrottled(ipFails, THROTTLE.ipMax)) {
      return { errors: [THROTTLE_ERROR] };
    }
    const sql = getDb();
    const rows = await sql<{ id: string; password_hash: string | null }[]>`
      select id, password_hash from users where email = ${email} and deleted_at is null limit 1`;
    const user = rows[0];
    // Selalu memverifikasi hash (palsu bila akun tidak ada) agar waktu respons tidak membocorkan akun.
    dummyHash ??= hashPassword("tidak-dipakai");
    const valid = verifyPassword(password, user?.password_hash ?? dummyHash) && Boolean(user?.password_hash);
    if (!user || !valid) {
      await recordFailure("admin-login-akun", email);
      if (ip) await recordFailure("admin-login-ip", ip);
      await sleep(500);
      return fail;
    }
    const community = await getCurrentCommunity();
    const admin = community ? await loadAdmin(user.id, community) : null;
    if (!admin) return { errors: ["Akun ini tidak punya akses admin di lingkungan ini."] };

    await sql`update users set last_login_at = now() where id = ${user.id}`;
    await startSession(user.id);
    await writeAudit(admin.community.id, user.id, "auth.login", "user", user.id);
  } catch (err) {
    console.error(err);
    return { errors: [GENERIC_ERROR] };
  }
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await endSession();
  redirect("/admin/login");
}

// ---------- Usaha ----------

export async function saveBusinessAction(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const { user, community } = await requireAdmin();
  if (id) requireId(id);
  const parsed = parseBusiness(formData);
  if (!parsed.ok) return { errors: parsed.errors };
  try {
    let entityId = id;
    if (id) {
      if (!(await updateBusiness(community.id, id, parsed.value))) notFound();
    } else {
      entityId = await createBusiness(community.id, user.id, parsed.value);
    }
    await writeAudit(community.id, user.id, id ? "business.update" : "business.create", "business", entityId!, {
      name: parsed.value.name,
    });
  } catch (err) {
    if (isNextControl(err)) throw err;
    console.error(err);
    return { errors: [GENERIC_ERROR] };
  }
  redirect("/admin/usaha?pesan=tersimpan");
}

export async function setBusinessStatusAction(id: string, status: string): Promise<void> {
  const { user, community } = await requireAdmin();
  requireId(id);
  if (!(PUBLISH_STATUSES as readonly string[]).includes(status)) notFound();
  if (!(await setBusinessStatus(community.id, id, status))) notFound();
  await writeAudit(community.id, user.id, "business.status", "business", id, { status });
  redirect("/admin/usaha?pesan=tersimpan");
}

export async function deleteBusinessAction(id: string): Promise<void> {
  const { user, community } = await requireAdmin();
  requireId(id);
  if (!(await softDeleteBusiness(community.id, id))) notFound();
  await writeAudit(community.id, user.id, "business.delete", "business", id);
  redirect("/admin/usaha?pesan=dihapus");
}

// ---------- Data warga dan kode undangan ----------

async function loadManageable(communityId: string, actor: { id: string; role: "super_admin" | "admin_lingkungan" | "pengurus" }, userId: string) {
  requireId(userId);
  const target = await adminGetResident(communityId, userId);
  if (!target) notFound();
  if (!canManageMember(actor, { id: target.user_id, role: target.role, platform_role: target.platform_role })) {
    redirect(`/admin/warga/${userId}?pesan=ditolak`);
  }
  return target;
}

export async function setMemberStatusAction(userId: string, status: "active" | "suspended"): Promise<void> {
  const { user, community, role } = await requireAdmin();
  if (status !== "active" && status !== "suspended") notFound();
  await loadManageable(community.id, { id: user.id, role }, userId);
  await setMemberStatus(community.id, userId, status);
  await writeAudit(community.id, user.id, "member.status", "user", userId, { status });
  redirect(`/admin/warga/${userId}?pesan=tersimpan`);
}

export async function setMemberRoleAction(userId: string, formData: FormData): Promise<void> {
  const { user, community, role } = await requireAdmin();
  const newRole = String(formData.get("role") ?? "");
  if (!(MEMBER_ROLES as readonly string[]).includes(newRole)) notFound();
  if (!canChangeRoles(role)) redirect(`/admin/warga/${userId}?pesan=ditolak`);
  await loadManageable(community.id, { id: user.id, role }, userId);
  await setMemberRole(community.id, userId, newRole as MemberRole);
  await writeAudit(community.id, user.id, "member.role", "user", userId, { role: newRole });
  redirect(`/admin/warga/${userId}?pesan=tersimpan`);
}

export async function createInviteAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user, community } = await requireAdmin();
  const parsed = parseInviteCreate(formData);
  if (!parsed.ok) return { errors: parsed.errors };
  try {
    const invite = await createInvite(community.id, user.id, parsed.value);
    await writeAudit(community.id, user.id, "invite.create", "invite_code", invite.id, { label: parsed.value.label ?? "" });
  } catch (err) {
    console.error(err);
    return { errors: [GENERIC_ERROR] };
  }
  redirect("/admin/undangan?pesan=dibuat");
}

export async function setInviteActiveAction(id: string, active: boolean): Promise<void> {
  const { user, community } = await requireAdmin();
  requireId(id);
  if (!(await setInviteActive(community.id, id, active))) notFound();
  await writeAudit(community.id, user.id, "invite.active", "invite_code", id, { active: String(active) });
  redirect("/admin/undangan?pesan=tersimpan");
}

// ---------- Rilis aplikasi (khusus super_admin) ----------

export async function saveReleaseAction(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const { user, community } = await requireSuperAdmin();
  if (id) requireId(id);
  const parsed = parseRelease(formData);
  if (!parsed.ok) return { errors: parsed.errors };
  try {
    let entityId = id;
    if (id) {
      if (!(await updateRelease(id, parsed.value))) notFound();
    } else {
      entityId = await createRelease(user.id, parsed.value);
    }
    await writeAudit(community.id, user.id, id ? "release.update" : "release.create", "app_release", entityId!, {
      platform: parsed.value.platform,
      build: String(parsed.value.build_number),
      mandatory: String(parsed.value.is_mandatory),
    });
  } catch (err) {
    if (isNextControl(err)) throw err;
    if ((err as { code?: string }).code === "23505") {
      return { errors: [`Build ${parsed.value.build_number} untuk ${parsed.value.platform} sudah ada.`] };
    }
    console.error(err);
    return { errors: [GENERIC_ERROR] };
  }
  redirect("/admin/rilis?pesan=tersimpan");
}

export async function setReleaseActiveAction(id: string, active: boolean): Promise<void> {
  const { user, community } = await requireSuperAdmin();
  requireId(id);
  if (!(await setReleaseActive(id, active))) notFound();
  await writeAudit(community.id, user.id, "release.active", "app_release", id, { active: String(active) });
  redirect("/admin/rilis?pesan=tersimpan");
}

export async function deleteReleaseAction(id: string): Promise<void> {
  const { user, community } = await requireSuperAdmin();
  requireId(id);
  if (!(await softDeleteRelease(id))) notFound();
  await writeAudit(community.id, user.id, "release.delete", "app_release", id);
  redirect("/admin/rilis?pesan=dihapus");
}

// ---------- Laporan warga ----------

export async function setReportStatusAction(id: string, status: string): Promise<void> {
  const { user, community } = await requireAdmin();
  requireId(id);
  if (!(REPORT_STATUSES as readonly string[]).includes(status)) notFound();
  if (!(await setReportStatus(community.id, id, status))) notFound();
  await writeAudit(community.id, user.id, "report.status", "report", id, { status });
  redirect(`/admin/laporan/${id}?pesan=tersimpan`);
}

export async function setReportPublicAction(id: string, isPublic: boolean): Promise<void> {
  const { user, community } = await requireAdmin();
  requireId(id);
  if (!(await setReportPublic(community.id, id, isPublic))) notFound();
  await writeAudit(community.id, user.id, "report.visibility", "report", id, { public: String(isPublic) });
  redirect(`/admin/laporan/${id}?pesan=tersimpan`);
}

// ---------- Pengumuman ----------

export async function saveAnnouncementAction(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const { user, community } = await requireAdmin();
  if (id) requireId(id);
  const parsed = parseAnnouncement(formData);
  if (!parsed.ok) return { errors: parsed.errors };
  try {
    let entityId = id;
    if (id) {
      if (!(await updateAnnouncement(community.id, id, parsed.value))) notFound();
    } else {
      entityId = await createAnnouncement(community.id, user.id, parsed.value);
    }
    await writeAudit(community.id, user.id, id ? "announcement.update" : "announcement.create", "announcement", entityId!);
  } catch (err) {
    if (isNextControl(err)) throw err;
    console.error(err);
    return { errors: [GENERIC_ERROR] };
  }
  redirect("/admin/pengumuman?pesan=tersimpan");
}

export async function deleteAnnouncementAction(id: string): Promise<void> {
  const { user, community } = await requireAdmin();
  requireId(id);
  if (!(await softDeleteAnnouncement(community.id, id))) notFound();
  await writeAudit(community.id, user.id, "announcement.delete", "announcement", id);
  redirect("/admin/pengumuman?pesan=dihapus");
}

// ---------- Agenda ----------

export async function saveEventAction(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const { user, community } = await requireAdmin();
  if (id) requireId(id);
  const parsed = parseEvent(formData);
  if (!parsed.ok) return { errors: parsed.errors };
  try {
    let entityId = id;
    if (id) {
      if (!(await updateEvent(community.id, id, parsed.value))) notFound();
    } else {
      entityId = await createEvent(community.id, user.id, parsed.value);
    }
    await writeAudit(community.id, user.id, id ? "event.update" : "event.create", "event", entityId!);
  } catch (err) {
    if (isNextControl(err)) throw err;
    console.error(err);
    return { errors: [GENERIC_ERROR] };
  }
  redirect("/admin/agenda?pesan=tersimpan");
}

export async function deleteEventAction(id: string): Promise<void> {
  const { user, community } = await requireAdmin();
  requireId(id);
  if (!(await softDeleteEvent(community.id, id))) notFound();
  await writeAudit(community.id, user.id, "event.delete", "event", id);
  redirect("/admin/agenda?pesan=dihapus");
}

/** notFound() dan redirect() bekerja dengan melempar error khusus; jangan ditelan oleh try/catch. */
function isNextControl(err: unknown): boolean {
  const digest = (err as { digest?: unknown } | null)?.digest;
  return typeof digest === "string" && (digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_HTTP_ERROR_FALLBACK") || digest === "NEXT_NOT_FOUND");
}
