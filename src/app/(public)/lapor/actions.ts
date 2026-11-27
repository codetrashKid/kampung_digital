"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isDbConfigured } from "@/lib/db";
import { countRecentReportsByIp, createReport, getCurrentCommunity } from "@/lib/queries";
import { writeAudit } from "@/lib/admin-queries";
import { parseReport } from "@/lib/validation";
import type { FormState } from "@/app/admin/actions";

const MAX_PER_HOUR = 5;

/** Hash IP + rahasia server: cukup untuk membatasi spam tanpa menyimpan IP asli. */
function hashIp(ip: string): string {
  return createHash("sha256").update(`${process.env.AUTH_SECRET ?? ""}|${ip}`).digest("hex");
}

async function clientIp(): Promise<string | null> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip") || null;
}

export async function submitReportAction(_prev: FormState, formData: FormData): Promise<FormState> {
  // Kolom jebakan untuk bot: manusia tidak melihatnya. Pura-pura berhasil agar bot tidak belajar.
  if (String(formData.get("website") ?? "").trim() !== "") redirect("/lapor?terkirim=1");

  const parsed = parseReport(formData);
  if (!parsed.ok) return { errors: parsed.errors };
  if (!isDbConfigured()) return { errors: ["Layanan belum siap. Coba lagi nanti."] };

  try {
    const community = await getCurrentCommunity();
    if (!community) return { errors: ["Lingkungan tidak ditemukan."] };

    const ip = await clientIp();
    const ipHash = ip ? hashIp(ip) : null;
    if (ipHash && (await countRecentReportsByIp(ipHash)) >= MAX_PER_HOUR) {
      return { errors: ["Terlalu banyak laporan dari jaringan Anda. Silakan coba lagi dalam satu jam."] };
    }
    const id = await createReport(community.id, parsed.value, ipHash);
    await writeAudit(community.id, null, "report.create", "report", id);
  } catch (err) {
    console.error(err);
    return { errors: ["Terjadi kesalahan pada server. Coba lagi."] };
  }
  redirect("/lapor?terkirim=1");
}
