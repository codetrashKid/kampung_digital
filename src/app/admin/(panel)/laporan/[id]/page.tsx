import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import StatusPill from "@/components/admin/StatusPill";
import { adminGetReport } from "@/lib/admin-queries";
import { requireAdmin } from "@/lib/auth";
import { whatsappUrl } from "@/lib/format";
import { REPORT_CATEGORIES, isUuid } from "@/lib/validation";
import { setReportPublicAction, setReportStatusAction } from "../../../actions";

export const metadata: Metadata = { title: "Detail laporan" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ pesan?: string }> };

const ACTIONS = [
  { status: "diproses", label: "Tandai diproses" },
  { status: "selesai", label: "Tandai selesai" },
  { status: "ditolak", label: "Tolak" },
  { status: "baru", label: "Kembalikan ke baru" },
];

export default async function ReportDetailPage({ params, searchParams }: Props) {
  const { community } = await requireAdmin();
  const { id } = await params;
  const { pesan } = await searchParams;
  if (!isUuid(id)) notFound();
  const r = await adminGetReport(community.id, id);
  if (!r) notFound();

  const wa = whatsappUrl(r.reporter_phone, `Halo, terkait laporan Anda "${r.title}" di Kampung Digital.`);
  const when = (d: Date) =>
    new Date(d).toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Jakarta" });

  return (
    <>
      <p className="crumb"><Link href="/admin/laporan">← Semua laporan</Link></p>
      <div className="page-head">
        <h1>{r.title}</h1>
        <StatusPill status={r.status} />
      </div>
      {pesan && <div className="alert alert-ok" role="status">Perubahan disimpan.</div>}

      <section className="panel">
        <dl className="detail-list">
          <div><dt>Jenis</dt><dd>{REPORT_CATEGORIES.find((c) => c.value === r.category)?.label ?? r.category}</dd></div>
          <div><dt>Uraian</dt><dd>{r.description}</dd></div>
          <div><dt>Lokasi</dt><dd>{r.location_text ?? "-"}</dd></div>
          <div><dt>Pelapor</dt><dd>{r.reporter_name ?? "Tanpa nama"}{r.reporter_phone ? ` · ${r.reporter_phone}` : ""}</dd></div>
          <div>
            <dt>Tampil di halaman publik</dt>
            <dd>
              {r.is_public
                ? "Ya. Judul, uraian, lokasi, dan status terlihat warga. Nama dan nomor pelapor tidak pernah ditampilkan."
                : "Tidak. Hanya pengurus yang melihat laporan ini."}
            </dd>
          </div>
          <div><dt>Masuk</dt><dd>{when(r.created_at)}</dd></div>
        </dl>
        <div className="row-actions">
          {ACTIONS.filter((a) => a.status !== r.status).map((a) => (
            <form key={a.status} action={setReportStatusAction.bind(null, r.id, a.status)}>
              <button type="submit" className={a.status === "ditolak" ? "btn btn-light btn-sm" : "btn btn-sm"}>{a.label}</button>
            </form>
          ))}
          <form action={setReportPublicAction.bind(null, r.id, !r.is_public)}>
            <button type="submit" className="btn btn-light btn-sm">
              {r.is_public ? "Sembunyikan dari publik" : "Tampilkan ke publik"}
            </button>
          </form>
          {wa && <a className="btn btn-wa btn-sm" href={wa} target="_blank" rel="noopener noreferrer">Hubungi pelapor</a>}
        </div>
      </section>
    </>
  );
}
