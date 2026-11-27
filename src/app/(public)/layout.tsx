import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import NavLink from "@/components/NavLink";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#isi" className="skip-link">Lewati ke isi halaman</a>
      <header className="site-header">
        <div className="container bar">
          <Link href="/" className="brand">
            <span className="brand-mark" aria-hidden="true">K</span>
            <span>Kampung Digital</span>
          </Link>
          <nav className="top-nav" aria-label="Menu utama">
            <NavLink href="/" label="Beranda" icon="home" />
            <NavLink href="/usaha" label="Usaha & Jasa" icon="store" />
            <NavLink href="/laporan" label="Laporan" icon="flag" />
            <NavLink href="/lapor" label="Buat laporan" exact className="top-cta" />
          </nav>
        </div>
      </header>
      <main id="isi" className="container page">{children}</main>
      <div className="skyline-divider" aria-hidden="true" />
      <footer className="site-footer">
        <div className="container foot">
          <div>
            <strong>Kampung Digital</strong>
            <p className="muted small">Menghubungkan warga dengan usaha dan kegiatan di lingkungannya.</p>
          </div>
          <div className="foot-links small">
            <Link href="/usaha">Cari usaha</Link>
            <Link href="/laporan">Laporan warga</Link>
            <Link href="/lapor">Lapor ke pengurus</Link>
            <Link href="/admin">Masuk pengurus</Link>
          </div>
        </div>
      </footer>
      <BottomNav />
    </>
  );
}
