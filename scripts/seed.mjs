// Mengisi data contoh dari db/seed.sql (aman dijalankan berulang kali).
// Pakai: npm run db:seed
import postgres from "postgres";
import { readFile } from "node:fs/promises";
import path from "node:path";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL belum diisi. Salin .env.example menjadi .env.local lalu isi nilainya.");
  process.exit(1);
}

const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {} });

try {
  const text = await readFile(path.join(process.cwd(), "db", "seed.sql"), "utf8");
  await sql.begin(async (tx) => {
    await tx.unsafe(text);
  });
  console.log("Data contoh berhasil dimasukkan.");
} catch (err) {
  console.error("Seed gagal:", err.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
