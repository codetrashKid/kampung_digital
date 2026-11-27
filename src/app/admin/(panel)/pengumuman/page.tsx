import type { Metadata } from "next";
import Link from "next/link";
import ConfirmButton from "@/components/admin/ConfirmButton";
import StatusPill from "@/components/admin/StatusPill";
import { adminListAnnouncements } from "@/lib/admin-queries";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { deleteAnnouncementAction } from "../../actions";

export const metadata: Metadata = { title: "Pengumuman" };

type Props = { searchParams: Promise<{ pesan?: string }> };

export default async function AdminAnnouncementsPage({ searchParams }: Props) {
  const { community } = await requireAdmin();
  const { pesan } = await searchParams;
  const items = await adminListAnnouncements(community.id);

  return (
    <>
      <div className="page-head">
        <h1>Pengumuman</h1>
        <Link href="/admin/pengumuman/baru" className="btn">+ Tulis pengumuman</Link>
      </div>
      {pesan && <div className="alert alert-ok" role="status">{pesan === "dihapus" ? "Pengumuman dihapus." : "Perubahan disimpan."}</div>}

      {items.length === 0 ? (
        <p className="empty">Belum ada pengumuman.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Judul</th><th>Tayang</th><th>Status</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id}>
                  <td><strong>{a.title}</strong></td>
                  <td className="muted small">{formatDate(a.published_at) || "-"}</td>
                  <td><StatusPill status={a.status} /></td>
                  <td>
                    <div className="row-actions">
                      <Link href={`/admin/pengumuman/${a.id}`} className="btn btn-light btn-sm">Ubah</Link>
                      <form action={deleteAnnouncementAction.bind(null, a.id)}>
                        <ConfirmButton message={`Hapus pengumuman “${a.title}”?`}>Hapus</ConfirmButton>
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
