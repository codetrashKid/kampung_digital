import { dbErrorHint, describeDbError } from "@/lib/db-errors";

type Props = { message: string; error?: unknown };

export default function SetupNotice({ message, error }: Props) {
  // Penyebab asli hanya ditampilkan saat pengembangan; di produksi cukup pesan umum (detail ada di log server).
  const showDetail = error !== undefined && process.env.NODE_ENV !== "production";
  const hint = showDetail ? dbErrorHint(error) : null;
  return (
    <div className="notice">
      <strong>Database belum siap.</strong>
      <p>{message}</p>
      {showDetail && (
        <p>
          <strong>Penyebab (hanya tampil di mode pengembangan):</strong> <code>{describeDbError(error)}</code>
          {hint && <><br />{hint}</>}
        </p>
      )}
      <p>
        Ikuti langkah di <code>docs/PANDUAN-PEMULA.md</code>: isi <code>DATABASE_URL</code> di{" "}
        <code>.env.local</code>, lalu jalankan <code>npm run db:migrate</code> dan{" "}
        <code>npm run db:seed</code>. Setelah mengubah <code>.env.local</code>, mulai ulang <code>npm run dev</code>.
      </p>
    </div>
  );
}
