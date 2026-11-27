import type { Metadata } from "next";
import Link from "next/link";
import StatusPill from "@/components/admin/StatusPill";
import { requireAdmin } from "@/lib/auth";
import { MEMBER_ROLE_LABEL } from "@/lib/resident";
import { adminListResidents } from "@/lib/resident-queries";

export const metadata: Metadata = { title: "Data warga" };

type Props = { searchParams: Promise<{ q?: string; status?: string }> };

const STATUSES = [
  { value: "active", label: "Aktif" },
  { value: "suspended", label: "Ditangguhkan" },
  { value: "pending", label: "Menunggu" },
];

export default async function AdminResidentsPage({ searchParams }: Props) {
  const { community } = await requireAdmin();
  const { q, status } = await searchParams;
  const active = STATUSES.some((s) => s.value === status) ? status : undefined;
  const items = await adminListResidents(community.id, { q, status: active });

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Data warga</h1>
          <p className="muted">Nomor HP hanya terlihat di halaman detail, dan setiap pembukaan dicatat.</p>
        </div>
        <Link href="/admin/undangan" className="btn">Kode undangan</Link>
      </div>

      <form className="filters" action="/admin/warga">
        <input name="q" defaultValue={q ?? ""} placeholder="Cari nama atau blok…" aria-label="Cari" />
        <select name="status" defaultValue={active ?? ""} aria-label="Status">
          <option value="">Semua status</option>
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <button className="btn btn-light btn-sm" type="submit">Terapkan</button>
      </form>

      {items.length === 0 ? (
        <p className="empty">Belum ada warga. Buat kode undangan lalu bagikan ke warga.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Nama</th><th>Alamat</th><th>Peran</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.user_id}>
                  <td>
                    <strong>{r.full_name}</strong>
                    <div className="muted small">{r.show_in_directory ? "Tampil di direktori" : "Tidak di direktori"}</div>
                  </td>
                  <td className="small">
                    {r.address_block ?? "-"}{r.house_number ? ` No. ${r.house_number}` : ""}
                    {r.rt || r.rw ? <div className="muted">RT {r.rt ?? "-"} / RW {r.rw ?? "-"}</div> : null}
                  </td>
                  <td>{MEMBER_ROLE_LABEL[r.role] ?? r.role}</td>
                  <td><StatusPill status={r.status === "active" ? "active" : r.status === "suspended" ? "archived" : "pending"} /></td>
                  <td><Link href={`/admin/warga/${r.user_id}`} className="btn btn-light btn-sm">Buka</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
