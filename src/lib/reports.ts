import { createHash } from "node:crypto";
import { writeAudit } from "./admin-queries";
import { countRecentReportsByIp, createReport } from "./queries";
import type { ReportInput } from "./validation";

export const MAX_REPORTS_PER_HOUR = 5;

/** Hash IP + rahasia server: cukup untuk membatasi spam tanpa menyimpan IP asli. */
export function hashIp(ip: string): string {
  return createHash("sha256").update(`${process.env.AUTH_SECRET ?? ""}|${ip}`).digest("hex");
}

/**
 * Menyimpan laporan dari form publik (web) atau aplikasi mobile, dengan batas per jam per jaringan.
 * Mengembalikan "throttled" bila jaringan itu sudah mengirim terlalu banyak laporan.
 */
export async function submitPublicReport(
  communityId: string,
  value: ReportInput,
  ip: string | null,
): Promise<"ok" | "throttled"> {
  const ipHash = ip ? hashIp(ip) : null;
  if (ipHash && (await countRecentReportsByIp(ipHash)) >= MAX_REPORTS_PER_HOUR) return "throttled";
  const id = await createReport(communityId, value, ipHash);
  await writeAudit(communityId, null, "report.create", "report", id);
  return "ok";
}
