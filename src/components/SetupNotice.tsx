export default function SetupNotice({ message }: { message: string }) {
  return (
    <div className="notice">
      <strong>Database belum siap.</strong>
      <p>{message}</p>
      <p>
        Ikuti langkah di <code>docs/PANDUAN-PEMULA.md</code>: isi <code>DATABASE_URL</code> di{" "}
        <code>.env.local</code>, lalu jalankan <code>npm run db:migrate</code> dan{" "}
        <code>npm run db:seed</code>.
      </p>
    </div>
  );
}
