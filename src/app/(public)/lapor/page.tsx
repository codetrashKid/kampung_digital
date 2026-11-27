import type { Metadata } from "next";
import Link from "next/link";
import ActionForm from "@/components/admin/ActionForm";
import { SelectField, TextArea, TextField } from "@/components/admin/Fields";
import { REPORT_CATEGORIES } from "@/lib/validation";
import { submitReportAction } from "./actions";

export const metadata: Metadata = { title: "Lapor ke Pengurus" };

type Props = { searchParams: Promise<{ terkirim?: string }> };

export default async function ReportPage({ searchParams }: Props) {
  const { terkirim } = await searchParams;

  return (
    <div className="narrow">
      <h1>Lapor ke Pengurus</h1>
      <p className="muted">
        Ada jalan rusak, lampu mati, sampah menumpuk, atau hal lain di lingkungan? Tulis di sini, pengurus akan menindaklanjuti.
      </p>

      {terkirim ? (
        <div className="alert alert-ok" role="status">
          <strong>Terima kasih, laporan Anda sudah terkirim.</strong>
          <p>Pengurus akan memeriksanya; laporan baru tampil di halaman publik setelah disetujui pengurus. Bila Anda mengisi nomor HP, pengurus dapat menghubungi Anda.</p>
          <p><Link href="/lapor">Kirim laporan lain</Link> · <Link href="/laporan">Lihat laporan warga</Link> · <Link href="/">Beranda</Link></p>
        </div>
      ) : (
        <ActionForm action={submitReportAction} cancelHref="/" submitLabel="Kirim laporan">
          <SelectField name="category" label="Jenis laporan" required options={REPORT_CATEGORIES.map((c) => ({ ...c }))} />
          <TextField name="title" label="Judul singkat" required maxLength={120} placeholder="Contoh: Lampu jalan mati di Gang Melati" />
          <TextArea name="description" label="Ceritakan masalahnya" required maxLength={2000} hint="Apa yang terjadi, sejak kapan, dan seberapa mengganggu." />
          <TextField name="location_text" label="Lokasi" maxLength={200} placeholder="Contoh: depan rumah No. 5, Gang Melati" />
          <div className="field-row">
            <TextField name="reporter_name" label="Nama (boleh dikosongkan)" maxLength={80} />
            <TextField name="reporter_phone" label="Nomor HP (boleh dikosongkan)" type="tel" placeholder="0812-3456-7890" />
          </div>
          <p className="muted small">
            Nama dan nomor HP hanya bisa dilihat pengurus, dipakai untuk menindaklanjuti laporan, dan tidak ditampilkan ke publik.
          </p>
          {/* Kolom jebakan bot: disembunyikan dari manusia dan pembaca layar. */}
          <div className="hp" aria-hidden="true">
            <label htmlFor="website">Jangan diisi</label>
            <input id="website" name="website" tabIndex={-1} autoComplete="off" />
          </div>
        </ActionForm>
      )}
    </div>
  );
}
