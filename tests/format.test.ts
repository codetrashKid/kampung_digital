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

import { avatarColor, dateBlock, formatEventTime, initialOf } from "@/lib/format";

describe("avatar", () => {
  it("initialOf mengambil huruf pertama kapital", () => {
    expect(initialOf("  warung bu sari")).toBe("W");
    expect(initialOf("")).toBe("?");
  });
  it("avatarColor stabil untuk teks yang sama", () => {
    expect(avatarColor("makanan")).toBe(avatarColor("makanan"));
    expect(avatarColor("makanan")).toMatch(/^hsl\(\d+ 45% 36%\)$/);
  });
});

describe("tanggal agenda (WIB)", () => {
  it("tengah malam UTC jatuh di hari yang sama pukul 07.00 WIB", () => {
    const d = dateBlock("2026-12-04T00:00:00Z");
    expect(d.day).toBe("4");
    expect(formatEventTime("2026-12-04T00:00:00Z")).toContain("07.00 WIB");
  });
  it("UTC 20:00 sudah hari berikutnya di WIB", () => {
    expect(dateBlock("2026-12-04T20:00:00Z").day).toBe("5");
  });
});
