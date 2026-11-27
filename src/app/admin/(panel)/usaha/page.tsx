import type { Metadata } from "next";
import Link from "next/link";
import ConfirmButton from "@/components/admin/ConfirmButton";
import StatusPill from "@/components/admin/StatusPill";
import { adminListBusinesses } from "@/lib/admin-queries";
import { requireAdmin } from "@/lib/auth";
import { deleteBusinessAction, setBusinessStatusAction } from "../../actions";

export const metadata: Metadata = { title: "Usaha & Jasa" };

type Props = { searchParams: Promise<{ q?: string; status?: string; pesan?: string }> };

const STATUS_FILTERS = ["active", "draft", "archived"];

export default async function AdminBusinessesPage({ searchParams }: Props) {
  const { community } = await requireAdmin();
  const { q, status, pesan } = await searchParams;
  const items = await adminListBusinesses(community.id, {
    q,
    status: status && STATUS_FILTERS.includes(status) ? status : undefined,
  });

  return (
    <>
      <div className="page-head">
        <h1>Usaha &amp; Jasa</h1>
        <Link href="/admin/usaha/baru" className="btn">+ Tambah usaha</Link>
      </div>
      {pesan && <div className="alert alert-ok" role="status">{pesan === "dihapus" ? "Usaha dihapus." : "Perubahan disimpan."}</div>}

      <form className="filters" action="/admin/usaha">
        <input name="q" defaultValue={q ?? ""} placeholder="Cari nama usaha…" aria-label="Cari" />
        <select name="status" defaultValue={status ?? ""} aria-label="Status">
          <option value="">Semua status</option>
          <option value="active">Tayang</option>
          <option value="draft">Draf</option>
          <option value="archived">Diarsipkan</option>
        </select>
        <button className="btn btn-light btn-sm" type="submit">Terapkan</button>
      </form>

      {items.length === 0 ? (
        <p className="empty">Belum ada usaha. Klik “Tambah usaha” untuk memulai.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Nama</th><th>Kategori</th><th>Status</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              {items.map((b) => (
                <tr key={b.id}>
                  <td><strong>{b.name}</strong><div className="muted small">{b.address}</div></td>
                  <td>{b.category_name}</td>
                  <td><StatusPill status={b.status} /></td>
                  <td>
                    <div className="row-actions">
                      <Link href={`/admin/usaha/${b.id}`} className="btn btn-light btn-sm">Ubah</Link>
                      {b.status === "active" ? (
                        <form action={setBusinessStatusAction.bind(null, b.id, "draft")}>
                          <button type="submit" className="btn btn-light btn-sm">Sembunyikan</button>
                        </form>
                      ) : (
                        <form action={setBusinessStatusAction.bind(null, b.id, "active")}>
                          <button type="submit" className="btn btn-sm">Tayangkan</button>
                        </form>
                      )}
                      <form action={deleteBusinessAction.bind(null, b.id)}>
                        <ConfirmButton message={`Hapus usaha “${b.name}”?`}>Hapus</ConfirmButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
