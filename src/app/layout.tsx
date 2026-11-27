import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Kampung Digital", template: "%s · Kampung Digital" },
  description: "Portal warga dan usaha lokal di lingkungan Anda.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <header className="site-header">
          <div className="container bar">
            <Link href="/" className="brand">🏘️ Kampung Digital</Link>
            <nav>
              <Link href="/">Beranda</Link>
              <Link href="/usaha">Usaha &amp; Jasa</Link>
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
        <footer className="site-footer">
          <div className="container muted small">
            Kampung Digital · Lisensi MIT · Dibuat untuk warga
          </div>
        </footer>
      </body>
    </html>
  );
}
