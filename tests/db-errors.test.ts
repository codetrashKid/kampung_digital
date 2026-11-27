import { describe, expect, it } from "vitest";
import { dbErrorHint, describeDbError } from "@/lib/db-errors";

describe("describeDbError", () => {
  it("menyertakan kode dan pesan", () => {
    expect(describeDbError(Object.assign(new Error("max clients reached"), { code: "XX000" }))).toBe("XX000: max clients reached");
  });
  it("aman untuk nilai bukan error", () => {
    expect(describeDbError(undefined)).toBe("tidak diketahui");
    expect(describeDbError("teks")).toBe("teks");
  });
  it("memotong pesan panjang", () => {
    expect(describeDbError(new Error("x".repeat(1000))).length).toBe(300);
  });
});

describe("dbErrorHint", () => {
  it("mengenali pool sesi penuh", () => {
    expect(dbErrorHint(Object.assign(new Error("(EMAXCONNSESSION) max clients reached in session mode"), { code: "XX000" }))).toContain("6543");
  });
  it("mengenali sandi salah, host salah, timeout, dan tabel belum ada", () => {
    expect(dbErrorHint(new Error("password authentication failed for user"))).toContain("URL-encode");
    expect(dbErrorHint(Object.assign(new Error("getaddrinfo ENOTFOUND x"), { code: "ENOTFOUND" }))).toContain("Host");
    expect(dbErrorHint(Object.assign(new Error("connect"), { code: "CONNECT_TIMEOUT" }))).toContain("terjangkau");
    expect(dbErrorHint(new Error('relation "businesses" does not exist'))).toContain("db:migrate");
  });
  it("null untuk error yang tidak dikenal", () => {
    expect(dbErrorHint(new Error("aneh"))).toBeNull();
  });
});
