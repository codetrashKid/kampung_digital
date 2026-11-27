"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "../Icon";
import NavLink from "../NavLink";
import { initialOf } from "@/lib/format";

type Props = {
  userName: string;
  roleLabel: string;
  communityName: string;
  isSuperAdmin: boolean;
  logoutAction: () => Promise<void>;
  children: React.ReactNode;
};

/** Kerangka panel admin: sidebar (desktop) dan laci menu (ponsel). */
export default function AdminShell({ userName, roleLabel, communityName, isSuperAdmin, logoutAction, children }: Props) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <button type="button" className="icon-btn" onClick={() => setOpen(true)} aria-label="Buka menu" aria-expanded={open}>
          <Icon name="menu" />
        </button>
        <Link href="/admin" className="brand"><span className="brand-mark" aria-hidden="true">K</span><span>Panel Pengurus</span></Link>
      </header>

      {open && <div className="admin-scrim" onClick={close} aria-hidden="true" />}

      <aside className={`admin-side ${open ? "open" : ""}`} aria-label="Menu admin">
        <div className="admin-side-head">
          <Link href="/admin" className="brand" onClick={close}>
            <span className="brand-mark" aria-hidden="true">K</span>
            <span>Panel Pengurus</span>
          </Link>
          <button type="button" className="icon-btn side-close" onClick={close} aria-label="Tutup menu"><Icon name="x" /></button>
        </div>
        <div className="side-community">{communityName}</div>

        <nav className="admin-nav">
          <NavLink href="/admin" label="Ringkasan" icon="chart" exact className="nav-item" onClick={close} />
          <div className="nav-group">Konten</div>
          <NavLink href="/admin/usaha" label="Usaha & Jasa" icon="store" className="nav-item" onClick={close} />
          <NavLink href="/admin/pengumuman" label="Pengumuman" icon="megaphone" className="nav-item" onClick={close} />
          <NavLink href="/admin/agenda" label="Agenda" icon="calendar" className="nav-item" onClick={close} />
          <div className="nav-group">Warga</div>
          <NavLink href="/admin/laporan" label="Laporan warga" icon="flag" className="nav-item" onClick={close} />
          {isSuperAdmin && (
            <>
              <div className="nav-group">Platform</div>
              <NavLink href="/admin/rilis" label="Rilis aplikasi" icon="phone" className="nav-item" onClick={close} />
            </>
          )}
        </nav>

        <div className="admin-user">
          <a href="/" target="_blank" rel="noopener noreferrer" className="nav-item">
            <Icon name="external" /><span>Lihat situs</span>
          </a>
          <div className="user-row">
            <span className="user-avatar" aria-hidden="true">{initialOf(userName)}</span>
            <div className="user-meta">
              <strong>{userName}</strong>
              <span>{roleLabel}</span>
            </div>
            <form action={logoutAction}>
              <button type="submit" className="icon-btn" aria-label="Keluar" title="Keluar"><Icon name="logout" /></button>
            </form>
          </div>
        </div>
      </aside>

      <main className="admin-main">{children}</main>
    </div>
  );
}
