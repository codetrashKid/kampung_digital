import { describe, expect, it } from "vitest";
import { parseReport } from "@/lib/validation";

const form = (o: Record<string, string>) => new Map(Object.entries(o)) as unknown as FormData;
const base = { category: "infrastruktur", title: "Lampu mati", description: "Lampu jalan mati sejak Senin." };

describe("parseReport", () => {
  it("menerima laporan anonim (nama dan HP kosong)", () => {
    const r = parseReport(form(base));
    expect(r).toEqual({
      ok: true,
      value: { ...base, location_text: null, reporter_name: null, reporter_phone: null },
    });
  });
  it("menormalkan nomor HP pelapor", () => {
    const r = parseReport(form({ ...base, reporter_phone: "0812-3456-7890", reporter_name: " Budi " }));
    expect(r.ok && r.value.reporter_phone).toBe("+6281234567890");
    expect(r.ok && r.value.reporter_name).toBe("Budi");
  });
  it("menolak jenis laporan di luar daftar", () => {
    expect(parseReport(form({ ...base, category: "hack" })).ok).toBe(false);
  });
  it("judul minimal 3 dan uraian minimal 10 karakter", () => {
    const r = parseReport(form({ ...base, title: "ab", description: "pendek" }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toEqual(["Judul laporan minimal 3 karakter.", "Uraian minimal 10 karakter."]);
  });
  it("membedakan kosong dan terlalu pendek", () => {
    const r = parseReport(form({ ...base, title: "" }));
    expect(!r.ok && r.errors).toEqual(["Judul laporan wajib diisi."]);
  });
  it("membatasi panjang dan memvalidasi HP", () => {
    expect(parseReport(form({ ...base, description: "x".repeat(2001) })).ok).toBe(false);
    expect(parseReport(form({ ...base, reporter_phone: "abc" })).ok).toBe(false);
  });
});

import { REPORT_STATUS_LABEL, reportCategoryLabel } from "@/lib/validation";

describe("label laporan", () => {
  it("reportCategoryLabel membuang keterangan dalam kurung", () => {
    expect(reportCategoryLabel("infrastruktur")).toBe("Jalan, selokan, lampu");
    expect(reportCategoryLabel("lainnya")).toBe("Lainnya");
  });
  it("nilai tak dikenal dikembalikan apa adanya", () => {
    expect(reportCategoryLabel("xyz")).toBe("xyz");
  });
  it("semua status punya label", () => {
    expect(Object.keys(REPORT_STATUS_LABEL)).toEqual(["baru", "diproses", "selesai", "ditolak"]);
  });
});
