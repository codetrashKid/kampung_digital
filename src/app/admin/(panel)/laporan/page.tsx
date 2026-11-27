import type { Metadata } from "next";
import Link from "next/link";
import StatusPill from "@/components/admin/StatusPill";
import { adminListReports, adminReportCounts } from "@/lib/admin-queries";
import { requireAdmin } from "@/lib/auth";
import { REPORT_STATUSES, REPORT_STATUS_LABEL, reportCategoryLabel } from "@/lib/validation";

export const metadata: Metadata = { title: "Laporan warga" };

type Props = { searchParams: Promise<{ status?: string }> };

export default async function AdminReportsPage({ searchParams }: Props) {
  const { community } = await requireAdmin();
  const { status } = await searchParams;
  const active = status && (REPORT_STATUSES as readonly string[]).includes(status) ? status : undefined;
  const [items, counts] = await Promise.all([adminListReports(community.id, active), adminReportCounts(community.id)]);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <>
      <div className="page-head"><h1>Laporan warga</h1></div>

      <nav className="chips" aria-label="Filter status">
        <Link href="/admin/laporan" className={!active ? "chip active" : "chip"}>Semua ({total})</Link>
        {REPORT_STATUSES.map((s) => (
          <Link key={s} href={`/admin/laporan?status=${s}`} className={active === s ? "chip active" : "chip"}>
            {REPORT_STATUS_LABEL[s]} ({counts[s] ?? 0})
          </Link>
        ))}
      </nav>

      {items.length === 0 ? (
        <p className="empty">Tidak ada laporan.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Laporan</th><th>Jenis</th><th>Masuk</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id}>
                  <td><strong>{r.title}</strong><div className="muted small">{r.location_text}</div></td>
                  <td className="small">{reportCategoryLabel(r.category)}</td>
                  <td className="muted small">
                    {new Date(r.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" })}
                  </td>
                  <td><StatusPill status={r.status} />{r.is_public && <span className="pill pill-active" style={{ marginLeft: 6 }}>Publik</span>}</td>
                  <td><Link href={`/admin/laporan/${r.id}`} className="btn btn-light btn-sm">Buka</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
