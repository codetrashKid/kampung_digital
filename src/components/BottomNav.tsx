import NavLink from "./NavLink";

/** Navigasi bawah untuk ponsel (disembunyikan di layar lebar lewat CSS). */
export default function BottomNav({ loggedIn }: { loggedIn: boolean }) {
  return (
    <nav className="bottom-nav" aria-label="Menu ponsel">
      <NavLink href="/" label="Beranda" icon="home" className="bn-item" />
      <NavLink href="/usaha" label="Usaha" icon="store" className="bn-item" />
      <NavLink href="/laporan" label="Laporan" icon="flag" className="bn-item" />
      <NavLink href={loggedIn ? "/akun" : "/masuk"} label={loggedIn ? "Akun" : "Masuk"} icon="users" className="bn-item" />
      <NavLink href="/lapor" label="Lapor" icon="plus" exact className="bn-item bn-cta" />
    </nav>
  );
}
