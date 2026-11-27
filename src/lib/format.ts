export const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

/** Ubah nomor seperti +62 812-3456 menjadi tautan wa.me */
export function whatsappUrl(phone: string | null, text?: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  const query = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${digits}${query}`;
}

export function formatDate(d: Date | string | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export function shortTime(t: string | null): string {
  return t ? t.slice(0, 5) : "";
}

const TZ = "Asia/Jakarta";

/** Huruf pertama nama untuk avatar. */
export function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

/** Warna avatar yang stabil untuk teks yang sama (mis. slug kategori). */
export function avatarColor(seed: string): string {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.codePointAt(0)!) % 360;
  return `hsl(${h} 45% 36%)`;
}

/** Bagian tanggal untuk kotak tanggal agenda, dalam zona WIB. */
export function dateBlock(d: Date | string): { day: string; month: string } {
  const date = new Date(d);
  return {
    day: date.toLocaleDateString("id-ID", { day: "numeric", timeZone: TZ }),
    month: date.toLocaleDateString("id-ID", { month: "short", timeZone: TZ }),
  };
}

/** Contoh: "Minggu, 7 Des 2026 · 07.00 WIB". */
export function formatEventTime(d: Date | string): string {
  const date = new Date(d);
  const day = date.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "short", year: "numeric", timeZone: TZ });
  const time = date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
  return `${day} · ${time} WIB`;
}
