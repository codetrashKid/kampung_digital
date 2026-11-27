import { describe, expect, it } from "vitest";
import { DAY_NAMES, formatDate, shortTime, whatsappUrl } from "@/lib/format";

describe("whatsappUrl", () => {
  it("mengambil angka saja dari nomor", () => {
    expect(whatsappUrl("+62 812-3456-7890")).toBe("https://wa.me/6281234567890");
  });
  it("mengembalikan null untuk null, kosong, atau tanpa angka", () => {
    expect(whatsappUrl(null)).toBeNull();
    expect(whatsappUrl("")).toBeNull();
    expect(whatsappUrl("abc")).toBeNull();
  });
  it("meng-encode teks pesan", () => {
    expect(whatsappUrl("0812", "Halo Bu Sari & Pak Budi")).toBe(
      "https://wa.me/0812?text=Halo%20Bu%20Sari%20%26%20Pak%20Budi",
    );
  });
});

describe("formatDate", () => {
  it("string kosong untuk null", () => expect(formatDate(null)).toBe(""));
  it("memuat tahun dan hari", () => {
    const out = formatDate("2026-11-27T12:00:00Z");
    expect(out).toContain("2026");
    expect(out).toContain("27");
  });
});

describe("shortTime", () => {
  it("memotong detik", () => expect(shortTime("08:30:00")).toBe("08:30"));
  it("string kosong untuk null", () => expect(shortTime(null)).toBe(""));
});

describe("DAY_NAMES", () => {
  it("dimulai dari Minggu dan berisi 7 hari", () => {
    expect(DAY_NAMES).toHaveLength(7);
    expect(DAY_NAMES[0]).toBe("Minggu");
  });
});
