import type { Metadata } from "next";
import AnnouncementForm from "@/components/admin/AnnouncementForm";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Tulis pengumuman" };

export default async function NewAnnouncementPage() {
  await requireAdmin();
  return (
    <>
      <div className="page-head"><h1>Tulis pengumuman</h1></div>
      <AnnouncementForm />
    </>
  );
}
