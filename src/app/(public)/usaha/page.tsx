import type { Metadata } from "next";
import Link from "next/link";
import BusinessCard from "@/components/BusinessCard";
import SetupNotice from "@/components/SetupNotice";
import { isDbConfigured } from "@/lib/db";
import { getCurrentCommunity, listBusinesses, listCategories } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Usaha & Jasa" };

type Props = { searchParams: Promise<{ q?: string; kategori?: string }> };

export default async function BusinessesPage({ searchParams }: Props) {
  if (!isDbConfigured()) return <SetupNotice message="Variabel DATABASE_URL belum diisi." />;
  const { q, kategori } = await searchParams;

  try {
    const community = await getCurrentCommunity();
    if (!community) return <SetupNotice message="Lingkungan belum ditemukan." />;
    const [categories, businesses] = await Promise.all([
      listCategories(),
      listBusinesses({ communityId: community.id, q, categorySlug: kategori, limit: 60 }),
    ]);

    return (
      <>
        <h1>Usaha &amp; Jasa Warga</h1>
        <p className="muted">Dukung usaha tetangga: cari, lihat jam buka, lalu pesan lewat WhatsApp.</p>
        <form className="search" action="/usaha" role="search">
          <input name="q" defaultValue={q ?? ""} placeholder="Cari nama usaha…" aria-label="Cari usaha" />
          {kategori && <input type="hidden" name="kategori" value={kategori} />}
          <button className="btn" type="submit">Cari</button>
        </form>

        <nav className="chips" aria-label="Kategori">
          <Link href="/usaha" className={!kategori ? "chip active" : "chip"}>Semua</Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/usaha?kategori=${c.slug}`}
              className={kategori === c.slug ? "chip active" : "chip"}
            >
              {c.icon} {c.name}
            </Link>
          ))}
        </nav>

        {businesses.length === 0 ? (
          <p className="empty">Tidak ada usaha yang cocok. Coba kata kunci atau kategori lain.</p>
        ) : (
          <div className="grid">{businesses.map((b) => <BusinessCard key={b.id} b={b} />)}</div>
        )}
      </>
    );
  } catch (err) {
    console.error(err);
    return <SetupNotice message="Tidak bisa terhubung ke database." error={err} />;
  }
}
