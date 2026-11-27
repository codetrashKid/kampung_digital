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
