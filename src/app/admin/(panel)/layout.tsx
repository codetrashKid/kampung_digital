import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";
import { logoutAction } from "../actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { default: "Panel Pengurus", template: "%s · Panel Pengurus" }, robots: { index: false, follow: false } };

const ROLE_LABEL = { super_admin: "Super admin", admin_lingkungan: "Admin lingkungan", pengurus: "Pengurus" } as const;

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { user, community, role } = await requireAdmin();
  return (
    <AdminShell
      userName={user.full_name}
      roleLabel={ROLE_LABEL[role]}
      communityName={community.name}
      isSuperAdmin={role === "super_admin"}
      logoutAction={logoutAction}
    >
      {children}
    </AdminShell>
  );
}
