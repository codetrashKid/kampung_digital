import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const isDbConfigured = vi.fn();
const q = {
  getCurrentCommunity: vi.fn(),
  listAnnouncements: vi.fn(),
  listUpcomingEvents: vi.fn(),
  listPublicReports: vi.fn(),
  listCategoriesWithCount: vi.fn(),
  listBusinesses: vi.fn(),
  getBusiness: vi.fn(),
  countPublicReportsByStatus: vi.fn(),
};
const submitPublicReport = vi.fn();

vi.mock("@/lib/db", () => ({ isDbConfigured: () => isDbConfigured() }));
vi.mock("@/lib/queries", () => ({
  getCurrentCommunity: () => q.getCurrentCommunity(),
  listAnnouncements: (...a: unknown[]) => q.listAnnouncements(...a),
  listUpcomingEvents: (...a: unknown[]) => q.listUpcomingEvents(...a),
  listPublicReports: (...a: unknown[]) => q.listPublicReports(...a),
  listCategoriesWithCount: (...a: unknown[]) => q.listCategoriesWithCount(...a),
  listBusinesses: (...a: unknown[]) => q.listBusinesses(...a),
  getBusiness: (...a: unknown[]) => q.getBusiness(...a),
  countPublicReportsByStatus: (...a: unknown[]) => q.countPublicReportsByStatus(...a),
}));
vi.mock("@/lib/reports", () => ({ submitPublicReport: (...a: unknown[]) => submitPublicReport(...a) }));
vi.mock("@/lib/request", () => ({ clientIp: async () => "203.0.113.5" }));

import { GET as getHome } from "@/app/api/v1/home/route";
import { GET as getCategories } from "@/app/api/v1/categories/route";
import { GET as getBusinessRoute } from "@/app/api/v1/businesses/[slug]/route";
import { GET as getReports, POST as postReport } from "@/app/api/v1/reports/route";

const req = (path: string, init?: RequestInit) => new NextRequest(`http://localhost${path}`, init as never);
const community = { id: "c1", name: "Contoh Kampung", slug: "contoh-kampung", description: "Deskripsi" };

