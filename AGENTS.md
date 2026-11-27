# AGENTS.md: Aturan untuk AI Coding Assistant

File ini adalah sumber kebenaran tentang cara bekerja di repositori ini. **Baca seluruhnya sebelum mengubah apa pun**, dan perbarui bila ada keputusan baru.

## Gambaran proyek

Kampung Digital (nama sementara): portal web + (nanti) aplikasi mobile yang menghubungkan warga dan usaha lokal dalam satu lingkungan, plus pengumuman dan agenda. **Multi-lingkungan sejak awal** agar bisa diskalakan ke seluruh Indonesia.

- Web dan API: Next.js 15 (App Router, TypeScript) di root repositori, kode di `src/`
- Mobile: Flutter, di `mobile/` (versi awal ada; `android/` dan `ios/` dibuat oleh `mobile/tool/prepare_platforms.sh`, tidak di-commit)
- Database: PostgreSQL (+ PostGIS), migrasi di `db/migrations/`
- Target hosting: **Vercel (gratis) untuk web, Neon/Supabase (gratis) untuk database**
- Detail database: `docs/DATABASE.md`. Panduan pemula: `docs/PANDUAN-PEMULA.md`

## Langkah wajib untuk SETIAP perubahan

1. **Pahami konteks**: baca `README.md`, file ini, dan `docs/DATABASE.md` bila menyentuh data.
2. **Kerjakan perubahan kecil dan terfokus**; satu tujuan per perubahan.
3. **Perbarui `CHANGELOG.md`** di bagian `[Belum dirilis]` dengan kategori yang sesuai (Ditambahkan/Diubah/Diperbaiki/Dihapus/Keamanan). Saat rilis, pindahkan ke versi bernomor beserta tanggal dan naikkan `version` di `package.json`.
4. **Perbarui `README.md`** jika fitur, cara menjalankan, struktur folder, atau teknologi berubah.
5. **Perbarui `docs/DATABASE.md`** jika skema berubah, dan tambahkan migrasi baru (lihat aturan database).
6. **Jalankan `npm run typecheck`, `npm test`, dan `npm run build`** (bila `npm run dev` sedang jalan, build dengan `NEXT_DIST_DIR=.next-check` agar folder `.next` tidak rusak) (untuk perubahan di `mobile/`: `flutter analyze` dan `flutter test`) sebelum menyatakan selesai. Jangan klaim berhasil jika belum dijalankan; jika tidak bisa dijalankan, katakan apa adanya.
7. **Pesan commit** memakai Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.

## Aturan arsitektur

- **Multi-tenant**: setiap data milik lingkungan punya `community_id`. Setiap query ke tabel ber-`community_id` **wajib** memfilternya. Dilarang menaruh nama, slug, atau konfigurasi satu lingkungan secara hardcode di kode. Lingkungan aktif saat ini dibaca dari `getCurrentCommunity()` di `src/lib/queries.ts` (env `DEFAULT_COMMUNITY_SLUG`); nanti diganti berdasarkan subdomain.
- **Satu API untuk dua klien**: web dan Flutter memakai API yang sama, berversi (`/api/v1/...`). Jangan membuat logika bisnis ganda di klien. Jangan mengubah bentuk respons API versi yang sudah ada; buat `/api/v2` bila perlu.
- **Akses database hanya lewat `src/lib/db.ts`** (`getDb()`); query diletakkan di `src/lib/queries.ts` (publik), `src/lib/admin-queries.ts` (panel admin), dan `src/lib/resident-queries.ts` (warga, kode undangan, pembatasan laju). Gunakan tagged template ``sql`...` `` dengan nilai berparameter. **Dilarang** menyusun SQL dengan penggabungan string dari input pengguna.
- **Next.js 15**: `params` dan `searchParams` adalah `Promise` (gunakan `await`). Halaman yang membaca database memakai `export const dynamic = "force-dynamic"` (atau `revalidate` yang disengaja) agar build tidak mengakses database.
- **Validasi input** di sisi server untuk semua endpoint. Jangan percaya data dari klien; batasi `limit` dan panjang input.
- **Otorisasi** dicek di server (`requireAdmin()` di setiap halaman dan server action admin; jangan mengandalkan layout saja) berdasarkan peran di `community_members` (`warga`, `penjual`, `pengurus`, `admin_lingkungan`) dan `users.platform_role`.
- **Ramah hosting gratis/serverless**: jangan menulis file ke disk server (Vercel hanya-baca), jangan mengandalkan proses yang berjalan lama atau state di memori. Foto/file disimpan di object storage; database hanya menyimpan URL.
- Aplikasi harus tetap bisa di-build dan dijalankan **tanpa** `DATABASE_URL` (menampilkan petunjuk, bukan crash).

