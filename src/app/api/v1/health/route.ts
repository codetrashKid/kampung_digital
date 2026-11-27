import { NextResponse } from "next/server";
import { getDb, isDbConfigured } from "@/lib/db";
import { describeDbError } from "@/lib/db-errors";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ status: "ok", database: "belum dikonfigurasi" });
  }
  try {
    await getDb()`select 1`;
    return NextResponse.json({ status: "ok", database: "terhubung" });
  } catch (err) {
    console.error(err);
    // Penyebab asli hanya di mode pengembangan (tidak membocorkan detail di produksi).
    const detail = process.env.NODE_ENV !== "production" ? { detail: describeDbError(err) } : {};
    return NextResponse.json({ status: "error", database: "gagal terhubung", ...detail }, { status: 503 });
  }
}
