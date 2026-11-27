import { describe, expect, it } from "vitest";
import { createSessionToken, verifySessionToken } from "@/lib/session";

const SECRET = "x".repeat(40);
const NOW = 1_800_000_000_000;

describe("session token", () => {
  it("token sah mengembalikan id pengguna", () => {
    const t = createSessionToken("user-1", SECRET, NOW);
    expect(verifySessionToken(t, SECRET, NOW + 1000)).toBe("user-1");
  });

  it("ditolak setelah kedaluwarsa", () => {
    const t = createSessionToken("user-1", SECRET, NOW, 1000);
    expect(verifySessionToken(t, SECRET, NOW + 1001)).toBeNull();
  });

  it("ditolak bila secret berbeda", () => {
    const t = createSessionToken("user-1", SECRET, NOW);
    expect(verifySessionToken(t, "y".repeat(40), NOW)).toBeNull();
  });

  it("ditolak bila payload dimanipulasi", () => {
    const [, sig] = createSessionToken("user-1", SECRET, NOW).split(".");
    const forged = Buffer.from(JSON.stringify({ uid: "admin", exp: NOW + 1e9 })).toString("base64url");
    expect(verifySessionToken(`${forged}.${sig}`, SECRET, NOW)).toBeNull();
  });

  it("ditolak untuk token kosong, rusak, atau berlebih", () => {
    expect(verifySessionToken(undefined, SECRET, NOW)).toBeNull();
    expect(verifySessionToken("", SECRET, NOW)).toBeNull();
    expect(verifySessionToken("abc", SECRET, NOW)).toBeNull();
    expect(verifySessionToken("a.b.c", SECRET, NOW)).toBeNull();
  });

  it("secret pendek ditolak saat membuat dan memverifikasi", () => {
    expect(() => createSessionToken("u", "pendek", NOW)).toThrow();
    expect(verifySessionToken("a.b", "pendek", NOW)).toBeNull();
  });
});
