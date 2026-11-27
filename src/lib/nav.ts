/** Apakah tautan [href] aktif untuk [pathname]. [exact]: cocokkan hanya path persis (untuk "/" dan "/admin"). */
export function isActivePath(pathname: string, href: string, exact?: boolean): boolean {
  if (exact || href === "/") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}
