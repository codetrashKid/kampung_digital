/**
 * Ringkasan penyebab error database untuk pengembang (mis. "XX000: max clients reached ...").
 * Pesan error PostgreSQL tidak memuat sandi. Tampilkan hanya di mode pengembangan.
 */
export function describeDbError(err: unknown): string {
  if (!err || typeof err !== "object") return String(err ?? "tidak diketahui");
  const e = err as { code?: unknown; message?: unknown };
  const code = typeof e.code === "string" ? e.code : "";
  const message = typeof e.message === "string" ? e.message : "tidak diketahui";
  return (code ? `${code}: ` : "") + message.slice(0, 300);
}

/** Petunjuk perbaikan untuk penyebab yang paling sering terjadi. */
export function dbErrorHint(err: unknown): string | null {
  const text = describeDbError(err);
  if (/EMAXCONNSESSION|max clients reached/i.test(text)) {
    return "Pool sesi Supabase penuh. Pakai port 6543 (Transaction pooler) di DATABASE_URL, lalu mulai ulang server.";
  }
  if (/password authentication failed|28P01/i.test(text)) {
    return "Sandi salah. Periksa DATABASE_URL; karakter khusus di sandi harus di-URL-encode (% menjadi %25).";
  }
  if (/ENOTFOUND|EAI_AGAIN/i.test(text)) return "Host database tidak ditemukan. Periksa nama host di DATABASE_URL.";
  if (/ETIMEDOUT|CONNECT_TIMEOUT|ECONNREFUSED/i.test(text)) {
    return "Database tidak terjangkau. Periksa host/port, atau coba lagi (pooler Supabase kadang penuh).";
  }
  if (/relation .* does not exist|42P01/i.test(text)) return "Tabel belum ada. Jalankan npm run db:migrate.";
  return null;
}
