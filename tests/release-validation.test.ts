import { describe, expect, it } from "vitest";
import { isHttpsUrl, parseRelease } from "@/lib/validation";

const form = (o: Record<string, string>) => new Map(Object.entries(o)) as unknown as FormData;
const base = {
  platform: "android",
  version_name: "0.2.0",
  build_number: "12",
  download_url: "https://github.com/akun/repo/releases/download/v0.2.0/app.apk",
};

describe("isHttpsUrl", () => {
  it("hanya https dengan host bertitik", () => {
    expect(isHttpsUrl("https://contoh.com/a.apk")).toBe(true);
    for (const bad of ["http://contoh.com", "ftp://contoh.com", "javascript:alert(1)", "https://localhost/x", "contoh.com", "", "https://user:pw@contoh.com/x"]) {
      expect(isHttpsUrl(bad)).toBe(false);
    }
  });
});

describe("parseRelease", () => {
  it("menerima rilis valid; kotak tidak dicentang = false", () => {
    const r = parseRelease(form(base));
    expect(r).toEqual({
      ok: true,
      value: { ...base, build_number: 12, release_notes: null, is_mandatory: false, is_active: false },
    });
  });
  it("kotak dicentang ('on') = true", () => {
    const r = parseRelease(form({ ...base, is_mandatory: "on", is_active: "on", release_notes: " Perbaikan bug " }));
    expect(r.ok && r.value.is_mandatory && r.value.is_active).toBe(true);
    expect(r.ok && r.value.release_notes).toBe("Perbaikan bug");
  });
  it("menerima versi pra-rilis", () => {
    expect(parseRelease(form({ ...base, version_name: "1.0.0-beta.1" })).ok).toBe(true);
  });
  it("menolak versi, build, platform, dan tautan yang salah", () => {
    for (const bad of [
      { version_name: "1.0" },
      { version_name: "v1.0.0" },
      { build_number: "0" },
      { build_number: "abc" },
      { build_number: "1.5" },
      { platform: "windows" },
      { download_url: "http://contoh.com/app.apk" },
      { download_url: "https://contoh.com/" + "a".repeat(500) },
    ]) {
      expect(parseRelease(form({ ...base, ...bad })).ok, JSON.stringify(bad)).toBe(false);
    }
  });
  it("mengumpulkan semua kesalahan sekaligus", () => {
    const r = parseRelease(form({ platform: "x", version_name: "x", build_number: "x", download_url: "x" }));
    expect(!r.ok && r.errors).toHaveLength(4);
  });
});
