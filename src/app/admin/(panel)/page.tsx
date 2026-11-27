import Link from "next/link";
import Icon, { type IconName } from "@/components/Icon";
import { adminCounts, adminListReports, recentAudit } from "@/lib/admin-queries";
import { requireAdmin } from "@/lib/auth";
import { initialOf } from "@/lib/format";
import { reportCategoryLabel } from "@/lib/validation";

const ACTION_LABELS: Record<string, string> = {
  "auth.login": "masuk ke panel",
  "business.create": "menambah usaha",
  "business.update": "mengubah usaha",
  "business.status": "mengubah status usaha",
  "business.delete": "menghapus usaha",
  "announcement.create": "menambah pengumuman",
  "announcement.update": "mengubah pengumuman",
  "announcement.delete": "menghapus pengumuman",
  "report.create": "menerima laporan warga",
  "report.status": "mengubah status laporan",
  "release.create": "menambah rilis aplikasi",
  "release.update": "mengubah rilis aplikasi",
  "release.active": "mengaktifkan atau menonaktifkan rilis aplikasi",
  "release.delete": "menghapus rilis aplikasi",
  "report.visibility": "mengubah tampilan publik laporan",
  "event.create": "menambah agenda",
  "event.update": "mengubah agenda",
  "event.delete": "menghapus agenda",
};

const STATS: { key: "reports_new" | "businesses" | "draft" | "announcements" | "events"; label: string; href: string; icon: IconName; tone: string }[] = [
  { key: "reports_new", label: "Laporan baru", href: "/admin/laporan?status=baru", icon: "flag", tone: "tone-rose" },
  { key: "businesses", label: "Usaha tayang", href: "/admin/usaha?status=active", icon: "store", tone: "tone-green" },
  { key: "draft", label: "Usaha draf / menunggu", href: "/admin/usaha?status=draft", icon: "edit", tone: "tone-amber" },
  { key: "announcements", label: "Pengumuman tayang", href: "/admin/pengumuman", icon: "megaphone", tone: "tone-blue" },
  { key: "events", label: "Agenda mendatang", href: "/admin/agenda", icon: "calendar", tone: "tone-green" },
];

const QUICK: { href: string; label: string; icon: IconName }[] = [
  { href: "/admin/usaha/baru", label: "Tambah usaha", icon: "store" },
  { href: "/admin/pengumuman/baru", label: "Tulis pengumuman", icon: "megaphone" },
  { href: "/admin/agenda/baru", label: "Tambah agenda", icon: "calendar" },
  { href: "/admin/laporan", label: "Tinjau laporan", icon: "flag" },
];

const time = (d: Date) =>
  new Date(d).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" });

function greeting(): string {
  const hour = Number(new Date().toLocaleString("en-GB", { hour: "2-digit", hour12: false, timeZone: "Asia/Jakarta" }));
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
}

export default async function DashboardPage() {
  const { community, user } = await requireAdmin();
  const [counts, audit, newReports] = await Promise.all([
    adminCounts(community.id),
    recentAudit(community.id),
    adminListReports(community.id, "baru"),
  ]);

  return (
    <>
      <section className="welcome">
        <h1>{greeting()}, {user.full_name}</h1>
        <p>Ringkasan {community.name}</p>
      </section>

      <div className="stat-grid">
        {STATS.map((s) => (
          <Link key={s.key} href={s.href} className="stat">
            <span className={`stat-ico ${s.tone}`}><Icon name={s.icon} size={22} /></span>
            <div><b>{counts[s.key]}</b><span>{s.label}</span></div>
          </Link>
        ))}
      </div>

      <div className="dash-grid">
        <div className="card-box">
          <header><h2>Aktivitas terakhir</h2></header>
          {audit.length === 0 ? (
            <p className="empty" style={{ border: 0 }}>Belum ada aktivitas.</p>
          ) : (
            <ul className="timeline">
              {audit.map((a) => (
                <li key={a.id}>
                  <span className="tl-dot" aria-hidden="true">{initialOf(a.actor_name ?? "S")}</span>
                  <div>
                    <strong>{a.actor_name ?? "Sistem"}</strong> {ACTION_LABELS[a.action] ?? a.action}
                    <span className="tl-time">{time(a.created_at)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="stack">
          <div className="card-box">
            <header>
              <h2>Perlu perhatian</h2>
              {newReports.length > 0 && <Link href="/admin/laporan?status=baru" className="small">Lihat semua</Link>}
            </header>
            {newReports.length === 0 ? (
              <p className="muted" style={{ padding: "16px 18px", margin: 0 }}>
                <Icon name="check" size={16} /> Tidak ada laporan baru. Semua sudah ditangani.
              </p>
            ) : (
              <div className="body">
                {newReports.slice(0, 4).map((r) => (
                  <Link key={r.id} href={`/admin/laporan/${r.id}`} className="attn">
                    <div>
                      <strong>{r.title}</strong>
                      <small>{reportCategoryLabel(r.category)} · {time(r.created_at)}</small>
                    </div>
                    <Icon name="chevron" size={18} />
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="card-box">
            <header><h2>Aksi cepat</h2></header>
            <div className="actions-grid">
              {QUICK.map((q) => (
                <Link key={q.href} href={q.href} className="action-tile">
                  <Icon name={q.icon} size={18} /> {q.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
