import { describe, expect, it } from "vitest";
import {
  canChangeRoles,
  canManageMember,
  formatInviteCode,
  generateInviteCode,
  isInviteUsable,
  isThrottled,
  normalizeInviteCode,
  parseInviteCreate,
  parsePasswordChange,
  parseProfile,
  parseRegistration,
  THROTTLE,
} from "@/lib/resident";

const form = (o: Record<string, string>) => new Map(Object.entries(o)) as unknown as FormData;

describe("kode undangan", () => {
  it("kode buatan selalu 8 karakter dari alfabet yang tidak membingungkan", () => {
    for (let i = 0; i < 200; i++) {
      const c = generateInviteCode();
      expect(c).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);
      expect(normalizeInviteCode(c)).toBe(c);
    }
  });
  it("kode buatan tidak berulang (entropi cukup)", () => {
    expect(new Set(Array.from({ length: 500 }, generateInviteCode)).size).toBe(500);
  });
  it("normalisasi: huruf besar, buang spasi dan tanda hubung", () => {
    expect(normalizeInviteCode(" abcd-efgh ")).toBe("ABCDEFGH");
    expect(normalizeInviteCode("abcd efgh")).toBe("ABCDEFGH");
  });
  it("menolak karakter terlarang dan panjang salah", () => {
    for (const bad of ["", "ABC", "ABCDEFGHJ", "ABCD-EFG0", "ABCD-EFGO", "ABCD-EFGI", "ABCD-EFG1", "ABCD-EF!H"]) {
      expect(normalizeInviteCode(bad), bad).toBeNull();
    }
  });
  it("format tampilan", () => expect(formatInviteCode("ABCDEFGH")).toBe("ABCD-EFGH"));

  const base = { is_active: true, max_uses: null, used_count: 0, expires_at: null };
  const now = new Date("2026-12-01T00:00:00Z");
  it("isInviteUsable", () => {
    expect(isInviteUsable(base, now)).toBe(true);
    expect(isInviteUsable({ ...base, is_active: false }, now)).toBe(false);
    expect(isInviteUsable({ ...base, expires_at: "2026-11-30T00:00:00Z" }, now)).toBe(false);
    expect(isInviteUsable({ ...base, expires_at: "2026-12-01T00:00:00Z" }, now)).toBe(false);
    expect(isInviteUsable({ ...base, expires_at: "2026-12-02T00:00:00Z" }, now)).toBe(true);
    expect(isInviteUsable({ ...base, max_uses: 3, used_count: 3 }, now)).toBe(false);
    expect(isInviteUsable({ ...base, max_uses: 3, used_count: 2 }, now)).toBe(true);
  });
});

describe("parseInviteCreate", () => {
  it("semua opsional", () => {
    expect(parseInviteCreate(form({}))).toEqual({ ok: true, value: { label: null, max_uses: null, expires_in_days: null } });
  });
  it("menerima angka valid", () => {
    expect(parseInviteCreate(form({ label: " RT 03 ", max_uses: "50", expires_in_days: "30" }))).toEqual({
      ok: true,
      value: { label: "RT 03", max_uses: 50, expires_in_days: 30 },
    });
  });
  it("menolak batas dan masa berlaku yang tidak masuk akal", () => {
    const cases: Record<string, string>[] = [{ max_uses: "0" }, { max_uses: "abc" }, { expires_in_days: "0" }, { expires_in_days: "400" }, { expires_in_days: "x" }];
    for (const bad of cases) {
      expect(parseInviteCreate(form(bad)).ok, JSON.stringify(bad)).toBe(false);
    }
  });
});

describe("parseProfile", () => {
  it("blok wajib; RT/RW angka maksimal 3 digit", () => {
    expect(parseProfile(form({ address_block: "Melati" })).ok).toBe(true);
    expect(parseProfile(form({ address_block: "" })).ok).toBe(false);
    expect(parseProfile(form({ address_block: "A", rt: "0003" })).ok).toBe(false);
    expect(parseProfile(form({ address_block: "A", rt: "ab" })).ok).toBe(false);
  });
  it("kotak direktori: tercentang = true, tidak = false", () => {
    const on = parseProfile(form({ address_block: "A", show_in_directory: "on" }));
    const off = parseProfile(form({ address_block: "A" }));
    expect(on.ok && on.value.show_in_directory).toBe(true);
    expect(off.ok && off.value.show_in_directory).toBe(false);
  });
});

