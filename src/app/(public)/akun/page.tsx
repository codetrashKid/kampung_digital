import type { Metadata } from "next";
import Link from "next/link";
import ActionForm from "@/components/admin/ActionForm";
import { CheckboxField, TextField } from "@/components/admin/Fields";
import { requireMember } from "@/lib/auth";
import { getMyAccount } from "@/lib/resident-queries";
import { MEMBER_ROLE_LABEL } from "@/lib/resident";
import { changePasswordAction, deleteAccountAction, residentLogoutAction, updateProfileAction } from "../warga-actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Akun Saya", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ selamat?: string; pesan?: string }> };

export default async function AccountPage({ searchParams }: Props) {
  const { user, community, role } = await requireMember();
  const { selamat, pesan } = await searchParams;
  const acc = await getMyAccount(community.id, user.id);
  const isAdmin = role === "pengurus" || role === "admin_lingkungan" || user.platform_role === "super_admin";
  const canDelete = !(role === "admin_lingkungan" || user.platform_role === "super_admin");

  return (
    <div className="narrow">
      <div className="cta-row">
        <div>
          <h1>Halo, {user.full_name}</h1>
          <p className="muted">{MEMBER_ROLE_LABEL[role] ?? role} · {community.name}</p>
        </div>
        <form action={residentLogoutAction}>
          <button type="submit" className="btn btn-light btn-sm">Keluar</button>
        </form>
      </div>

      {selamat && (
        <div className="alert alert-ok" role="status">
          <strong>Selamat datang, pendaftaran berhasil.</strong> Anda sudah masuk. Lengkapi atau ubah data Anda di bawah kapan saja.
        </div>
      )}
      {pesan === "tersimpan" && <div className="alert alert-ok" role="status">Data Anda disimpan.</div>}
      {pesan === "sandi" && <div className="alert alert-ok" role="status">Sandi berhasil diganti.</div>}
      {isAdmin && (
        <p><Link href="/admin" className="btn btn-sm">Buka panel pengurus</Link></p>
      )}

      <section className="section">
        <h2>Data saya</h2>
        <p className="muted small">Nomor HP: <strong>{user.phone}</strong> (dipakai untuk masuk, hanya terlihat oleh pengurus).</p>
        <ActionForm action={updateProfileAction} cancelHref="/" cancelLabel="Beranda" submitLabel="Simpan data">
          <TextField name="address_block" label="Blok / nama jalan" required maxLength={100} defaultValue={acc?.address_block} />
          <div className="field-row">
            <TextField name="house_number" label="Nomor rumah" maxLength={20} defaultValue={acc?.house_number} />
            <div className="field-row">
              <TextField name="rt" label="RT" inputMode="numeric" maxLength={3} defaultValue={acc?.rt} />
              <TextField name="rw" label="RW" inputMode="numeric" maxLength={3} defaultValue={acc?.rw} />
            </div>
          </div>
          <CheckboxField
            name="show_in_directory"
            label="Tampilkan nama dan blok saya di direktori warga"
            defaultChecked={acc?.show_in_directory ?? false}
          />
        </ActionForm>
      </section>

      <section className="section">
        <h2>Ganti sandi</h2>
        <ActionForm action={changePasswordAction} cancelHref="/akun" cancelLabel="Batal" submitLabel="Ganti sandi">
          <TextField name="current_password" label="Sandi saat ini" type="password" required autoComplete="current-password" maxLength={200} />
          <div className="field-row">
            <TextField name="new_password" label="Sandi baru" type="password" required autoComplete="new-password" maxLength={200} hint="Minimal 8 karakter." />
            <TextField name="new_password_confirm" label="Ulangi sandi baru" type="password" required autoComplete="new-password" maxLength={200} />
          </div>
        </ActionForm>
      </section>

      <section className="section">
        <h2>Hapus akun</h2>
        {canDelete ? (
          <>
            <p className="muted">
              Menghapus akun mengosongkan nama dan nomor HP Anda serta menghapus data alamat. Tindakan ini tidak dapat dibatalkan.
            </p>
            <ActionForm action={deleteAccountAction} cancelHref="/akun" cancelLabel="Batal" submitLabel="Hapus akun saya">
              <TextField name="confirm_password" label="Masukkan sandi untuk konfirmasi" type="password" required autoComplete="current-password" maxLength={200} />
            </ActionForm>
          </>
        ) : (
          <p className="muted">Akun admin tidak dapat dihapus sendiri. Minta admin lain mengalihkan peran Anda terlebih dahulu.</p>
        )}
      </section>
    </div>
  );
}
