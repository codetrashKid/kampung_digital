import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AnnouncementForm from "@/components/admin/AnnouncementForm";
import { adminGetAnnouncement } from "@/lib/admin-queries";
import { requireAdmin } from "@/lib/auth";
import { isUuid } from "@/lib/validation";

export const metadata: Metadata = { title: "Ubah pengumuman" };

type Props = { params: Promise<{ id: string }> };

export default async function EditAnnouncementPage({ params }: Props) {
  const { community } = await requireAdmin();
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const item = await adminGetAnnouncement(community.id, id);
  if (!item) notFound();
  return (
    <>
      <div className="page-head"><h1>Ubah pengumuman</h1></div>
      <AnnouncementForm item={item} />
    </>
  );
}
