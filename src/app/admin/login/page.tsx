import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ActionForm from "@/components/admin/ActionForm";
import { TextField } from "@/components/admin/Fields";
import { getAdmin, isAuthConfigured } from "@/lib/auth";
import { isDbConfigured } from "@/lib/db";
import { loginAction } from "../actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Masuk pengurus", robots: { index: false, follow: false } };

export default async function LoginPage() {
  let problem: string | null = null;
  if (!isDbConfigured()) problem = "DATABASE_URL belum diisi.";
  else if (!isAuthConfigured()) problem = "AUTH_SECRET belum diisi (minimal 32 karakter). Lihat .env.example.";
  else {
    try {
      if (await getAdmin()) redirect("/admin");
    } catch (err) {
      if ((err as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) throw err;
      console.error(err);
      problem = "Tidak bisa terhubung ke database.";
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <span className="brand-mark" aria-hidden="true">K</span>
        <h1>Masuk pengurus</h1>
        <p className="muted">Khusus pengurus lingkungan. Warga tidak perlu masuk untuk melihat portal.</p>
        {problem ? (
          <div className="alert alert-error" role="alert">{problem}</div>
        ) : (
          <ActionForm action={loginAction} cancelHref="/" submitLabel="Masuk">
            <TextField name="email" label="Email" type="email" required maxLength={254} />
            <TextField name="password" label="Sandi" type="password" required maxLength={200} />
          </ActionForm>
        )}
      </div>
    </div>
  );
}
