import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const font = Plus_Jakarta_Sans({ subsets: ["latin"], display: "swap", variable: "--font-sans" });

export const metadata: Metadata = {
  title: { default: "Kampung Digital", template: "%s · Kampung Digital" },
  description: "Portal warga dan usaha lokal di lingkungan Anda.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0f6b4a" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={font.variable}>
      <body>{children}</body>
    </html>
  );
}
