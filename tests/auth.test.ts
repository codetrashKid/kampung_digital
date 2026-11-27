import { describe, expect, it } from "vitest";
import { resolveAdminRole } from "@/lib/auth";

describe("resolveAdminRole", () => {
  it("super admin platform selalu boleh", () => {
    expect(resolveAdminRole("super_admin", null, null)).toBe("super_admin");
  });
  it("admin lingkungan dan pengurus aktif boleh", () => {
    expect(resolveAdminRole("user", "admin_lingkungan", "active")).toBe("admin_lingkungan");
    expect(resolveAdminRole("user", "pengurus", "active")).toBe("pengurus");
  });
  it("warga dan penjual tidak boleh", () => {
    expect(resolveAdminRole("user", "warga", "active")).toBeNull();
    expect(resolveAdminRole("user", "penjual", "active")).toBeNull();
  });
  it("pengurus yang ditangguhkan atau menunggu tidak boleh", () => {
    expect(resolveAdminRole("user", "pengurus", "suspended")).toBeNull();
    expect(resolveAdminRole("user", "admin_lingkungan", "pending")).toBeNull();
  });
  it("bukan anggota lingkungan tidak boleh", () => {
    expect(resolveAdminRole("user", null, null)).toBeNull();
  });
});
