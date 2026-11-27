import type { Metadata } from "next";
import EventForm from "@/components/admin/EventForm";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Tambah agenda" };

export default async function NewEventPage() {
  await requireAdmin();
  return (
    <>
      <div className="page-head"><h1>Tambah agenda</h1></div>
      <EventForm />
    </>
  );
}
