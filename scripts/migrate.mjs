// Menjalankan semua file di db/migrations/ yang belum pernah diterapkan.
// Pakai: npm run db:migrate  (membaca DATABASE_URL dari .env.local)
import postgres from "postgres";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL belum diisi. Salin .env.example menjadi .env.local lalu isi nilainya.");
  process.exit(1);
}

const sql = postgres(url, { max: 1, onnotice: () => {} });

try {
  await sql`create table if not exists schema_migrations (
    name text primary key,
    applied_at timestamptz not null default now()
  )`;

  const dir = path.join(process.cwd(), "db", "migrations");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
  const applied = new Set((await sql`select name from schema_migrations`).map((r) => r.name));

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`- lewati   ${file} (sudah diterapkan)`);
      continue;
    }
    const text = await readFile(path.join(dir, file), "utf8");
    await sql.begin(async (tx) => {
      await tx.unsafe(text);
      await tx`insert into schema_migrations (name) values (${file})`;
    });
    console.log(`- terapkan ${file}`);
  }
  console.log("Selesai.");
} catch (err) {
  console.error("Migrasi gagal:", err.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
