import Link from "next/link";
import BusinessCard from "@/components/BusinessCard";
import SetupNotice from "@/components/SetupNotice";
import { isDbConfigured } from "@/lib/db";
import { dateBlock, formatDate, formatEventTime } from "@/lib/format";
import { reportCategoryLabel } from "@/lib/validation";
import StatusPill from "@/components/admin/StatusPill";
import {
  getCurrentCommunity,
  listAnnouncements,
  listBusinesses,
  listCategoriesWithCount,
  listPublicReports,
  listUpcomingEvents,
} from "@/lib/queries";

export const dynamic = "force-dynamic"; // data diambil dari database setiap kunjungan

export default async function HomePage() {
  if (!isDbConfigured()) return <SetupNotice message="Variabel DATABASE_URL belum diisi." />;

  try {
    const community = await getCurrentCommunity();
    if (!community) {
      return (
        <SetupNotice message="Lingkungan belum ditemukan. Jalankan npm run db:seed atau cek DEFAULT_COMMUNITY_SLUG." />
      );
    }
    const [businesses, announcements, events, categories, reports] = await Promise.all([
      listBusinesses({ communityId: community.id, limit: 6 }),
      listAnnouncements(community.id, 3),
      listUpcomingEvents(community.id, 4),
      listCategoriesWithCount(community.id),
      listPublicReports(community.id, { limit: 3 }),
    ]);
    const totalBusinesses = categories.reduce((sum, c) => sum + c.total, 0);

    return (
      <>
        <section className="hero">
          <span className="eyebrow">Portal warga</span>
          <h1>{community.name}</h1>
          {community.description && <p>{community.description}</p>}
          <form className="search" action="/usaha" role="search">
            <input name="q" placeholder="Cari warung, tukang, les…" aria-label="Cari usaha atau jasa" />
            <button className="btn" type="submit">Cari</button>
          </form>
          <div className="stats">
            <span><strong>{totalBusinesses}</strong>usaha &amp; jasa</span>
            <span><strong>{events.length}</strong>agenda mendatang</span>
          </div>
        </section>

        {categories.length > 0 && (
          <section className="section">
            <div className="section-head"><h2>Cari berdasarkan kategori</h2></div>
            <div className="cat-tiles">
              {categories.map((c) => (
                <Link key={c.id} href={`/usaha?kategori=${c.slug}`} className="cat-tile">
                  <span className="ico" aria-hidden="true">{c.icon}</span>
                  <strong>{c.name}</strong>
                  <span className="muted small">{c.total} usaha</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {(announcements.length > 0 || events.length > 0) && (
          <div className="two-col section">
            <section>
              <div className="section-head"><h2>Pengumuman</h2></div>
              {announcements.length === 0 ? (
                <p className="empty">Belum ada pengumuman.</p>
              ) : (
                <div className="stack">
                  {announcements.map((a) => (
                    <article key={a.id} className="announce">
                      <h3>{a.title}</h3>
                      <span className="muted small">{formatDate(a.published_at)}</span>
                      <p>{a.body}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>
            <section>
              <div className="section-head"><h2>Agenda</h2></div>
              {events.length === 0 ? (
                <p className="empty">Belum ada agenda.</p>
              ) : (
                <div className="stack">
                  {events.map((e) => {
                    const d = dateBlock(e.starts_at);
                    return (
                      <article key={e.id} className="event">
                        <div className="date-block"><b>{d.day}</b><span>{d.month}</span></div>
                        <div>
                          <h3>{e.title}</h3>
                          <p className="muted small">{formatEventTime(e.starts_at)}</p>
                          {e.location_text && <p className="muted small">📍 {e.location_text}</p>}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {reports.length > 0 && (
          <section className="section">
            <div className="section-head">
              <h2>Laporan warga terbaru</h2>
              <Link href="/laporan">Lihat semua →</Link>
            </div>
            <div className="grid">
              {reports.map((r) => (
                <article key={r.id} className="report-card">
                  <div className="report-head">
                    <span className="badge">{reportCategoryLabel(r.category)}</span>
                    <StatusPill status={r.status} />
                  </div>
                  <h3>{r.title}</h3>
                  <p className="desc clamp-3">{r.description}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="section">
          <div className="section-head">
            <h2>Usaha terpopuler</h2>
            <Link href="/usaha">Lihat semua →</Link>
          </div>
          {businesses.length === 0 ? (
            <p className="empty">Belum ada usaha terdaftar.</p>
          ) : (
            <div className="grid">{businesses.map((b) => <BusinessCard key={b.id} b={b} />)}</div>
          )}
        </section>
      </>
    );
  } catch (err) {
    console.error(err);
    return <SetupNotice message="Tidak bisa terhubung ke database. Periksa DATABASE_URL dan pastikan migrasi sudah dijalankan." />;
  }
}
