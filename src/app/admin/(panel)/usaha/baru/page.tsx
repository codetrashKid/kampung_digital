import type { Metadata } from "next";
import BusinessForm from "@/components/admin/BusinessForm";
import { requireAdmin } from "@/lib/auth";
import { listCategories } from "@/lib/queries";

export const metadata: Metadata = { title: "Tambah usaha" };

export default async function NewBusinessPage() {
  await requireAdmin();
  const categories = await listCategories();
  return (
    <>
      <div className="page-head"><h1>Tambah usaha</h1></div>
      <BusinessForm categories={categories} />
    </>
  );
}
