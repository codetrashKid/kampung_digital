"use server";

import { redirect } from "next/navigation";
import { isDbConfigured } from "@/lib/db";
import { getCurrentCommunity } from "@/lib/queries";
import { submitPublicReport } from "@/lib/reports";
import { clientIp } from "@/lib/request";
import { parseReport } from "@/lib/validation";
import type { FormState } from "@/app/admin/actions";

export async function submitReportAction(_prev: FormState, formData: FormData): Promise<FormState> {
  // Kolom jebakan untuk bot: manusia tidak melihatnya. Pura-pura berhasil agar bot tidak belajar.
  if (String(formData.get("website") ?? "").trim() !== "") redirect("/lapor?terkirim=1");

  const parsed = parseReport(formData);
  if (!parsed.ok) return { errors: parsed.errors };
  if (!isDbConfigured()) return { errors: ["Layanan belum siap. Coba lagi nanti."] };

  try {
    const community = await getCurrentCommunity();
    if (!community) return { errors: ["Lingkungan tidak ditemukan."] };
    const result = await submitPublicReport(community.id, parsed.value, await clientIp());
    if (result === "throttled") {
      return { errors: ["Terlalu banyak laporan dari jaringan Anda. Silakan coba lagi dalam satu jam."] };
    }
  } catch (err) {
    console.error(err);
    return { errors: ["Terjadi kesalahan pada server. Coba lagi."] };
  }
  redirect("/lapor?terkirim=1");
}
