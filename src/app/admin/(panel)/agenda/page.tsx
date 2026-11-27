import type { Metadata } from "next";
import Link from "next/link";
import ConfirmButton from "@/components/admin/ConfirmButton";
import StatusPill from "@/components/admin/StatusPill";
import { adminListEvents } from "@/lib/admin-queries";
import { requireAdmin } from "@/lib/auth";
import { formatEventTime } from "@/lib/format";
import { deleteEventAction } from "../../actions";

export const metadata: Metadata = { title: "Agenda" };

type Props = { searchParams: Promise<{ pesan?: string }> };

export default async function AdminEventsPage({ searchParams }: Props) {
  const { community } = await requireAdmin();
  const { pesan } = await searchParams;
  const items = await adminListEvents(community.id);

  return (
    <>
      <div className="page-head">
        <h1>Agenda</h1>
        <Link href="/admin/agenda/baru" className="btn">+ Tambah agenda</Link>
      </div>
      {pesan && <div className="alert alert-ok" role="status">{pesan === "dihapus" ? "Agenda dihapus." : "Perubahan disimpan."}</div>}

      {items.length === 0 ? (
        <p className="empty">Belum ada agenda.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Kegiatan</th><th>Waktu</th><th>Status</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              {items.map((e) => (
                <tr key={e.id}>
                  <td><strong>{e.title}</strong><div className="muted small">{e.location_text}</div></td>
                  <td className="small">{formatEventTime(e.starts_at)}</td>
                  <td><StatusPill status={e.status} /></td>
                  <td>
                    <div className="row-actions">
                      <Link href={`/admin/agenda/${e.id}`} className="btn btn-light btn-sm">Ubah</Link>
                      <form action={deleteEventAction.bind(null, e.id)}>
                        <ConfirmButton message={`Hapus agenda “${e.title}”?`}>Hapus</ConfirmButton>
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
