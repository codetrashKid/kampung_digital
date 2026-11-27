import type { Metadata } from "next";
import ReleaseForm from "@/components/admin/ReleaseForm";
import { requireSuperAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Rilis baru" };

export default async function NewReleasePage() {
  await requireSuperAdmin();
  return (
    <>
      <div className="page-head"><h1>Rilis baru</h1></div>
      <ReleaseForm />
    </>
  );
}
