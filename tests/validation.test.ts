import { describe, expect, it } from "vitest";
import {
  normalizePhone,
  parseAnnouncement,
  parseBusiness,
  parseEvent,
  parseLocalDateTime,
  slugify,
  toLocalDateTimeValue,
} from "@/lib/validation";

const form = (o: Record<string, string>) => new Map(Object.entries(o)) as unknown as FormData;
const CAT = "11111111-1111-4111-8111-111111111111";

describe("slugify", () => {
  it("huruf kecil, tanpa aksen, tanda hubung", () => {
    expect(slugify("  Warung Bu Sari & Anak-Anak! ")).toBe("warung-bu-sari-anak-anak");
    expect(slugify("Café Éndah")).toBe("cafe-endah");
  });
  it("kosong bila tidak ada karakter valid", () => expect(slugify("!!!")).toBe(""));
  it("dipotong 60 karakter tanpa tanda hubung di ujung", () => {
    const s = slugify("a".repeat(59) + " b");
    expect(s.length).toBeLessThanOrEqual(60);
    expect(s.endsWith("-")).toBe(false);
  });
});

describe("normalizePhone", () => {
  it("0812... menjadi +62812...", () => expect(normalizePhone("0812-3456-7890")).toBe("+6281234567890"));
  it("menerima +62 dan 62", () => {
    expect(normalizePhone("+62 812 3456 7890")).toBe("+6281234567890");
    expect(normalizePhone("6281234567890")).toBe("+6281234567890");
  });
  it("null bila kosong, undefined bila tidak valid", () => {
    expect(normalizePhone("  ")).toBeNull();
    expect(normalizePhone("abc")).toBeUndefined();
    expect(normalizePhone("0812")).toBeUndefined();
    expect(normalizePhone("1".repeat(20))).toBeUndefined();
  });
});

describe("tanggal WIB", () => {
  it("datetime-local dianggap UTC+7", () => {
    expect(parseLocalDateTime("2026-12-04T07:00")?.toISOString()).toBe("2026-12-04T00:00:00.000Z");
  });
  it("menolak format salah", () => {
    expect(parseLocalDateTime("2026-12-04")).toBeNull();
    expect(parseLocalDateTime("")).toBeNull();
    expect(parseLocalDateTime("2026-13-45T99:99")).toBeNull();
  });
  it("bolak-balik konsisten", () => {
    expect(toLocalDateTimeValue(parseLocalDateTime("2026-12-04T19:30"))).toBe("2026-12-04T19:30");
    expect(toLocalDateTimeValue(null)).toBe("");
  });
});

describe("parseBusiness", () => {
  const base = { name: "Warung", category_id: CAT, status: "active" };

  it("menerima input minimal dan merapikan nilai", () => {
    const r = parseBusiness(form({ ...base, name: "  Warung  ", phone_wa: "0812-3456-7890" }));
    expect(r).toEqual({
      ok: true,
      value: { name: "Warung", category_id: CAT, description: null, address: null, phone_wa: "+6281234567890", status: "active" },
    });
  });
  it("mengumpulkan semua kesalahan sekaligus", () => {
    const r = parseBusiness(form({ name: "", category_id: "x", phone_wa: "abc", status: "hacked" }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toHaveLength(4);
  });
  it("membatasi panjang", () => {
    const r = parseBusiness(form({ ...base, name: "a".repeat(121) }));
    expect(r.ok).toBe(false);
  });
  it("status 'pending'/'rejected' tidak boleh dari form", () => {
    expect(parseBusiness(form({ ...base, status: "pending" })).ok).toBe(false);
  });
});

describe("parseAnnouncement", () => {
  it("valid", () => {
    expect(parseAnnouncement(form({ title: "Judul", body: "Isi", status: "draft" })).ok).toBe(true);
  });
  it("judul dan isi wajib", () => {
    const r = parseAnnouncement(form({ title: " ", body: "", status: "active" }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toHaveLength(2);
  });
});

describe("parseEvent", () => {
  const base = { title: "Kerja bakti", starts_at: "2026-12-04T07:00", status: "active" };
  it("valid dengan selesai opsional", () => {
    const r = parseEvent(form(base));
    expect(r.ok && r.value.ends_at).toBeNull();
  });
  it("selesai tidak boleh sebelum mulai", () => {
    const r = parseEvent(form({ ...base, ends_at: "2026-12-04T06:00" }));
    expect(r.ok).toBe(false);
  });
  it("waktu mulai wajib dan harus valid", () => {
    expect(parseEvent(form({ ...base, starts_at: "" })).ok).toBe(false);
    expect(parseEvent(form({ ...base, starts_at: "besok" })).ok).toBe(false);
  });
});
