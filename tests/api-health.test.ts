import { beforeEach, describe, expect, it, vi } from "vitest";

const isDbConfigured = vi.fn();
const query = vi.fn();

vi.mock("@/lib/db", () => ({
  isDbConfigured: () => isDbConfigured(),
  getDb: () => query,
}));

import { GET } from "@/app/api/v1/health/route";

beforeEach(() => vi.resetAllMocks());

describe("GET /api/v1/health", () => {
  it("ok tanpa database bila belum dikonfigurasi", async () => {
    isDbConfigured.mockReturnValue(false);
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok", database: "belum dikonfigurasi" });
  });

  it("ok bila database terhubung", async () => {
    isDbConfigured.mockReturnValue(true);
    query.mockResolvedValue([{ "?column?": 1 }]);
    const res = await GET();
    expect(res.status).toBe(200);
    expect((await res.json()).database).toBe("terhubung");
  });

  it("503 bila database gagal", async () => {
    isDbConfigured.mockReturnValue(true);
    query.mockRejectedValue(new Error("down"));
    const res = await GET();
    expect(res.status).toBe(503);
    expect((await res.json()).status).toBe("error");
  });
});
