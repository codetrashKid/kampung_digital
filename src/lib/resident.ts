// Logika murni untuk warga: validasi, kode undangan, pembatasan laju, dan aturan hak kelola. Tanpa database.
import { randomInt } from "node:crypto";
import { collect, lengthError, normalizePhone, text, type Getter, type Result } from "./validation";

// ---------- Kode undangan ----------

// 32 karakter tanpa O, 0, I, 1 agar tidak membingungkan saat diketik atau dibacakan.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;
const CODE_RE = /^[A-HJ-NP-Z2-9]{8}$/;

export function generateInviteCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) code += CODE_ALPHABET[randomInt(0, CODE_ALPHABET.length)];
  return code;
}

/** Huruf besar, tanpa spasi/tanda hubung; null bila bentuknya tidak mungkin kode yang sah. */
export function normalizeInviteCode(raw: string): string | null {
  const cleaned = raw.toUpperCase().replace(/[\s-]/g, "");
  return CODE_RE.test(cleaned) ? cleaned : null;
}

/** ABCD-EFGH untuk ditampilkan. */
export function formatInviteCode(code: string): string {
  return code.length === CODE_LENGTH ? `${code.slice(0, 4)}-${code.slice(4)}` : code;
}

export const INVITE_ERROR = "Kode undangan tidak valid, sudah kedaluwarsa, atau sudah habis dipakai.";

export type InviteState = {
  is_active: boolean;
  max_uses: number | null;
  used_count: number;
  expires_at: Date | string | null;
};

/** true bila kode masih bisa dipakai pada waktu [now]. */
export function isInviteUsable(inv: InviteState, now = new Date()): boolean {
  if (!inv.is_active) return false;
  if (inv.expires_at && new Date(inv.expires_at) <= now) return false;
  if (inv.max_uses !== null && inv.used_count >= inv.max_uses) return false;
  return true;
}

export type InviteInput = { label: string | null; max_uses: number | null; expires_in_days: number | null };

export function parseInviteCreate(g: Getter): Result<InviteInput> {
  const label = text(g, "label");
  const maxRaw = text(g, "max_uses");
  const daysRaw = text(g, "expires_in_days");
  const max = maxRaw === "" ? null : /^\d{1,6}$/.test(maxRaw) ? Number(maxRaw) : NaN;
  const days = daysRaw === "" ? null : /^\d{1,4}$/.test(daysRaw) ? Number(daysRaw) : NaN;
  const errors = collect([
    lengthError("Label", label, 0, 80),
    max !== null && (Number.isNaN(max) || max < 1) ? "Batas pemakaian harus bilangan bulat minimal 1 (kosongkan bila tanpa batas)." : null,
    days !== null && (Number.isNaN(days) || days < 1 || days > 365) ? "Masa berlaku harus 1 sampai 365 hari (kosongkan bila tanpa batas)." : null,
  ]);
  if (errors.length) return { ok: false, errors };
  return { ok: true, value: { label: label || null, max_uses: max, expires_in_days: days } };
}

// ---------- Pendaftaran dan profil ----------

export const MIN_PASSWORD = 8;
export const MAX_PASSWORD = 200;

function passwordError(pw: string): string | null {
  if (pw.length < MIN_PASSWORD) return `Sandi minimal ${MIN_PASSWORD} karakter.`;
  if (pw.length > MAX_PASSWORD) return `Sandi maksimal ${MAX_PASSWORD} karakter.`;
  return null;
}

/** RT/RW: 1 sampai 3 angka, boleh kosong. */
function rtRwError(label: string, v: string): string | null {
  return v === "" || /^\d{1,3}$/.test(v) ? null : `${label} harus berupa angka (maksimal 3 digit).`;
}

export type ProfileInput = {
  address_block: string;
  house_number: string | null;
  rt: string | null;
  rw: string | null;
  show_in_directory: boolean;
};

export function parseProfile(g: Getter): Result<ProfileInput> {
  const block = text(g, "address_block");
  const house = text(g, "house_number");
  const rt = text(g, "rt");
  const rw = text(g, "rw");
  const errors = collect([
    lengthError("Blok / nama jalan", block, 1, 100),
    lengthError("Nomor rumah", house, 0, 20),
    rtRwError("RT", rt),
    rtRwError("RW", rw),
  ]);
  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      address_block: block,
      house_number: house || null,
      rt: rt || null,
      rw: rw || null,
      show_in_directory: g.get("show_in_directory") === "on",
    },
  };
}

