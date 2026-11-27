import type { Metadata } from "next";
import Link from "next/link";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { adminListReleases } from "@/lib/admin-queries";
import { requireSuperAdmin } from "@/lib/auth";
import { deleteReleaseAction, setReleaseActiveAction } from "../../actions";

export const metadata: Metadata = { title: "Rilis aplikasi" };

type Props = { searchParams: Promise<{ pesan?: string }> };

export default async function AdminReleasesPage({ searchParams }: Props) {
  await requireSuperAdmin();
  const { pesan } = await searchParams;
  const items = await adminListReleases();

  return (
    <>
      <div className="page-head">
        <h1>Rilis aplikasi</h1>
        <Link href="/admin/rilis/baru" className="btn">+ Rilis baru</Link>
      </div>
      <p className="muted">
        Aplikasi mobile menanyakan daftar ini setiap dibuka. Rilis <strong>wajib</strong> mengunci pengguna dengan build lebih lama sampai mereka memperbarui. Menonaktifkan rilis langsung mencabut kuncinya.
      </p>
      {pesan && <div className="alert alert-ok" role="status">{pesan === "dihapus" ? "Rilis dihapus." : "Perubahan disimpan."}</div>}

      {items.length === 0 ? (
        <p className="empty">Belum ada rilis. Selama kosong, aplikasi berjalan tanpa pengecekan update.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Platform</th><th>Versi (build)</th><th>Status</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id}>
                  <td><strong>{r.platform === "android" ? "Android" : "iOS"}</strong></td>
                  <td>
                    {r.version_name} <span className="muted small">(build {r.build_number})</span>
                    <div className="muted small">
                      {new Date(r.created_at).toLocaleDateString("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" })}
                    </div>
                  </td>
                  <td>
                    <span className={`pill ${r.is_active ? "pill-active" : "pill-archived"}`}>{r.is_active ? "Aktif" : "Nonaktif"}</span>
                    {r.is_mandatory && <span className="pill pill-wajib" style={{ marginLeft: 6 }}>Wajib</span>}
                  </td>
                  <td>
                    <div className="row-actions">
                      <Link href={`/admin/rilis/${r.id}`} className="btn btn-light btn-sm">Ubah</Link>
                      <a href={r.download_url} target="_blank" rel="noopener noreferrer" className="btn btn-light btn-sm">Uji tautan</a>
                      <form action={setReleaseActiveAction.bind(null, r.id, !r.is_active)}>
                        <button type="submit" className="btn btn-light btn-sm">{r.is_active ? "Nonaktifkan" : "Aktifkan"}</button>
                      </form>
                      <form action={deleteReleaseAction.bind(null, r.id)}>
                        <ConfirmButton message={`Hapus rilis ${r.version_name} (build ${r.build_number})?`}>Hapus</ConfirmButton>
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
