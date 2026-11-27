import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import ActionForm from "@/components/admin/ActionForm";
import { TextField } from "@/components/admin/Fields";
import { getMember } from "@/lib/auth";
import { isDbConfigured } from "@/lib/db";
import { residentLoginAction } from "../warga-actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Masuk Warga" };

export default async function ResidentLoginPage() {
  if (isDbConfigured() && (await getMember().catch(() => null))) redirect("/akun");

  return (
    <div className="narrow">
      <h1>Masuk Warga</h1>
      <p className="muted">
        Masuk dengan nomor HP dan sandi Anda. Belum punya akun? <Link href="/daftar">Daftar dengan kode undangan</Link>.
      </p>
      <ActionForm action={residentLoginAction} cancelHref="/" cancelLabel="Kembali" submitLabel="Masuk">
        <TextField name="phone" label="Nomor HP" type="tel" required autoComplete="tel" inputMode="tel" placeholder="0812-3456-7890" />
        <TextField name="password" label="Sandi" type="password" required autoComplete="current-password" maxLength={200} />
        <p className="muted small">Lupa sandi? Hubungi pengurus lingkungan untuk bantuan.</p>
      </ActionForm>
    </div>
  );
}
