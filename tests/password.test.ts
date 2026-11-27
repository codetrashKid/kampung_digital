import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";
// @ts-expect-error skrip .mjs tanpa tipe; dipakai untuk memastikan format hash kedua implementasi cocok
import { hashPassword as hashFromScript } from "../scripts/password-hash.mjs";

describe("password", () => {
  it("hash bisa diverifikasi dan sandi salah ditolak", () => {
    const h = hashPassword("sandi-rahasia-123");
    expect(h.startsWith("scrypt$")).toBe(true);
    expect(verifyPassword("sandi-rahasia-123", h)).toBe(true);
    expect(verifyPassword("sandi-lain", h)).toBe(false);
  });

  it("hash berbeda untuk sandi yang sama (salt acak)", () => {
    expect(hashPassword("sama-saja-1234")).not.toBe(hashPassword("sama-saja-1234"));
  });

  it("menolak hash kosong atau berformat salah tanpa error", () => {
    expect(verifyPassword("x", null)).toBe(false);
    expect(verifyPassword("x", "")).toBe(false);
    expect(verifyPassword("x", "bcrypt$a$b")).toBe(false);
    expect(verifyPassword("x", "scrypt$zz$zz")).toBe(false);
  });

  it("hash dari skrip create-admin cocok dengan verifikasi aplikasi", () => {
    expect(verifyPassword("dari-skrip-12345", hashFromScript("dari-skrip-12345"))).toBe(true);
  });
});
