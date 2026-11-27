import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Kampung Digital", template: "%s · Kampung Digital" },
  description: "Portal warga dan usaha lokal di lingkungan Anda.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0f6b4a" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
