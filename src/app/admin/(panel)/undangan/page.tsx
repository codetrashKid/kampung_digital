import type { Metadata } from "next";
import { headers } from "next/headers";
import ActionForm from "@/components/admin/ActionForm";
import CopyButton from "@/components/admin/CopyButton";
import { SelectField, TextField } from "@/components/admin/Fields";
import { requireAdmin } from "@/lib/auth";
import { formatInviteCode, isInviteUsable } from "@/lib/resident";
import { adminListInvites } from "@/lib/resident-queries";
import { createInviteAction, setInviteActiveAction } from "../../actions";

export const metadata: Metadata = { title: "Kode undangan" };

type Props = { searchParams: Promise<{ pesan?: string }> };

export default async function InvitesPage({ searchParams }: Props) {
  const { community } = await requireAdmin();
  const { pesan } = await searchParams;
  const invites = await adminListInvites(community.id);

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Kode undangan</h1>
          <p className="muted">Bagikan kode atau tautan ke warga (mis. lewat grup WhatsApp RT). Warga yang mendaftar dengan kode otomatis menjadi anggota aktif.</p>
        </div>
      </div>
      {pesan && <div className="alert alert-ok" role="status">{pesan === "dibuat" ? "Kode baru dibuat." : "Perubahan disimpan."}</div>}

      <div className="card-box" style={{ marginBottom: 22 }}>
        <header><h2>Buat kode baru</h2></header>
        <div style={{ padding: 18 }}>
          <ActionForm action={createInviteAction} cancelHref="/admin/undangan" cancelLabel="Batal" submitLabel="Buat kode">
            <TextField name="label" label="Label (opsional)" maxLength={80} placeholder="Contoh: RT 03, November 2026" />
            <div className="field-row">
              <TextField name="max_uses" label="Batas pemakaian (opsional)" type="number" inputMode="numeric" hint="Kosongkan bila tanpa batas." />
              <SelectField
                name="expires_in_days"
                label="Masa berlaku"
                options={[
                  { value: "7", label: "7 hari" },
                  { value: "30", label: "30 hari" },
                  { value: "90", label: "90 hari" },
                  { value: "", label: "Tanpa batas waktu" },
                ]}
                defaultValue="30"
              />
            </div>
          </ActionForm>
        </div>
      </div>

      {invites.length === 0 ? (
        <p className="empty">Belum ada kode undangan.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Kode</th><th>Pemakaian</th><th>Berlaku sampai</th><th>Status</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              {invites.map((i) => {
                const usable = isInviteUsable(i);
                const link = `${proto}://${host}/daftar?kode=${i.code}`;
                return (
                  <tr key={i.id}>
                    <td>
                      <strong className="code-cell">{formatInviteCode(i.code)}</strong>
                      <div className="muted small">{i.label ?? "Tanpa label"}</div>
                    </td>
                    <td>{i.used_count}{i.max_uses !== null ? ` / ${i.max_uses}` : " (tanpa batas)"}</td>
                    <td className="small">
                      {i.expires_at ? new Date(i.expires_at).toLocaleDateString("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" }) : "Tanpa batas"}
                    </td>
                    <td>
                      <span className={`pill ${usable ? "pill-active" : "pill-archived"}`}>
                        {usable ? "Berlaku" : !i.is_active ? "Dinonaktifkan" : "Habis / kedaluwarsa"}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <CopyButton text={formatInviteCode(i.code)} label="Salin kode" />
                        <CopyButton text={link} label="Salin tautan" />
                        <form action={setInviteActiveAction.bind(null, i.id, !i.is_active)}>
                          <button type="submit" className="btn btn-light btn-sm">{i.is_active ? "Nonaktifkan" : "Aktifkan"}</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
