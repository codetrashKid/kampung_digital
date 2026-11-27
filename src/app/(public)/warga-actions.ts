"use server";

import { redirect } from "next/navigation";
import { writeAudit } from "@/lib/admin-queries";
import { endSession, isAuthConfigured, requireMember, startSession } from "@/lib/auth";
import { isDbConfigured } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { getCurrentCommunity } from "@/lib/queries";
import { clientIp } from "@/lib/request";
import {
  INVITE_ERROR,
  THROTTLE,
  THROTTLE_ERROR,
  isThrottled,
  parsePasswordChange,
  parseProfile,
  parseRegistration,
} from "@/lib/resident";
import {
  RegisterError,
  anonymizeAccount,
  countFailures,
  findUserByPhone,
  getMembership,
  getMyAccount,
  recordFailure,
  registerResident,
  setPasswordHash,
  touchLogin,
  updateMyProfile,
} from "@/lib/resident-queries";
import { normalizePhone } from "@/lib/validation";
import type { FormState } from "@/app/admin/actions";

const GENERIC_ERROR = "Terjadi kesalahan pada server. Coba lagi.";
const NOT_READY = "Layanan belum siap (database atau AUTH_SECRET belum diatur).";

let dummyHash: string | null = null;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isRedirect(err: unknown): boolean {
  const digest = (err as { digest?: unknown } | null)?.digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

// ---------- Pendaftaran dengan kode undangan ----------

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!isDbConfigured() || !isAuthConfigured()) return { errors: [NOT_READY] };
  const parsed = parseRegistration(formData);
  if (!parsed.ok) return { errors: parsed.errors };

  try {
    const ip = await clientIp();
    if (ip && isThrottled(await countFailures("kode-ip", ip, THROTTLE.codeWindowMinutes), THROTTLE.codeMax)) {
      return { errors: [THROTTLE_ERROR] };
    }
    const community = await getCurrentCommunity();
    if (!community) return { errors: ["Lingkungan tidak ditemukan."] };

    let userId: string;
    try {
      ({ userId } = await registerResident(community.id, { ...parsed.value, passwordHash: hashPassword(parsed.value.password) }));
    } catch (err) {
      if (err instanceof RegisterError) {
        if (err.reason === "invite") {
          if (ip) await recordFailure("kode-ip", ip);
          return { errors: [INVITE_ERROR] };
        }
        return { errors: ["Nomor HP ini sudah terdaftar. Silakan masuk dengan nomor tersebut."] };
      }
      throw err;
    }
    await startSession(userId);
    await writeAudit(community.id, userId, "resident.register", "user", userId);
  } catch (err) {
    if (isRedirect(err)) throw err;
    console.error(err);
    return { errors: [GENERIC_ERROR] };
  }
  redirect("/akun?selamat=1");
}

// ---------- Masuk dan keluar ----------

export async function residentLoginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!isDbConfigured() || !isAuthConfigured()) return { errors: [NOT_READY] };
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const password = String(formData.get("password") ?? "").slice(0, 200);
  const fail: FormState = { errors: ["Nomor HP atau sandi salah."] };
  if (!phone || !password) return fail;

  try {
    const ip = await clientIp();
    const accountFails = await countFailures("login-akun", phone, THROTTLE.windowMinutes);
    const ipFails = ip ? await countFailures("login-ip", ip, THROTTLE.windowMinutes) : 0;
    if (isThrottled(accountFails, THROTTLE.accountMax) || isThrottled(ipFails, THROTTLE.ipMax)) {
      return { errors: [THROTTLE_ERROR] };
    }

    const user = await findUserByPhone(phone);
    // Selalu memverifikasi hash (palsu bila akun tidak ada) agar waktu respons tidak membocorkan akun.
    dummyHash ??= hashPassword("tidak-dipakai");
    const valid = verifyPassword(password, user?.password_hash ?? dummyHash) && Boolean(user?.password_hash);
    if (!user || !valid) {
      await recordFailure("login-akun", phone);
      if (ip) await recordFailure("login-ip", ip);
      await sleep(300);
      return fail;
    }

    const community = await getCurrentCommunity();
    const membership = community ? await getMembership(community.id, user.id) : null;
    if (!community || !membership) return { errors: ["Akun ini belum terdaftar di lingkungan ini."] };
    if (membership.status !== "active") return { errors: ["Akun Anda sedang ditangguhkan. Hubungi pengurus."] };

    await touchLogin(user.id);
    await startSession(user.id);
    await writeAudit(community.id, user.id, "auth.login", "user", user.id);
  } catch (err) {
    if (isRedirect(err)) throw err;
    console.error(err);
    return { errors: [GENERIC_ERROR] };
  }
  redirect("/akun");
}

export async function residentLogoutAction(): Promise<void> {
  await endSession();
  redirect("/");
}

// ---------- Akun saya ----------

export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user, community } = await requireMember();
  const parsed = parseProfile(formData);
  if (!parsed.ok) return { errors: parsed.errors };
  try {
    await updateMyProfile(community.id, user.id, parsed.value);
    await writeAudit(community.id, user.id, "resident.update", "user", user.id);
  } catch (err) {
    console.error(err);
    return { errors: [GENERIC_ERROR] };
  }
  redirect("/akun?pesan=tersimpan");
}

/** Memverifikasi sandi saat ini dengan pembatasan laju yang sama seperti login. */
async function checkCurrentPassword(userId: string, phone: string, communityId: string, password: string): Promise<string | null> {
  if (isThrottled(await countFailures("login-akun", phone, THROTTLE.windowMinutes), THROTTLE.accountMax)) return THROTTLE_ERROR;
  const acc = await getMyAccount(communityId, userId);
  if (!acc || !verifyPassword(password, acc.password_hash)) {
    await recordFailure("login-akun", phone);
    await sleep(300);
    return "Sandi saat ini salah.";
  }
  return null;
}

export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user, community } = await requireMember();
  const parsed = parsePasswordChange(formData);
  if (!parsed.ok) return { errors: parsed.errors };
  try {
    const problem = await checkCurrentPassword(user.id, user.phone, community.id, parsed.value.current);
    if (problem) return { errors: [problem] };
    await setPasswordHash(user.id, hashPassword(parsed.value.next));
    await writeAudit(community.id, user.id, "resident.password", "user", user.id);
  } catch (err) {
    console.error(err);
    return { errors: [GENERIC_ERROR] };
  }
  redirect("/akun?pesan=sandi");
}

export async function deleteAccountAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user, community, role } = await requireMember();
  if (user.platform_role === "super_admin" || role === "admin_lingkungan") {
    return { errors: ["Akun admin tidak dapat dihapus sendiri. Minta admin lain mengalihkan peran Anda terlebih dahulu."] };
  }
  const password = String(formData.get("confirm_password") ?? "");
  if (!password) return { errors: ["Masukkan sandi Anda untuk mengonfirmasi."] };
  try {
    const problem = await checkCurrentPassword(user.id, user.phone, community.id, password);
    if (problem) return { errors: [problem] };
    await anonymizeAccount(user.id);
    await writeAudit(community.id, user.id, "resident.delete", "user", user.id);
    await endSession();
  } catch (err) {
    if (isRedirect(err)) throw err;
    console.error(err);
    return { errors: [GENERIC_ERROR] };
  }
  redirect("/?akun=dihapus");
}
