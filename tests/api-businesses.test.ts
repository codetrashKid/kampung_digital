import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const isDbConfigured = vi.fn();
const getCurrentCommunity = vi.fn();
const listBusinesses = vi.fn();

vi.mock("@/lib/db", () => ({ isDbConfigured: () => isDbConfigured() }));
vi.mock("@/lib/queries", () => ({
  getCurrentCommunity: () => getCurrentCommunity(),
  listBusinesses: (opts: unknown) => listBusinesses(opts),
}));

import { GET } from "@/app/api/v1/businesses/route";

const call = (qs = "") => GET(new NextRequest(`http://localhost/api/v1/businesses${qs}`));

beforeEach(() => {
  vi.resetAllMocks();
  isDbConfigured.mockReturnValue(true);
  getCurrentCommunity.mockResolvedValue({ id: "c1", slug: "contoh-kampung" });
  listBusinesses.mockResolvedValue([]);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("GET /api/v1/businesses", () => {
  it("503 bila DATABASE_URL belum diatur", async () => {
    isDbConfigured.mockReturnValue(false);
    const res = await call();
    expect(res.status).toBe(503);
    expect(listBusinesses).not.toHaveBeenCalled();
  });

  it("404 bila lingkungan tidak ditemukan", async () => {
    getCurrentCommunity.mockResolvedValue(null);
    expect((await call()).status).toBe(404);
  });

  it("mengembalikan data dan memfilter community_id lingkungan aktif", async () => {
    listBusinesses.mockResolvedValue([{ id: "b1", name: "Warung" }]);
    const res = await call("?q=nasi&kategori=makanan&limit=10");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      community: "contoh-kampung",
      data: [{ id: "b1", name: "Warung" }],
    });
    expect(listBusinesses).toHaveBeenCalledWith({
      communityId: "c1",
      q: "nasi",
      categorySlug: "makanan",
      limit: 10,
    });
  });

  it("limit bawaan 24 bila tidak valid", async () => {
    await call("?limit=abc");
    expect(listBusinesses.mock.calls[0][0].limit).toBe(24);
  });

  it("500 tanpa membocorkan detail error", async () => {
    listBusinesses.mockRejectedValue(new Error("password=rahasia"));
    const res = await call();
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain("rahasia");
  });
});
