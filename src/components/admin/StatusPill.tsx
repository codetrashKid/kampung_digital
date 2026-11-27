const LABELS: Record<string, string> = {
  active: "Tayang",
  draft: "Draf",
  pending: "Menunggu",
  archived: "Diarsipkan",
  rejected: "Ditolak",
  baru: "Baru",
  diproses: "Diproses",
  selesai: "Selesai",
  ditolak: "Ditolak",
};

export default function StatusPill({ status }: { status: string }) {
  return <span className={`pill pill-${status}`}>{LABELS[status] ?? status}</span>;
}

export const STATUS_OPTIONS = [
  { value: "active", label: "Tayang (terlihat warga)" },
  { value: "draft", label: "Draf (disembunyikan)" },
  { value: "archived", label: "Diarsipkan" },
];
