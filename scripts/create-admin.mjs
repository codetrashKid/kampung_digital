// Membuat atau memperbarui akun admin lingkungan (email + sandi).
// Pakai: npm run admin:create -- --email anda@contoh.com [--name "Nama"] [--phone 0812xxxx]
// Sandi ditanyakan di terminal (tidak tampil). Untuk otomatisasi: variabel ADMIN_PASSWORD.
// Tanpa --phone, akun "Admin Contoh" dari data seed (+620000000001) yang dipakai.
import postgres from "postgres";
import { hashPassword } from "./password-hash.mjs";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL belum diisi. Lihat .env.example.");
  process.exit(1);
}

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

function normalizePhone(raw) {
  const cleaned = raw.replace(/[\s().-]/g, "");
  if (!/^\+?\d+$/.test(cleaned)) return null;
  let digits = cleaned.replace(/^\+/, "");
  if (digits.startsWith("0")) digits = "62" + digits.slice(1);
  return digits.length >= 9 && digits.length <= 15 ? "+" + digits : null;
}

function askHidden(question) {
  return new Promise((resolve) => {
    process.stdout.write(question);
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let value = "";
    const onData = (ch) => {
      if (ch === "\r" || ch === "\n") {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener("data", onData);
        process.stdout.write("\n");
        resolve(value);
      } else if (ch === "\u0003") {
        process.exit(130);
      } else if (ch === "\u007f" || ch === "\b") {
        value = value.slice(0, -1);
      } else {
        value += ch;
      }
    };
    stdin.on("data", onData);
  });
}

const email = (arg("email") ?? "").trim().toLowerCase();
const name = (arg("name") ?? "Admin Lingkungan").trim();
const phone = normalizePhone(arg("phone") ?? "+620000000001");
const slug = process.env.DEFAULT_COMMUNITY_SLUG ?? "contoh-kampung";

if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error('Pakai: npm run admin:create -- --email anda@contoh.com [--name "Nama"] [--phone 0812xxxx]');
  process.exit(1);
}
if (!phone) {
  console.error("Nomor telepon tidak valid.");
  process.exit(1);
}

let password = process.env.ADMIN_PASSWORD;
if (!password) {
  if (!process.stdin.isTTY) {
    console.error("Jalankan di terminal interaktif, atau set ADMIN_PASSWORD.");
    process.exit(1);
  }
  password = await askHidden("Sandi baru (minimal 10 karakter): ");
}
if (password.length < 10) {
  console.error("Sandi minimal 10 karakter.");
  process.exit(1);
}

const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
try {
  const [community] = await sql`select id from communities where slug = ${slug} and deleted_at is null`;
  if (!community) throw new Error(`Lingkungan "${slug}" tidak ditemukan. Jalankan npm run db:seed dulu.`);

  const clash = await sql`select 1 from users where email = ${email} and phone <> ${phone}`;
  if (clash.length) throw new Error("Email itu sudah dipakai akun lain.");

  const hash = hashPassword(password);
  const [user] = await sql`
    insert into users (phone, email, full_name, password_hash, phone_verified_at)
    values (${phone}, ${email}, ${name}, ${hash}, now())
    on conflict (phone) do update
      set email = excluded.email, password_hash = excluded.password_hash, deleted_at = null
    returning id`;
  await sql`
    insert into community_members (community_id, user_id, role, status)
    values (${community.id}, ${user.id}, 'admin_lingkungan', 'active')
    on conflict (community_id, user_id) do update set role = 'admin_lingkungan', status = 'active'`;
  console.log(`Admin siap: ${email} (lingkungan ${slug}). Masuk di /admin/login`);
} catch (err) {
  console.error("Gagal:", err.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
