import Link from "next/link";

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
          <nav aria-label="Menu utama">
            <Link href="/">Beranda</Link>
            <Link href="/usaha">Usaha &amp; Jasa</Link>
            <Link href="/laporan">Laporan</Link>
          </nav>
        </div>
      </header>
      <main id="isi" className="container page">{children}</main>
      <footer className="site-footer">
        <div className="container foot">
          <div>
            <strong>Kampung Digital</strong>
            <p className="muted small">Menghubungkan warga dengan usaha dan kegiatan di lingkungannya.</p>
          </div>
          <div className="foot-links small">
            <Link href="/usaha">Cari usaha</Link>
            <Link href="/lapor">Lapor ke pengurus</Link>
            <Link href="/admin">Masuk pengurus</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
