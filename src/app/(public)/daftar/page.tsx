import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import ActionForm from "@/components/admin/ActionForm";
import { CheckboxField, TextField } from "@/components/admin/Fields";
import { getMember } from "@/lib/auth";
import { isDbConfigured } from "@/lib/db";
import { registerAction } from "../warga-actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Daftar Warga" };

type Props = { searchParams: Promise<{ kode?: string }> };

export default async function RegisterPage({ searchParams }: Props) {
  const { kode } = await searchParams;
  if (isDbConfigured() && (await getMember().catch(() => null))) redirect("/akun");

  return (
    <div className="narrow">
      <h1>Daftar Warga</h1>
      <p className="muted">
        Pendaftaran memakai <strong>kode undangan</strong> dari pengurus lingkungan. Belum punya kode? Tanyakan ke pengurus RT/RW Anda.
        Sudah terdaftar? <Link href="/masuk">Masuk di sini</Link>.
      </p>

      <ActionForm action={registerAction} cancelHref="/" cancelLabel="Batal" submitLabel="Daftar">
        <TextField
          name="code"
          label="Kode undangan"
          required
          defaultValue={kode ?? ""}
          maxLength={20}
          autoComplete="off"
          placeholder="ABCD-EFGH"
          hint="8 huruf/angka dari pengurus."
        />
        <TextField name="full_name" label="Nama lengkap" required maxLength={80} autoComplete="name" />
        <TextField
          name="phone"
          label="Nomor HP"
          type="tel"
          required
          autoComplete="tel"
          inputMode="tel"
          placeholder="0812-3456-7890"
          hint="Dipakai untuk masuk. Hanya terlihat oleh pengurus."
        />
        <div className="field-row">
          <TextField name="password" label="Sandi" type="password" required autoComplete="new-password" maxLength={200} hint="Minimal 8 karakter." />
          <TextField name="password_confirm" label="Ulangi sandi" type="password" required autoComplete="new-password" maxLength={200} />
        </div>

        <fieldset className="fieldset">
          <legend>Alamat</legend>
          <TextField name="address_block" label="Blok / nama jalan" required maxLength={100} placeholder="Contoh: Gang Melati" />
          <div className="field-row">
            <TextField name="house_number" label="Nomor rumah" maxLength={20} />
            <div className="field-row">
              <TextField name="rt" label="RT" inputMode="numeric" maxLength={3} />
              <TextField name="rw" label="RW" inputMode="numeric" maxLength={3} />
            </div>
          </div>
        </fieldset>

        <CheckboxField
          name="show_in_directory"
          label="Tampilkan nama dan blok saya di direktori warga"
          hint="Pilihan ini boleh dikosongkan dan bisa diubah kapan saja di halaman akun."
        />
        <CheckboxField
          name="consent"
          label="Saya menyetujui penggunaan data saya"
          hint="Data dipakai untuk layanan lingkungan ini dan dikelola pengurus sesuai Kebijakan Privasi. Anda dapat menghapus akun kapan saja."
        />
        <p className="muted small">
          Baca <Link href="/privasi">Kebijakan Privasi</Link> sebelum mendaftar.
        </p>
      </ActionForm>
    </div>
  );
}
