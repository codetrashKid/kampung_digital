import Link from "next/link";
import BusinessCard from "@/components/BusinessCard";
import SetupNotice from "@/components/SetupNotice";
import { isDbConfigured } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { getCurrentCommunity, listAnnouncements, listBusinesses } from "@/lib/queries";

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
    const [businesses, announcements] = await Promise.all([
      listBusinesses({ communityId: community.id, limit: 6 }),
      listAnnouncements(community.id, 3),
    ]);

    return (
      <>
        <section className="hero">
          <h1>{community.name}</h1>
          {community.description && <p>{community.description}</p>}
          <Link href="/usaha" className="btn">Lihat usaha &amp; jasa warga</Link>
        </section>

        {announcements.length > 0 && (
          <section>
            <h2>Pengumuman</h2>
            {announcements.map((a) => (
              <article key={a.id} className="item">
                <h3>{a.title}</h3>
                <p className="muted small">{formatDate(a.published_at)}</p>
                <p>{a.body}</p>
              </article>
            ))}
          </section>
        )}

        <section>
          <h2>Usaha terbaru &amp; terpopuler</h2>
          {businesses.length === 0 ? (
            <p className="muted">Belum ada usaha terdaftar.</p>
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
