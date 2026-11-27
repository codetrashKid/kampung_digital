import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import NavLink from "@/components/NavLink";
import { hasSessionCookie } from "@/lib/auth";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const loggedIn = await hasSessionCookie();
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
            <NavLink href={loggedIn ? "/akun" : "/masuk"} label={loggedIn ? "Akun saya" : "Masuk"} icon="users" />
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
            {loggedIn ? <Link href="/akun">Akun saya</Link> : <><Link href="/masuk">Masuk warga</Link><Link href="/daftar">Daftar warga</Link></>}
            <Link href="/privasi">Kebijakan privasi</Link>
            <Link href="/admin">Masuk pengurus</Link>
          </div>
        </div>
      </footer>
      <BottomNav loggedIn={loggedIn} />
    </>
  );
}
