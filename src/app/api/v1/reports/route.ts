import { NextResponse, type NextRequest } from "next/server";
import { withCommunity } from "@/lib/api";
import { countPublicReportsByStatus, listPublicReports } from "@/lib/queries";
import { submitPublicReport } from "@/lib/reports";
import { clientIp } from "@/lib/request";
import { REPORT_CATEGORIES, parseReport } from "@/lib/validation";

export const dynamic = "force-dynamic";

const PUBLIC_STATUSES = ["baru", "diproses", "selesai"];
const MAX_BODY_BYTES = 10_000;

/** GET /api/v1/reports?status=&jenis=: laporan yang disetujui pengurus (tanpa data pelapor). */
export const GET = withCommunity(async (community, req) => {
  const params = req.nextUrl.searchParams;
  const status = params.get("status") ?? undefined;
  const jenis = params.get("jenis") ?? undefined;
  const [data, counts] = await Promise.all([
    listPublicReports(community.id, {
      status: status && PUBLIC_STATUSES.includes(status) ? status : undefined,
      category: jenis && REPORT_CATEGORIES.some((c) => c.value === jenis) ? jenis : undefined,
    }),
    countPublicReportsByStatus(community.id),
  ]);
  return NextResponse.json(
    { data, counts },
    { headers: { "Cache-Control": "public, max-age=0, s-maxage=15, stale-while-revalidate=30" } },
  );
});

/**
 * POST /api/v1/reports (JSON): kirim laporan tanpa login. Nama dan nomor HP opsional.
 * Batas 5 laporan per jam per jaringan. Laporan baru tidak tampil publik sebelum disetujui pengurus.
 */
export const POST = withCommunity(async (community, req: NextRequest) => {
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return NextResponse.json({ error: "Data terlalu besar" }, { status: 413 });
  let body: Record<string, unknown>;
  try {
    const parsedBody: unknown = JSON.parse(raw);
    if (!parsedBody || typeof parsedBody !== "object" || Array.isArray(parsedBody)) throw new Error("bukan objek");
    body = parsedBody as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Isi permintaan harus berupa JSON" }, { status: 400 });
  }

  // Kolom jebakan bot (sama seperti form web): pura-pura berhasil.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const parsed = parseReport({ get: (name) => (typeof body[name] === "string" ? (body[name] as string) : null) });
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.errors[0], errors: parsed.errors }, { status: 400 });
  }
  const result = await submitPublicReport(community.id, parsed.value, await clientIp());
  if (result === "throttled") {
    return NextResponse.json({ error: "Terlalu banyak laporan dari jaringan Anda. Coba lagi dalam satu jam." }, { status: 429 });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
});
