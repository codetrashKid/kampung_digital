import { describe, expect, it } from "vitest";
import { isActivePath } from "@/lib/nav";

describe("isActivePath", () => {
  it("beranda hanya aktif di '/' persis", () => {
    expect(isActivePath("/", "/")).toBe(true);
    expect(isActivePath("/usaha", "/")).toBe(false);
  });
  it("menu aktif untuk halaman itu dan turunannya", () => {
    expect(isActivePath("/usaha", "/usaha")).toBe(true);
    expect(isActivePath("/usaha/warung-bu-sari", "/usaha")).toBe(true);
  });
  it("tidak salah cocok pada awalan yang mirip (/laporan vs /lapor)", () => {
    expect(isActivePath("/laporan", "/lapor")).toBe(false);
    expect(isActivePath("/lapor", "/laporan")).toBe(false);
  });
  it("exact mencegah turunan ikut aktif (mis. /admin)", () => {
    expect(isActivePath("/admin/usaha", "/admin", true)).toBe(false);
    expect(isActivePath("/admin", "/admin", true)).toBe(true);
  });
});
