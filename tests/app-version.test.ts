import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildUpdateResponse, parseBuild, parsePlatform, type LatestRelease } from "@/lib/app-version";

const isDbConfigured = vi.fn();
const getLatestReleaseAbove = vi.fn();
vi.mock("@/lib/db", () => ({ isDbConfigured: () => isDbConfigured() }));
vi.mock("@/lib/queries", () => ({
  getLatestReleaseAbove: (platform: string, build: number) => getLatestReleaseAbove(platform, build),
}));

import { GET } from "@/app/api/v1/app-version/route";

const rel = (over: Partial<LatestRelease> = {}): LatestRelease => ({
  version_name: "0.2.0",
  build_number: 5,
  download_url: "https://contoh.com/app.apk",
  release_notes: "Perbaikan",
  created_at: "2026-11-27T00:00:00.000Z",
  required: false,
  ...over,
});

describe("parsePlatform / parseBuild", () => {
  it("platform hanya android atau ios", () => {
    expect(parsePlatform("android")).toBe("android");
    expect(parsePlatform("ios")).toBe("ios");
    expect(parsePlatform("windows")).toBeNull();
    expect(parsePlatform(null)).toBeNull();
  });
  it("build harus bilangan bulat positif", () => {
    expect(parseBuild("12")).toBe(12);
    for (const bad of [null, "", "0", "-1", "1.5", "abc", "12abc", "99999999999", "2147483648"]) {
      expect(parseBuild(bad)).toBeNull();
    }
  });
});

describe("buildUpdateResponse", () => {
  it("tidak ada rilis lebih baru -> tidak perlu update", () => {
    expect(buildUpdateResponse("android", 5, null)).toEqual({
      platform: "android", current_build: 5, update_available: false, update_required: false, latest: null,
    });
    // pengaman: rilis yang tidak lebih baru diabaikan
    expect(buildUpdateResponse("android", 5, rel({ build_number: 5, required: true })).update_available).toBe(false);
  });
  it("rilis baru opsional", () => {
    const r = buildUpdateResponse("android", 3, rel());
    expect(r.update_available).toBe(true);
    expect(r.update_required).toBe(false);
    expect(r.latest).toEqual({
      version: "0.2.0", build: 5, url: "https://contoh.com/app.apk", notes: "Perbaikan", published_at: "2026-11-27T00:00:00.000Z",
    });
  });
  it("ada rilis wajib di antara build klien dan terbaru -> wajib", () => {
    expect(buildUpdateResponse("ios", 1, rel({ required: true })).update_required).toBe(true);
  });
});

describe("GET /api/v1/app-version", () => {
  const call = (qs: string) => GET(new NextRequest(`http://localhost/api/v1/app-version${qs}`));
  beforeEach(() => {
    vi.resetAllMocks();
    isDbConfigured.mockReturnValue(true);
    getLatestReleaseAbove.mockResolvedValue(null);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("400 untuk parameter tidak valid", async () => {
    expect((await call("")).status).toBe(400);
    expect((await call("?platform=android")).status).toBe(400);
    expect((await call("?platform=linux&build=1")).status).toBe(400);
    expect((await call("?platform=android&build=abc")).status).toBe(400);
    expect(getLatestReleaseAbove).not.toHaveBeenCalled();
  });
  it("503 tanpa database", async () => {
    isDbConfigured.mockReturnValue(false);
    expect((await call("?platform=android&build=1")).status).toBe(503);
  });
  it("200 dengan info update dan header cache", async () => {
    getLatestReleaseAbove.mockResolvedValue(rel({ required: true }));
    const res = await call("?platform=android&build=2");
    expect(res.status).toBe(200);
    expect(getLatestReleaseAbove).toHaveBeenCalledWith("android", 2);
    const body = await res.json();
    expect(body.update_required).toBe(true);
    expect(body.latest.build).toBe(5);
    expect(res.headers.get("cache-control")).toContain("s-maxage=60");
  });
  it("500 tanpa membocorkan detail error", async () => {
    getLatestReleaseAbove.mockRejectedValue(new Error("password=rahasia"));
    const res = await call("?platform=ios&build=2");
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain("rahasia");
  });
});
