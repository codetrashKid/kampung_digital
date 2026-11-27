import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BusinessForm from "@/components/admin/BusinessForm";
import { adminGetBusiness } from "@/lib/admin-queries";
import { requireAdmin } from "@/lib/auth";
import { listCategories } from "@/lib/queries";
import { isUuid } from "@/lib/validation";

export const metadata: Metadata = { title: "Ubah usaha" };

type Props = { params: Promise<{ id: string }> };

export default async function EditBusinessPage({ params }: Props) {
  const { community } = await requireAdmin();
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const [business, categories] = await Promise.all([adminGetBusiness(community.id, id), listCategories()]);
  if (!business) notFound();
  return (
    <>
      <div className="page-head"><h1>Ubah usaha</h1></div>
      <BusinessForm categories={categories} business={business} />
    </>
  );
}