## Aturan database

- Perubahan skema **hanya lewat migrasi baru** bernomor berurutan (`0002_...`, `0003_...`). **Jangan mengedit migrasi yang sudah ada.** Migrasi dijalankan manual lewat `npm run db:migrate`, **bukan** saat build di Vercel.
- Primary key memakai UUID. Tabel data pengguna memakai soft delete (`deleted_at`) dan kolom `created_at`/`updated_at`.
- Tambahkan indeks untuk kolom yang sering difilter atau diurutkan.
- Data contoh (`db/seed.sql`) harus fiktif dan idempoten.
- Jangan menjalankan perintah destruktif (DROP, TRUNCATE, DELETE massal) tanpa persetujuan eksplisit pemilik proyek.

## Aturan kode dan konvensi

- Bahasa antarmuka pengguna: **Bahasa Indonesia**. Nama variabel, fungsi, tabel, dan kolom: **bahasa Inggris**. Komentar dan dokumentasi: Bahasa Indonesia.
- TypeScript mode ketat; hindari `any`. Alias impor `@/` menunjuk ke `src/`.
- Utamakan solusi sederhana. Jangan menambah dependensi besar tanpa alasan yang dicatat di pesan commit.
- Aksesibilitas: pengguna mencakup lansia; teks mudah dibaca, tombol besar, alur singkat.

## Keamanan dan privasi

- **Jangan pernah** meng-commit rahasia (`.env.local`, kunci API, token, connection string). Perbarui `.env.example` (tanpa nilai asli) saat menambah variabel baru, dan dokumentasikan di README.
- Data pribadi (nama, nomor HP) dikumpulkan seminimal mungkin. Nomor WhatsApp usaha hanya ditampilkan atas persetujuan pemilik usaha.
- Hormati UU Pelindungan Data Pribadi (UU No. 27 Tahun 2022).
- Jangan menulis data pribadi asli ke log atau ke data contoh (seed).

## Yang TIDAK boleh dilakukan tanpa izin pemilik proyek

- Mengubah lisensi atau menghapus `LICENSE`.
- Mengganti stack utama (Next.js, Flutter, PostgreSQL).
- Menghapus atau menulis ulang riwayat migrasi.
- Menambah layanan berbayar atau mengirim data pengguna ke layanan pihak ketiga baru.

## Ruang lingkup saat ini

Sudah ada: login warga dengan kode undangan + data warga (Fase B), sistem rilis aplikasi dan update wajib, laporan warga (form publik + penanganan di admin), panel admin (usaha, pengumuman, agenda), beranda, direktori usaha (pencarian, kategori, detail, tombol WhatsApp), API baca, migrasi dan seed, aplikasi Flutter awal, unit test, CI GitHub Actions.
Berikutnya (Tahap 2, rencana rinci di `docs/RENCANA-TAHAP-2.md`; perbarui centangnya saat mengerjakan): chat saluran dan grup (Fase C), pendaftaran usaha oleh warga, unggah foto, edit jam buka, pembatasan percobaan login, notifikasi, pengembangan lanjut aplikasi Flutter.
Ditunda: pembayaran online, chat dalam aplikasi, iuran, surat pengantar, bank sampah.

## Catatan keputusan

Tambahkan keputusan penting di bawah ini (tanggal, keputusan, alasan singkat).

