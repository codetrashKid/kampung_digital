import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { writeAudit } from "@/lib/admin-queries";
import { requireAdmin } from "@/lib/auth";
import { MEMBER_ROLES, MEMBER_ROLE_LABEL, canChangeRoles, canManageMember } from "@/lib/resident";
import { adminGetResident } from "@/lib/resident-queries";
import { isUuid } from "@/lib/validation";
import { setMemberRoleAction, setMemberStatusAction } from "../../../actions";

export const metadata: Metadata = { title: "Detail warga" };

type Props = { params: Promise<{ userId: string }>; searchParams: Promise<{ pesan?: string }> };

const when = (d: Date | null) =>
  d ? new Date(d).toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Jakarta" }) : "-";

export default async function ResidentDetailPage({ params, searchParams }: Props) {
  const { user, community, role } = await requireAdmin();
  const { userId } = await params;
  const { pesan } = await searchParams;
  if (!isUuid(userId)) notFound();
  const r = await adminGetResident(community.id, userId);
  if (!r) notFound();

  // Setiap pembukaan data pribadi warga dicatat (akuntabilitas, UU PDP).
  await writeAudit(community.id, user.id, "resident.view", "user", r.user_id);

  const manageable = canManageMember({ id: user.id, role }, { id: r.user_id, role: r.role, platform_role: r.platform_role });
  const suspended = r.status === "suspended";

  return (
    <>
      <p className="crumb"><Link href="/admin/warga">← Semua warga</Link></p>
      <div className="page-head">
        <h1>{r.full_name}</h1>
        <span className={`pill ${r.status === "active" ? "pill-active" : "pill-archived"}`}>
          {r.status === "active" ? "Aktif" : r.status === "suspended" ? "Ditangguhkan" : "Menunggu"}
        </span>
      </div>
      {pesan === "tersimpan" && <div className="alert alert-ok" role="status">Perubahan disimpan.</div>}
      {pesan === "ditolak" && <div className="alert alert-error" role="alert">Anda tidak berwenang mengubah akun ini.</div>}

      <section className="panel">
        <dl className="detail-list">
          <div><dt>Nomor HP</dt><dd>{r.phone}</dd></div>
          <div>
            <dt>Alamat</dt>
            <dd>
              {r.address_block ?? "-"}{r.house_number ? ` No. ${r.house_number}` : ""}
              {r.rt || r.rw ? `\nRT ${r.rt ?? "-"} / RW ${r.rw ?? "-"}` : ""}
            </dd>
          </div>
          <div><dt>Peran</dt><dd>{MEMBER_ROLE_LABEL[r.role] ?? r.role}</dd></div>
          <div><dt>Tampil di direktori warga</dt><dd>{r.show_in_directory ? "Ya (atas persetujuan warga)" : "Tidak"}</dd></div>
          <div><dt>Persetujuan data</dt><dd>{when(r.consented_at)}</dd></div>
          <div><dt>Bergabung</dt><dd>{when(r.joined_at)}</dd></div>
          <div><dt>Terakhir masuk</dt><dd>{when(r.last_login_at)}</dd></div>
        </dl>

        {manageable ? (
          <div className="row-actions" style={{ alignItems: "center" }}>
            <form action={setMemberStatusAction.bind(null, r.user_id, suspended ? "active" : "suspended")}>
              <button type="submit" className={suspended ? "btn btn-sm" : "btn btn-light btn-sm"}>
                {suspended ? "Aktifkan kembali" : "Tangguhkan akun"}
              </button>
            </form>
            {canChangeRoles(role) && (
              <form action={setMemberRoleAction.bind(null, r.user_id)} className="row-actions" style={{ alignItems: "center" }}>
                <select name="role" defaultValue={r.role} aria-label="Peran" className="filters-select">
                  {MEMBER_ROLES.map((m) => <option key={m} value={m}>{MEMBER_ROLE_LABEL[m]}</option>)}
                </select>
                <button type="submit" className="btn btn-light btn-sm">Simpan peran</button>
              </form>
            )}
          </div>
        ) : (
          <p className="muted small">Anda tidak dapat mengubah status atau peran akun ini (akun sendiri, atau peran lebih tinggi).</p>
        )}
      </section>
    </>
  );
}
