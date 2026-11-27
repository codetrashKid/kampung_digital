# Panduan Pemula: Menjalankan dan Men-deploy Kampung Digital

Panduan ini untuk Anda yang belum pernah memakai Next.js. Ikuti berurutan.

## 1. Apa itu Next.js, singkatnya

Next.js adalah framework untuk membuat situs web dengan React. Yang perlu dipahami di awal:

- **Folder = alamat halaman.** File `src/app/page.tsx` adalah beranda (`/`). File `src/app/usaha/page.tsx` adalah halaman `/usaha`. File `src/app/usaha/[slug]/page.tsx` adalah `/usaha/apa-saja`, dengan `slug` berubah-ubah.
- **`page.tsx` = halaman, `route.ts` = API.** File `src/app/api/v1/businesses/route.ts` melayani `/api/v1/businesses` dan mengembalikan JSON.
- **`layout.tsx` = bingkai bersama** (header dan footer) yang membungkus semua halaman.
- Halaman di sini adalah *server component*: kodenya jalan di server, boleh langsung membaca database, lalu mengirim HTML jadi ke browser.

## 2. Menjalankan di komputer sendiri

### a. Pasang alat
- **Node.js** versi 20.6 atau lebih baru dari [nodejs.org](https://nodejs.org) (pilih versi LTS).
- **Git** (untuk mengunggah ke GitHub).
- Editor kode, misalnya VS Code.

### b. Buat database gratis
Pilih salah satu (keduanya punya paket gratis; cek ketentuan terbaru):

**Neon** ([neon.tech](https://neon.tech))
1. Daftar, lalu buat *Project* baru.
2. Di dashboard, salin **Connection string** (bentuknya `postgresql://pengguna:sandi@host/namadb?sslmode=require`). Pilih versi *pooled* bila ada.

**Supabase** ([supabase.com](https://supabase.com))
1. Daftar, buat *Project* baru dan simpan sandi database.
2. Buka **Connect** lalu salin connection string mode *Transaction pooler*, dan ganti `[YOUR-PASSWORD]` dengan sandi Anda.

### c. Pasang dan jalankan
Buka terminal di folder proyek ini, lalu:

```bash
npm install
cp .env.example .env.local
```

Buka `.env.local`, tempel connection string ke `DATABASE_URL=`. Lalu:

```bash
npm run db:migrate    # membuat semua tabel
npm run db:seed       # mengisi data contoh
npm run dev           # menjalankan situs
```

Buka **http://localhost:3000**. Setiap kali Anda menyimpan perubahan file, halaman otomatis ter-refresh.

Cek juga **http://localhost:3000/api/v1/health**: jika berisi `"database":"terhubung"`, koneksi berhasil.

## 3. Men-deploy gratis ke Vercel

1. Buat repositori di GitHub dan unggah proyek ini (`git init`, `git add .`, `git commit`, `git push`). Pastikan `.env.local` **tidak** ikut terunggah (sudah dicegah oleh `.gitignore`).
2. Daftar di [vercel.com](https://vercel.com) memakai akun GitHub.
3. Klik **Add New → Project**, pilih repositori ini, biarkan pengaturan bawaan (Next.js terdeteksi otomatis).
4. Buka **Environment Variables** dan tambahkan tiga variabel ini (centang Production dan Preview):
   - `DATABASE_URL`: connection string database (Supabase: Transaction pooler, port 6543; sandi dengan karakter khusus harus di-URL-encode, mis. `%` menjadi `%25`).
   - `DEFAULT_COMMUNITY_SLUG`: mis. `contoh-kampung`.
   - `AUTH_SECRET`: kunci acak baru minimal 32 karakter (buat dengan `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`). Tanpa ini halaman login admin menampilkan peringatan.
5. Klik **Deploy**. Setelah selesai Anda mendapat alamat seperti `nama-proyek.vercel.app`. Cek `https://nama-proyek.vercel.app/api/v1/health`; isinya harus `"database":"terhubung"`.
6. Untuk aplikasi mobile, isi variabel repositori GitHub `API_BASE_URL` dengan alamat itu (lihat README, bagian Aplikasi mobile).

Setiap kali Anda `git push` ke cabang utama, Vercel otomatis men-deploy ulang.

> **Migrasi database tidak berjalan otomatis di Vercel.** Jalankan `npm run db:migrate` dari komputer Anda (dengan `DATABASE_URL` database yang sama) setiap ada file migrasi baru, sebelum deploy versi kode yang membutuhkannya.

> Paket gratis Vercel umumnya diperuntukkan penggunaan non-komersial. Jika kelak aplikasi menghasilkan uang, baca ketentuan terbarunya.

## 4. Mengganti data contoh dengan data lingkungan Anda

Untuk saat ini, ubah lewat SQL (panel admin menyusul di Tahap 2):

1. Buka SQL editor di dashboard Neon/Supabase.
2. Ubah nama dan deskripsi lingkungan:
   ```sql
   UPDATE communities SET name = 'Nama Lingkungan Anda', description = 'Deskripsi singkat'
   WHERE slug = 'contoh-kampung';
   ```
3. Tambah atau ubah usaha di tabel `businesses` mengikuti pola di `db/seed.sql`.

## 4b. Masuk ke panel admin

1. Buat kunci rahasia dan tempel ke `AUTH_SECRET=` di `.env.local`:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. Buat akun admin (sandi akan ditanya dan tidak tampil saat diketik, minimal 10 karakter):
   ```bash
   npm run admin:create -- --email anda@contoh.com --name "Nama Anda"
   ```
3. Jalankan `npm run dev`, buka `http://localhost:3000/admin`, lalu masuk. Di sana Anda bisa menambah usaha, pengumuman, dan agenda tanpa menulis SQL.

## 5. Masalah umum

| Gejala | Penyebab dan solusi |
|---|---|
| Halaman menampilkan "Database belum siap" (di mode `npm run dev` penyebab aslinya tampil di kotak peringatan) | `DATABASE_URL` belum diisi, atau migrasi/seed belum dijalankan |
| `extension "postgis" is not available` saat migrasi | Penyedia database tidak mendukung PostGIS. Aktifkan lewat dashboard (Supabase: Database → Extensions) atau gunakan penyedia yang mendukung |
| Login admin: "AUTH_SECRET belum diisi" | Isi `AUTH_SECRET` (minimal 32 karakter) di `.env.local`, lalu mulai ulang `npm run dev` |
| `EMAXCONNSESSION max clients reached in session mode` atau "Database belum siap" padahal `DATABASE_URL` benar | Supabase Session pooler (port 5432) hanya mengizinkan 15 koneksi dan cepat penuh (server dev, Vercel). Ganti port di `DATABASE_URL` menjadi **6543** (Transaction pooler), lalu **mulai ulang `npm run dev`** (koneksi lama tersimpan di memori proses dan tidak ikut berganti saat `.env.local` diubah) / Redeploy di Vercel |
| `password authentication failed` | Sandi atau connection string salah |
| `node: --env-file is not allowed` / opsi tidak dikenal | Versi Node terlalu lama; pakai Node 20.6+ |
| Di Vercel halaman error 500 | Periksa Environment Variables di Vercel dan lihat log di tab **Logs** |
| Perubahan tidak muncul di Vercel | Pastikan sudah `git push`, dan cek status deployment |

## 6. Langkah belajar berikutnya

1. Ubah teks di `src/app/page.tsx` dan lihat hasilnya di browser.
2. Ubah warna di `src/app/globals.css` (variabel `--brand`).
3. Tambah kategori baru di `db/seed.sql`, jalankan `npm run db:seed`.
4. Baca [AGENTS.md](../AGENTS.md) bila memakai AI coding assistant, agar ia mengikuti aturan proyek.