export type RegistrationInput = ProfileInput & {
  code: string;
  full_name: string;
  phone: string;
  password: string;
};

export function parseRegistration(g: Getter): Result<RegistrationInput> {
  const rawCode = text(g, "code");
  const code = normalizeInviteCode(rawCode);
  const name = text(g, "full_name");
  const phone = normalizePhone(text(g, "phone"));
  const password = String(g.get("password") ?? "");
  const confirm = String(g.get("password_confirm") ?? "");
  const profile = parseProfile(g);
  const errors = collect([
    code ? null : "Kode undangan tidak valid. Periksa kembali kode dari pengurus (8 huruf/angka).",
    lengthError("Nama lengkap", name, 2, 80),
    phone ? null : "Nomor HP wajib diisi dan harus valid (contoh: 0812-3456-7890).",
    passwordError(password),
    password && password !== confirm ? "Konfirmasi sandi tidak sama." : null,
    g.get("consent") === "on" ? null : "Anda harus menyetujui penggunaan data untuk mendaftar.",
    ...(profile.ok ? [] : profile.errors),
  ]);
  if (errors.length || !code || !phone || !profile.ok) return { ok: false, errors };
  return { ok: true, value: { ...profile.value, code, full_name: name, phone, password } };
}

export type PasswordChangeInput = { current: string; next: string };

export function parsePasswordChange(g: Getter): Result<PasswordChangeInput> {
  const current = String(g.get("current_password") ?? "");
  const next = String(g.get("new_password") ?? "");
  const confirm = String(g.get("new_password_confirm") ?? "");
  const errors = collect([
    current ? null : "Sandi saat ini wajib diisi.",
    passwordError(next),
    next && next !== confirm ? "Konfirmasi sandi baru tidak sama." : null,
  ]);
  if (errors.length) return { ok: false, errors };
  return { ok: true, value: { current, next } };
}

// ---------- Pembatasan laju ----------

export const THROTTLE = {
  /** Gagal login per nomor HP/email dalam 15 menit. */
  accountMax: 5,
  /** Gagal login per jaringan (IP) dalam 15 menit. */
  ipMax: 20,
  windowMinutes: 15,
  /** Kode undangan salah per jaringan dalam 60 menit (mencegah tebak-tebakan kode). */
  codeMax: 8,
  codeWindowMinutes: 60,
} as const;

export const THROTTLE_ERROR = "Terlalu banyak percobaan yang gagal. Silakan coba lagi beberapa menit lagi.";

export function isThrottled(failures: number, max: number): boolean {
  return failures >= max;
}

// ---------- Hak kelola anggota ----------

export type MemberRole = "warga" | "penjual" | "pengurus" | "admin_lingkungan";
export const MEMBER_ROLES: readonly MemberRole[] = ["warga", "penjual", "pengurus", "admin_lingkungan"];
export type ActorRole = "super_admin" | "admin_lingkungan" | "pengurus";

export const MEMBER_ROLE_LABEL: Record<string, string> = {
  warga: "Warga",
  penjual: "Penjual",
  pengurus: "Pengurus",
  admin_lingkungan: "Admin lingkungan",
};

/**
 * Apakah [actor] boleh mengubah status/peran [target].
 * Tidak boleh mengubah diri sendiri; pengurus hanya warga/penjual; super admin platform hanya oleh super admin.
 */
export function canManageMember(
  actor: { id: string; role: ActorRole },
  target: { id: string; role: string; platform_role: string },
): boolean {
  if (actor.id === target.id) return false;
  if (actor.role === "super_admin") return true;
  if (target.platform_role === "super_admin") return false;
  if (actor.role === "admin_lingkungan") return true;
  return target.role === "warga" || target.role === "penjual"; // pengurus
}

/** Hanya super admin dan admin lingkungan yang boleh mengubah peran. */
export function canChangeRoles(role: ActorRole): boolean {
  return role === "super_admin" || role === "admin_lingkungan";
}
