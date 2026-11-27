import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EventForm from "@/components/admin/EventForm";
import { adminGetEvent } from "@/lib/admin-queries";
import { requireAdmin } from "@/lib/auth";
import { isUuid } from "@/lib/validation";

export const metadata: Metadata = { title: "Ubah agenda" };

type Props = { params: Promise<{ id: string }> };

export default async function EditEventPage({ params }: Props) {
  const { community } = await requireAdmin();
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const item = await adminGetEvent(community.id, id);
  if (!item) notFound();
  return (
    <>
      <div className="page-head"><h1>Ubah agenda</h1></div>
      <EventForm item={item} />
    </>
  );
}
