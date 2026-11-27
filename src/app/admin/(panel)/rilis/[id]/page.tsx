import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReleaseForm from "@/components/admin/ReleaseForm";
import { adminGetRelease } from "@/lib/admin-queries";
import { requireSuperAdmin } from "@/lib/auth";
import { isUuid } from "@/lib/validation";

export const metadata: Metadata = { title: "Ubah rilis" };

type Props = { params: Promise<{ id: string }> };

export default async function EditReleasePage({ params }: Props) {
  await requireSuperAdmin();
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const release = await adminGetRelease(id);
  if (!release) notFound();
  return (
    <>
      <div className="page-head"><h1>Ubah rilis</h1></div>
      <ReleaseForm release={release} />
    </>
  );
}
