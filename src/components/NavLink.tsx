"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActivePath } from "@/lib/nav";
import Icon, { type IconName } from "./Icon";

type Props = {
  href: string;
  label: string;
  icon?: IconName;
  /** Cocokkan hanya jika path persis sama (untuk "/" dan "/admin"). */
  exact?: boolean;
  className?: string;
  onClick?: () => void;
};

/** Tautan menu yang menandai halaman aktif (aria-current + kelas `active`). */
export default function NavLink({ href, label, icon, exact, className = "", onClick }: Props) {
  const active = isActivePath(usePathname(), href, exact);
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`${className} ${active ? "active" : ""}`.trim()}
      aria-current={active ? "page" : undefined}
    >
      {icon && <Icon name={icon} />}
      <span>{label}</span>
    </Link>
  );
}
