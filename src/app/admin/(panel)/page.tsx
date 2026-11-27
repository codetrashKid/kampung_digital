import Link from "next/link";
import { adminCounts, recentAudit } from "@/lib/admin-queries";
import { requireAdmin } from "@/lib/auth";

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
  "report.visibility": "mengubah tampilan publik laporan",
  "event.create": "menambah agenda",
  "event.update": "mengubah agenda",
  "event.delete": "menghapus agenda",
};

export default async function DashboardPage() {
  const { community, user } = await requireAdmin();
  const [counts, audit] = await Promise.all([adminCounts(community.id), recentAudit(community.id)]);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Halo, {user.full_name}</h1>
          <p className="muted">Ringkasan {community.name}</p>
        </div>
      </div>

      <div className="stat-grid">
        <Link href="/admin/laporan?status=baru" className="stat"><b>{counts.reports_new}</b><span>Laporan baru</span></Link>
        <Link href="/admin/usaha?status=active" className="stat"><b>{counts.businesses}</b><span>Usaha tayang</span></Link>
        <Link href="/admin/usaha?status=draft" className="stat"><b>{counts.draft}</b><span>Usaha draf / menunggu</span></Link>
        <Link href="/admin/pengumuman" className="stat"><b>{counts.announcements}</b><span>Pengumuman tayang</span></Link>
        <Link href="/admin/agenda" className="stat"><b>{counts.events}</b><span>Agenda mendatang</span></Link>
      </div>

      <div className="page-head"><h2>Aktivitas terakhir</h2></div>
      {audit.length === 0 ? (
        <p className="empty">Belum ada aktivitas.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <tbody>
              {audit.map((a) => (
                <tr key={a.id}>
                  <td><strong>{a.actor_name ?? "Sistem"}</strong> {ACTION_LABELS[a.action] ?? a.action}</td>
                  <td className="muted small">
                    {new Date(a.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
