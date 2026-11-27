import { NextResponse } from "next/server";
import { getDb, isDbConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ status: "ok", database: "belum dikonfigurasi" });
  }
  try {
    await getDb()`select 1`;
    return NextResponse.json({ status: "ok", database: "terhubung" });
  } catch {
    return NextResponse.json({ status: "error", database: "gagal terhubung" }, { status: 503 });
  }
}