- 2026-11-27: PostgreSQL + PostGIS, satu skema multi-tenant dengan `community_id`, UUID sebagai primary key. Lihat `docs/DATABASE.md`.
- 2026-11-27: Lisensi MIT.
- 2026-11-27: Next.js di root repositori (bukan monorepo `apps/`) agar deploy Vercel sederhana; Flutter nanti di `mobile/`.
- 2026-11-27: Library database `postgres` (postgres.js) tanpa ORM dulu, supaya sederhana untuk pemula dan mudah dipindah.
- 2026-11-27: Unit test web memakai Vitest; mobile memakai `flutter test`. Folder `android/`/`ios/` dibuat CI lewat `flutter create` agar repo tetap kecil. Fitur baru wajib disertai tes.
- 2026-11-27: Login admin memakai email + sandi (scrypt `node:crypto`, sesi cookie HMAC stateless, `AUTH_SECRET`), bukan OTP, karena OTP butuh layanan SMS/WhatsApp pihak ketiga. OTP untuk warga menyusul setelah ada keputusan penyedia.
- 2026-11-27: Waktu pada form agenda dianggap WIB (UTC+7) dan ditampilkan dalam WIB; zona waktu per lingkungan belum didukung.
- 2026-11-27: Laporan warga memakai form publik tanpa login (nama/HP opsional) dengan anti-spam kolom jebakan + batas per jam berbasis hash IP, karena login warga (OTP) belum ada. Setelah OTP tersedia, pertimbangkan mewajibkan login.
- 2026-11-27: Laporan warga baru bersifat privat (`reports.is_public = false`); hanya yang disetujui pengurus tampil di `/laporan`, dan data pelapor tidak pernah ikut ke halaman publik. Alasan: form tanpa login rawan spam dan tuduhan.
- 2026-11-27: Tema visual "Jakarta" (siluet kota senja) pada hero dan login; aset di `public/jakarta-skyline.svg`, warna merek tetap hijau.
- 2026-11-27: Update wajib aplikasi: server menyimpan daftar rilis (`app_releases`, tingkat platform tanpa `community_id`, hanya `super_admin`); klien mengirim `platform` dan nomor build, server menjawab rilis aktif terbaru dan apakah ada rilis wajib di atas build klien. Klien gagal-terbuka (jika pengecekan error, aplikasi tetap jalan) dan melewati pengecekan pada build 0 (pengembangan). Nomor build = nomor run GitHub Actions. File APK tidak disimpan di server: admin mengisi tautan https unduhan.
- 2026-11-27: Update Android hanya bisa terpasang bila APK memakai kunci tanda tangan yang sama; kunci rilis tetap disuntik di CI lewat GitHub Secrets. iOS butuh TestFlight/App Store (akun Apple Developer) untuk distribusi ke pengguna.
- 2026-11-27: Login warga memakai **kode undangan dari pengurus + nomor HP + sandi** (bukan OTP; tanpa layanan pihak ketiga). Warga yang mendaftar dengan kode otomatis menjadi anggota aktif; pengurus bisa menangguhkan. Nomor HP belum diverifikasi (tidak ada OTP), jadi jangan dianggap bukti kepemilikan nomor.
- 2026-11-27: Data warga minimal (nama, nomor HP, blok/jalan, nomor rumah, RT/RW); tanpa NIK/KK. Hanya pengurus yang melihat nomor HP, dan setiap pembukaan detail dicatat di `audit_logs` (`resident.view`). Warga lain hanya (nanti) melihat nama + blok bila `show_in_directory`.
- 2026-11-27: Pembatasan percobaan login memakai tabel `auth_attempts` (hash kunci, tanpa state di server). Catatan lama belum dibersihkan otomatis; tambahkan pembersihan berkala (dengan persetujuan) bila tabel membesar.
- 2026-11-27: Hapus akun warga = anonimisasi (nama/nomor dikosongkan, profil alamat dihapus, keanggotaan ditangguhkan, `users.deleted_at` diisi); baris `users` tetap ada agar relasi lama tidak rusak. Akun `admin_lingkungan`/`super_admin` tidak bisa menghapus diri sendiri.
- 2026-11-27: Aplikasi mobile memakai API `/api/v1` yang sama dengan web (publik: home, categories, businesses, reports, app-version). Endpoint baru ditambahkan tanpa mengubah bentuk respons yang lama. Pengiriman laporan dari web dan mobile lewat satu fungsi (`submitPublicReport`) agar batas spam sama.
- 2026-11-27: Build Android di CI WAJIB memakai kunci tanda tangan tetap dari GitHub Secrets dan diverifikasi (`apksigner`); tanpa itu update tidak bisa menimpa. Kunci (`*.jks`) tidak boleh di-commit; cadangan disimpan pemilik proyek.
- 2026-11-27: Jalankan `flutter analyze` dan `flutter test` sebelum menyatakan perubahan mobile selesai; SDK bisa dipasang di folder sementara (git clone flutter, channel stable) bila belum ada.
