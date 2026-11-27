import type { Metadata } from "next";
import Link from "next/link";
import SetupNotice from "@/components/SetupNotice";
import StatusPill from "@/components/admin/StatusPill";
import { isDbConfigured } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { countPublicReportsByStatus, getCurrentCommunity, listPublicReports } from "@/lib/queries";
import { REPORT_CATEGORIES, REPORT_STATUS_LABEL, reportCategoryLabel } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Laporan Warga" };

type Props = { searchParams: Promise<{ status?: string; jenis?: string }> };

const PUBLIC_STATUSES = ["baru", "diproses", "selesai"] as const;

export default async function PublicReportsPage({ searchParams }: Props) {
  if (!isDbConfigured()) return <SetupNotice message="Variabel DATABASE_URL belum diisi." />;
  const { status, jenis } = await searchParams;
  const activeStatus = (PUBLIC_STATUSES as readonly string[]).includes(status ?? "") ? status : undefined;
  const activeCategory = REPORT_CATEGORIES.some((c) => c.value === jenis) ? jenis : undefined;

  try {
    const community = await getCurrentCommunity();
    if (!community) return <SetupNotice message="Lingkungan belum ditemukan." />;
    const [items, counts] = await Promise.all([
      listPublicReports(community.id, { status: activeStatus, category: activeCategory }),
      countPublicReportsByStatus(community.id),
    ]);
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const href = (s?: string, j?: string) => {
      const qs = new URLSearchParams();
      if (s) qs.set("status", s);
      if (j) qs.set("jenis", j);
      return qs.size ? `/laporan?${qs}` : "/laporan";
    };

    return (
      <>
        <div className="cta-row">
          <div>
            <h1>Laporan Warga</h1>
            <p className="muted">Masalah di lingkungan yang dilaporkan warga dan sedang ditangani pengurus.</p>
          </div>
          <Link href="/lapor" className="btn">+ Buat laporan</Link>
        </div>

        <nav className="chips" aria-label="Filter status">
          <Link href={href(undefined, activeCategory)} className={!activeStatus ? "chip active" : "chip"}>Semua ({total})</Link>
          {PUBLIC_STATUSES.map((s) => (
            <Link key={s} href={href(s, activeCategory)} className={activeStatus === s ? "chip active" : "chip"}>
              {REPORT_STATUS_LABEL[s]} ({counts[s] ?? 0})
            </Link>
          ))}
        </nav>
        <nav className="chips" aria-label="Filter jenis" style={{ marginTop: -8 }}>
          <Link href={href(activeStatus)} className={!activeCategory ? "chip active" : "chip"}>Semua jenis</Link>
          {REPORT_CATEGORIES.map((c) => (
            <Link key={c.value} href={href(activeStatus, c.value)} className={activeCategory === c.value ? "chip active" : "chip"}>
              {reportCategoryLabel(c.value)}
            </Link>
          ))}
        </nav>

        {items.length === 0 ? (
          <p className="empty">Belum ada laporan yang ditampilkan.</p>
        ) : (
          <div className="grid">
            {items.map((r) => (
              <article key={r.id} className="report-card">
                <div className="report-head">
                  <span className="badge">{reportCategoryLabel(r.category)}</span>
                  <StatusPill status={r.status} />
                </div>
                <h3>{r.title}</h3>
                <p className="desc">{r.description}</p>
                <div className="meta">
                  {r.location_text && <span>📍 {r.location_text}</span>}
                  <span>{formatDate(r.created_at)}</span>
                </div>
              </article>
            ))}
          </div>
        )}
        <p className="muted small" style={{ marginTop: 20 }}>
          Hanya laporan yang sudah diperiksa pengurus yang ditampilkan di sini. Identitas pelapor tidak pernah dipublikasikan.
        </p>
      </>
    );
  } catch (err) {
    console.error(err);
    return <SetupNotice message="Tidak bisa terhubung ke database. Pastikan migrasi sudah dijalankan (npm run db:migrate)." error={err} />;
  }
}