beforeEach(() => {
  vi.resetAllMocks();
  isDbConfigured.mockReturnValue(true);
  q.getCurrentCommunity.mockResolvedValue(community);
  q.listAnnouncements.mockResolvedValue([]);
  q.listUpcomingEvents.mockResolvedValue([]);
  q.listPublicReports.mockResolvedValue([]);
  q.listCategoriesWithCount.mockResolvedValue([]);
  q.listBusinesses.mockResolvedValue([]);
  q.countPublicReportsByStatus.mockResolvedValue({});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("pembungkus umum (home)", () => {
  it("503 tanpa database, 404 tanpa lingkungan, 500 tanpa membocorkan detail", async () => {
    isDbConfigured.mockReturnValue(false);
    expect((await getHome(req("/api/v1/home"))).status).toBe(503);
    isDbConfigured.mockReturnValue(true);
    q.getCurrentCommunity.mockResolvedValue(null);
    expect((await getHome(req("/api/v1/home"))).status).toBe(404);
    q.getCurrentCommunity.mockResolvedValue(community);
    q.listBusinesses.mockRejectedValue(new Error("password=rahasia"));
    const res = await getHome(req("/api/v1/home"));
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain("rahasia");
  });
});

describe("GET /api/v1/home", () => {
  it("menggabungkan semua bagian beranda dan memfilter lingkungan aktif", async () => {
    q.listCategoriesWithCount.mockResolvedValue([
      { id: "k1", slug: "makanan", name: "Makanan", icon: "🍜", total: 2 },
      { id: "k2", slug: "jasa", name: "Jasa", icon: "🛠️", total: 1 },
    ]);
    q.listBusinesses.mockResolvedValue([{ id: "b1", name: "Warung" }]);
    const res = await getHome(req("/api/v1/home"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.community).toEqual({ name: "Contoh Kampung", slug: "contoh-kampung", description: "Deskripsi" });
    expect(body.stats.businesses).toBe(3);
    expect(body.businesses).toHaveLength(1);
    expect(body.categories).toHaveLength(2);
    expect(q.listAnnouncements).toHaveBeenCalledWith("c1", 3);
    expect(q.listUpcomingEvents).toHaveBeenCalledWith("c1", 4);
    expect(q.listPublicReports).toHaveBeenCalledWith("c1", { limit: 3 });
    expect(res.headers.get("cache-control")).toContain("s-maxage");
  });
});

describe("GET /api/v1/categories", () => {
  it("mengembalikan kategori", async () => {
    q.listCategoriesWithCount.mockResolvedValue([{ id: "k1", slug: "makanan", name: "Makanan", icon: null, total: 0 }]);
    const body = await (await getCategories(req("/api/v1/categories"))).json();
    expect(body.data).toHaveLength(1);
  });
});

describe("GET /api/v1/businesses/[slug]", () => {
  const call = (slug: string) => getBusinessRoute(req(`/api/v1/businesses/${slug}`), { params: Promise.resolve({ slug }) });
  it("detail usaha beserta jam buka", async () => {
    q.getBusiness.mockResolvedValue({ business: { id: "b1", slug: "warung", name: "Warung" }, hours: [{ day_of_week: 1 }] });
    const res = await call("warung");
    expect(res.status).toBe(200);
    expect(q.getBusiness).toHaveBeenCalledWith("c1", "warung");
    const body = await res.json();
    expect(body.business.name).toBe("Warung");
    expect(body.hours).toHaveLength(1);
  });
  it("404 bila tidak ada atau slug tidak valid (tanpa menyentuh database)", async () => {
    q.getBusiness.mockResolvedValue(null);
    expect((await call("tidak-ada")).status).toBe(404);
    q.getBusiness.mockClear();
    expect((await call("../etc/passwd")).status).toBe(404);
    expect((await call("A_B")).status).toBe(404);
    expect(q.getBusiness).not.toHaveBeenCalled();
  });
});

describe("GET /api/v1/reports", () => {
  it("meneruskan filter yang sah dan mengabaikan yang tidak", async () => {
    q.countPublicReportsByStatus.mockResolvedValue({ baru: 1 });
    await getReports(req("/api/v1/reports?status=selesai&jenis=kebersihan"));
    expect(q.listPublicReports).toHaveBeenLastCalledWith("c1", { status: "selesai", category: "kebersihan" });
    await getReports(req("/api/v1/reports?status=ditolak&jenis=hack"));
    expect(q.listPublicReports).toHaveBeenLastCalledWith("c1", { status: undefined, category: undefined });
  });
  it("hasil memuat data dan jumlah per status", async () => {
    q.listPublicReports.mockResolvedValue([{ id: "r1", title: "Lampu mati" }]);
    q.countPublicReportsByStatus.mockResolvedValue({ baru: 2 });
    const body = await (await getReports(req("/api/v1/reports"))).json();
    expect(body.data).toHaveLength(1);
    expect(body.counts).toEqual({ baru: 2 });
  });
});

describe("POST /api/v1/reports", () => {
  const post = (body: unknown, raw?: string) =>
    postReport(req("/api/v1/reports", { method: "POST", body: raw ?? JSON.stringify(body), headers: { "content-type": "application/json" } }));
  const valid = { category: "infrastruktur", title: "Lampu mati", description: "Lampu jalan mati sejak Senin." };

  it("201 untuk laporan valid dan memanggil penyimpanan dengan IP klien", async () => {
    submitPublicReport.mockResolvedValue("ok");
    const res = await post({ ...valid, reporter_phone: "0812-0000-0001" });
    expect(res.status).toBe(201);
    expect(submitPublicReport).toHaveBeenCalledTimes(1);
    const [communityId, value, ip] = submitPublicReport.mock.calls[0];
    expect(communityId).toBe("c1");
    expect(value.reporter_phone).toBe("+6281200000001");
    expect(ip).toBe("203.0.113.5");
  });
  it("400 dengan pesan validasi", async () => {
    const res = await post({ category: "hack", title: "a", description: "x" });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.errors.length).toBeGreaterThanOrEqual(3);
    expect(typeof body.error).toBe("string");
    expect(submitPublicReport).not.toHaveBeenCalled();
  });
  it("400 untuk JSON rusak atau bukan objek", async () => {
    expect((await post(null, "bukan json")).status).toBe(400);
    expect((await post(null, "[1,2]")).status).toBe(400);
    expect((await post(null, "null")).status).toBe(400);
  });
  it("413 untuk isi terlalu besar", async () => {
    expect((await post({ ...valid, description: "x".repeat(20000) })).status).toBe(413);
  });
  it("429 saat jaringan dibatasi", async () => {
    submitPublicReport.mockResolvedValue("throttled");
    expect((await post(valid)).status).toBe(429);
  });
  it("kolom jebakan bot: pura-pura berhasil tanpa menyimpan", async () => {
    const res = await post({ ...valid, website: "http://spam.example" });
    expect(res.status).toBe(201);
    expect(submitPublicReport).not.toHaveBeenCalled();
  });
  it("nilai bukan string diabaikan, bukan menyebabkan crash", async () => {
    const res = await post({ ...valid, title: 123, reporter_name: { a: 1 } });
    expect(res.status).toBe(400);
  });
});
