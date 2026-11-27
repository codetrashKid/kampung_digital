// Validasi input form admin. Murni (tanpa database) agar mudah diuji.

export type Result<T> = { ok: true; value: T } | { ok: false; errors: string[] };

type Getter = { get(name: string): FormDataEntryValue | null };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function text(g: Getter, name: string): string {
  const v = g.get(name);
  return typeof v === "string" ? v.trim() : "";
}

export function isUuid(v: string): boolean {
  return UUID_RE.test(v);
}

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

/** Menormalkan nomor WhatsApp ke format +62...; null bila kosong, undefined bila tidak valid. */
export function normalizePhone(raw: string): string | null | undefined {
  const cleaned = raw.replace(/[\s().-]/g, "");
  if (!cleaned) return null;
  if (!/^\+?\d+$/.test(cleaned)) return undefined;
  let digits = cleaned.replace(/^\+/, "");
  if (digits.startsWith("0")) digits = "62" + digits.slice(1);
  if (digits.length < 9 || digits.length > 15) return undefined;
  return "+" + digits;
}

/** Nilai <input type="datetime-local"> dianggap waktu WIB (UTC+7). */
export function parseLocalDateTime(raw: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)) return null;
  const d = new Date(`${raw}:00+07:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Kebalikan dari parseLocalDateTime, untuk mengisi form edit. */
export function toLocalDateTimeValue(d: Date | string | null): string {
  if (!d) return "";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() + 7 * 3600_000).toISOString().slice(0, 16);
}

function lengthError(label: string, value: string, min: number, max: number): string | null {
  if (value.length === 0 && min > 0) return `${label} wajib diisi.`;
  if (value.length < min) return `${label} minimal ${min} karakter.`;
  if (value.length > max) return `${label} maksimal ${max} karakter.`;
  return null;
}

function collect(errors: (string | null)[]): string[] {
  return errors.filter((e): e is string => e !== null);
}

export const PUBLISH_STATUSES = ["draft", "active", "archived"] as const;
export type PublishStatus = (typeof PUBLISH_STATUSES)[number];

function parseStatus(g: Getter): PublishStatus | null {
  const s = text(g, "status");
  return (PUBLISH_STATUSES as readonly string[]).includes(s) ? (s as PublishStatus) : null;
}

export type BusinessInput = {
  name: string;
  category_id: string;
  description: string | null;
  address: string | null;
  phone_wa: string | null;
  status: PublishStatus;
};

export function parseBusiness(g: Getter): Result<BusinessInput> {
  const name = text(g, "name");
  const category_id = text(g, "category_id");
  const description = text(g, "description");
  const address = text(g, "address");
  const phone = normalizePhone(text(g, "phone_wa"));
  const status = parseStatus(g);
  const errors = collect([
    lengthError("Nama usaha", name, 1, 120),
    UUID_RE.test(category_id) ? null : "Pilih kategori.",
    lengthError("Deskripsi", description, 0, 2000),
    lengthError("Alamat", address, 0, 255),
    phone === undefined ? "Nomor WhatsApp tidak valid (contoh: 0812-3456-7890)." : null,
    status ? null : "Status tidak valid.",
  ]);
  if (errors.length || !status) return { ok: false, errors };
  return {
    ok: true,
    value: {
      name,
      category_id,
      description: description || null,
      address: address || null,
      phone_wa: phone ?? null,
      status,
    },
  };
}

export type AnnouncementInput = { title: string; body: string; status: PublishStatus };

export function parseAnnouncement(g: Getter): Result<AnnouncementInput> {
  const title = text(g, "title");
  const body = text(g, "body");
  const status = parseStatus(g);
  const errors = collect([
    lengthError("Judul", title, 1, 150),
    lengthError("Isi pengumuman", body, 1, 5000),
    status ? null : "Status tidak valid.",
  ]);
  if (errors.length || !status) return { ok: false, errors };
  return { ok: true, value: { title, body, status } };
}

export type EventInput = {
  title: string;
  description: string | null;
  location_text: string | null;
  starts_at: Date;
  ends_at: Date | null;
  status: PublishStatus;
};

export function parseEvent(g: Getter): Result<EventInput> {
  const title = text(g, "title");
  const description = text(g, "description");
  const location = text(g, "location_text");
  const startsRaw = text(g, "starts_at");
  const endsRaw = text(g, "ends_at");
  const starts = parseLocalDateTime(startsRaw);
  const ends = endsRaw ? parseLocalDateTime(endsRaw) : null;
  const status = parseStatus(g);
  const errors = collect([
    lengthError("Judul", title, 1, 150),
    lengthError("Keterangan", description, 0, 3000),
    lengthError("Lokasi", location, 0, 200),
    starts ? null : "Waktu mulai wajib diisi.",
    endsRaw && !ends ? "Waktu selesai tidak valid." : null,
    starts && ends && ends < starts ? "Waktu selesai tidak boleh sebelum waktu mulai." : null,
    status ? null : "Status tidak valid.",
  ]);
  if (errors.length || !status || !starts) return { ok: false, errors };
  return {
    ok: true,
    value: {
      title,
      description: description || null,
      location_text: location || null,
      starts_at: starts,
      ends_at: ends,
      status,
    },
  };
}

// ---------- Laporan warga ----------

export const REPORT_CATEGORIES = [
  { value: "infrastruktur", label: "Jalan, selokan, lampu (infrastruktur)" },
  { value: "kebersihan", label: "Sampah dan kebersihan" },
  { value: "keamanan", label: "Keamanan dan ketertiban" },
  { value: "lainnya", label: "Lainnya" },
] as const;
/** Label pendek jenis laporan, mis. "Jalan, selokan, lampu". */
export function reportCategoryLabel(value: string): string {
  const found = REPORT_CATEGORIES.find((c) => c.value === value);
  return found ? found.label.replace(/\s*\(.*\)$/, "") : value;
}

export const REPORT_STATUS_LABEL: Record<string, string> = {
  baru: "Baru",
  diproses: "Diproses",
  selesai: "Selesai",
  ditolak: "Ditolak",
};
export const REPORT_STATUSES = ["baru", "diproses", "selesai", "ditolak"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export type ReportInput = {
  category: string;
  title: string;
  description: string;
  location_text: string | null;
  reporter_name: string | null;
  reporter_phone: string | null;
};

export function parseReport(g: Getter): Result<ReportInput> {
  const category = text(g, "category");
  const title = text(g, "title");
  const description = text(g, "description");
  const location = text(g, "location_text");
  const name = text(g, "reporter_name");
  const phone = normalizePhone(text(g, "reporter_phone"));
  const errors = collect([
    REPORT_CATEGORIES.some((c) => c.value === category) ? null : "Pilih jenis laporan.",
    lengthError("Judul laporan", title, 3, 120),
    lengthError("Uraian", description, 10, 2000),
    lengthError("Lokasi", location, 0, 200),
    lengthError("Nama", name, 0, 80),
    phone === undefined ? "Nomor HP tidak valid (contoh: 0812-3456-7890)." : null,
  ]);
  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      category,
      title,
      description,
      location_text: location || null,
      reporter_name: name || null,
      reporter_phone: phone ?? null,
    },
  };
}
