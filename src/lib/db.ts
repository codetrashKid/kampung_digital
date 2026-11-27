import postgres from "postgres";

type Sql = ReturnType<typeof postgres>;
const globalForDb = globalThis as unknown as { __sql?: Sql };

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/** Satu-satunya pintu akses database. Jangan membuat koneksi di tempat lain. */
export function getDb(): Sql {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL belum diatur. Lihat .env.example");
  if (!globalForDb.__sql) {
    globalForDb.__sql = postgres(url, {
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false, // aman untuk connection pooler (Neon/Supabase)
    });
  }
  return globalForDb.__sql;
}