describe("parseRegistration", () => {
  const ok = {
    code: "abcd-efgh",
    full_name: " Budi Santoso ",
    phone: "0812-3456-7890",
    password: "sandi-aman-1",
    password_confirm: "sandi-aman-1",
    address_block: "Melati",
    consent: "on",
  };
  it("menormalkan kode, nama, dan nomor HP", () => {
    const r = parseRegistration(form(ok));
    expect(r.ok && r.value.code).toBe("ABCDEFGH");
    expect(r.ok && r.value.full_name).toBe("Budi Santoso");
    expect(r.ok && r.value.phone).toBe("+6281234567890");
    expect(r.ok && r.value.show_in_directory).toBe(false);
  });
  it("persetujuan wajib", () => {
    const r = parseRegistration(form({ ...ok, consent: "" }));
    expect(!r.ok && r.errors.join(" ")).toContain("menyetujui");
  });
  it("sandi minimal 8 dan harus sama dengan konfirmasi", () => {
    expect(parseRegistration(form({ ...ok, password: "pendek", password_confirm: "pendek" })).ok).toBe(false);
    expect(parseRegistration(form({ ...ok, password_confirm: "beda-sekali-1" })).ok).toBe(false);
  });
  it("sandi tidak di-trim (spasi bagian dari sandi)", () => {
    const r = parseRegistration(form({ ...ok, password: " spasi-depan-1", password_confirm: " spasi-depan-1" }));
    expect(r.ok && r.value.password).toBe(" spasi-depan-1");
  });
  it("mengumpulkan beberapa kesalahan sekaligus", () => {
    const r = parseRegistration(form({ code: "x", full_name: "", phone: "abc", password: "", password_confirm: "" }));
    expect(!r.ok && r.errors.length).toBeGreaterThanOrEqual(5);
  });
});

describe("parsePasswordChange", () => {
  it("valid", () => {
    expect(parsePasswordChange(form({ current_password: "lama", new_password: "baru-aman-123", new_password_confirm: "baru-aman-123" })).ok).toBe(true);
  });
  it("menolak sandi pendek, konfirmasi beda, dan sandi lama kosong", () => {
    expect(parsePasswordChange(form({ current_password: "lama", new_password: "pendek", new_password_confirm: "pendek" })).ok).toBe(false);
    expect(parsePasswordChange(form({ current_password: "lama", new_password: "baru-aman-123", new_password_confirm: "lain" })).ok).toBe(false);
    expect(parsePasswordChange(form({ current_password: "", new_password: "baru-aman-123", new_password_confirm: "baru-aman-123" })).ok).toBe(false);
  });
});

describe("pembatasan laju", () => {
  it("terblokir tepat saat mencapai batas", () => {
    expect(isThrottled(THROTTLE.accountMax - 1, THROTTLE.accountMax)).toBe(false);
    expect(isThrottled(THROTTLE.accountMax, THROTTLE.accountMax)).toBe(true);
  });
  it("batas per jaringan lebih longgar daripada per akun (banyak warga satu Wi-Fi)", () => {
    expect(THROTTLE.ipMax).toBeGreaterThan(THROTTLE.accountMax);
  });
});

describe("hak kelola anggota", () => {
  const member = (role: string, platform_role = "user") => ({ id: "t", role, platform_role });
  const actor = (role: "super_admin" | "admin_lingkungan" | "pengurus") => ({ id: "a", role });

  it("tidak boleh mengubah diri sendiri", () => {
    expect(canManageMember({ id: "x", role: "super_admin" }, { id: "x", role: "warga", platform_role: "user" })).toBe(false);
  });
  it("super admin boleh semuanya", () => {
    expect(canManageMember(actor("super_admin"), member("admin_lingkungan", "super_admin"))).toBe(true);
  });
  it("admin lingkungan boleh mengelola semua kecuali super admin platform", () => {
    expect(canManageMember(actor("admin_lingkungan"), member("pengurus"))).toBe(true);
    expect(canManageMember(actor("admin_lingkungan"), member("admin_lingkungan"))).toBe(true);
    expect(canManageMember(actor("admin_lingkungan"), member("admin_lingkungan", "super_admin"))).toBe(false);
  });
  it("pengurus hanya boleh mengelola warga dan penjual", () => {
    expect(canManageMember(actor("pengurus"), member("warga"))).toBe(true);
    expect(canManageMember(actor("pengurus"), member("penjual"))).toBe(true);
    expect(canManageMember(actor("pengurus"), member("pengurus"))).toBe(false);
    expect(canManageMember(actor("pengurus"), member("admin_lingkungan"))).toBe(false);
  });
  it("hanya super admin dan admin lingkungan yang boleh mengubah peran", () => {
    expect(canChangeRoles("super_admin")).toBe(true);
    expect(canChangeRoles("admin_lingkungan")).toBe(true);
    expect(canChangeRoles("pengurus")).toBe(false);
  });
});
