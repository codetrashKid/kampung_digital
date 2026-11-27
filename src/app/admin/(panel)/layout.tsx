import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { logoutAction } from "../actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { default: "Panel Pengurus", template: "%s · Panel Pengurus" }, robots: { index: false, follow: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { user, community } = await requireAdmin();
  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <Link href="/admin" className="brand">
          <span className="brand-mark" aria-hidden="true">K</span>
          <span>Panel Pengurus</span>
        </Link>
        <nav className="admin-nav" aria-label="Menu admin">
          <Link href="/admin">Ringkasan</Link>
          <Link href="/admin/usaha">Usaha &amp; Jasa</Link>
          <Link href="/admin/laporan">Laporan warga</Link>
          <Link href="/admin/pengumuman">Pengumuman</Link>
          <Link href="/admin/agenda">Agenda</Link>
          <Link href="/" target="_blank">Lihat situs ↗</Link>
        </nav>
        <div className="admin-user">
          <div><strong>{user.full_name}</strong></div>
          <div>{community.name}</div>
          <form action={logoutAction}>
            <button type="submit" className="btn btn-light btn-sm">Keluar</button>
          </form>
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
