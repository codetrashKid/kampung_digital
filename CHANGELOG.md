# Changelog

Semua perubahan penting pada proyek ini dicatat di sini.
Format mengikuti [Keep a Changelog](https://keepachangelog.com/id-ID/1.1.0/) dan penomoran versi mengikuti [Semantic Versioning](https://semver.org/lang/id/).

Kategori: `Ditambahkan`, `Diubah`, `Diperbaiki`, `Dihapus`, `Keamanan`.

## [Belum dirilis]

### Ditambahkan
- **Halaman publik daftar laporan** `/laporan`: kartu laporan dengan filter status dan jenis; beranda menampilkan 3 laporan terbaru. Hanya laporan yang **disetujui pengurus** (tombol "Tampilkan ke publik" di detail laporan) dan tidak ditolak yang tampil; nama dan nomor pelapor tidak pernah dimuat ke halaman publik.
- Migrasi `0004_reports_public.sql`: kolom `reports.is_public` (bawaan tidak publik).
- **Tema Jakarta**: langit senja dengan siluet kota (Monas, Wisma 46, gedung-gedung) di hero beranda dan halaman login, serta garis siluet tipis di atas footer (`public/jakarta-skyline.svg`).
- **Laporan warga**: halaman publik `/lapor` (tanpa login; nama dan nomor HP opsional) dan menu "Laporan warga" di panel admin (daftar dengan filter status, detail, ubah status Baru/Diproses/Selesai/Ditolak, tombol hubungi pelapor via WhatsApp, tile "Laporan baru" di ringkasan).
- Migrasi `0003_reports.sql`: tabel `reports` dan tipe `report_status`.
- Anti-spam laporan: kolom jebakan bot dan batas 5 laporan per jam per jaringan (disimpan sebagai hash IP + rahasia server, bukan IP asli).
- `NEXT_DIST_DIR` (opsional) agar `next build` tidak bentrok dengan `next dev`: `NEXT_DIST_DIR=.next-check npm run build`.
- **Panel admin (CMS)** di `/admin`: login email + sandi, ringkasan, kelola usaha (tambah, ubah, tayangkan/sembunyikan, hapus), pengumuman, dan agenda. Semua aksi dicatat di `audit_logs`.
- Migrasi `0002_admin_auth.sql`: kolom `users.password_hash` (scrypt dari `node:crypto`, tanpa dependensi baru).
- Skrip `npm run admin:create` untuk membuat admin pertama (sandi diketik tersembunyi di terminal).
- Sesi login stateless (cookie HttpOnly bertanda tangan HMAC, 7 hari) dengan variabel baru `AUTH_SECRET`; otorisasi dicek ulang ke database di setiap halaman dan aksi.
- Agenda tampil di beranda; kategori dengan jumlah usaha; favicon.
- Unit test baru: sandi, sesi, validasi, otorisasi, format (total 62 tes web).

### Diubah
- Mobile: impor `package:flutter/material.dart` diganti `package:material_ui/material_ui.dart` (paket `material_ui ^1.11.1` ditambahkan) karena `material.dart` dinyatakan deprecated di Flutter 3.50 dan membuat `flutter analyze` gagal di CI. SDK minimum mobile naik ke Dart 3.13 (Flutter 3.47+). Belum diverifikasi: Flutter tidak terpasang di mesin ini, jadi hasilnya baru terlihat di CI.
- Tampilan portal didesain ulang: header, hero dengan pencarian, kategori, kartu usaha dengan avatar, kotak tanggal agenda, halaman detail dua kolom, jam buka menandai hari ini, ukuran teks dan tombol lebih besar.
- Halaman publik dipindah ke route group `src/app/(public)/` agar panel admin punya kerangka tampilan sendiri (URL tidak berubah).
- Pesan validasi membedakan "wajib diisi" dan "minimal N karakter".
- Seed: menambah 3 agenda contoh (relatif terhadap hari ini).
- Form admin memulihkan isian (kecuali sandi) setelah error validasi.

### Keamanan
- Login memverifikasi hash walau akun tidak ada (menyamarkan waktu respons) dan menunda 0,5 detik saat gagal. Belum ada pembatasan percobaan per IP; tambahkan sebelum dipakai publik.
- Daftar laporan publik diuji di Chrome: laporan belum disetujui/ditolak tidak tampil, data pelapor tidak bocor di HTML, filter dan parameter ngawur aman, setujui/sembunyikan di admin berefek ke halaman publik.
- Laporan warga: data pelapor minimal dan opsional, hanya terlihat pengurus; alur lapor dan ubah status diuji end-to-end di Chrome terhadap Supabase, termasuk kolom jebakan dan batas kiriman.
- Nomor WhatsApp divalidasi dan dinormalkan; semua input admin divalidasi di server.
- Aplikasi mobile Flutter di `mobile/`: daftar usaha, pencarian, detail usaha, tombol WhatsApp; memakai API `/api/v1/businesses`. Alamat API diatur lewat `--dart-define=API_BASE_URL`.
- Unit test Flutter (`mobile/test/`): model, format, klien API (HTTP palsu), dan widget layar daftar/detail.
- Unit test web dengan Vitest (`tests/`): helper format, `GET /api/v1/businesses`, `GET /api/v1/health`; skrip `npm test`. Dependensi dev baru: `vitest` (runner tes ringan, tanpa konfigurasi rumit).
- GitHub Actions: `.github/workflows/mobile.yml` (analyze, test, build APK Android, build iOS tanpa signing) dan `web.yml` (typecheck, test, build).
- `mobile/tool/prepare_platforms.sh`: membuat folder `android/` dan `ios/` lewat `flutter create` serta menambah izin INTERNET.

### Diuji
- Web: `npm test` (62 tes), `npm run typecheck`, dan `npm run build` lolos.
- Alur panel admin diuji end-to-end di Chrome (Playwright, skrip di luar repo) terhadap database Supabase: akses tanpa login dialihkan, login salah/benar, tambah/ubah validasi/sembunyikan/hapus usaha, pengumuman, agenda, tampil di portal publik, dan keluar.
- Flutter **belum dijalankan secara lokal** (SDK Flutter tidak terpasang di mesin ini); analyze, test, dan build mobile baru akan diverifikasi saat workflow GitHub Actions pertama berjalan.

## [0.2.0] - 2026-11-27

### Ditambahkan
- Proyek Next.js 15 (App Router, TypeScript) siap deploy ke Vercel.
- Halaman: beranda, direktori usaha (pencarian + filter kategori), detail usaha (jam buka, tombol WhatsApp), halaman 404.
- API: `GET /api/v1/businesses` dan `GET /api/v1/health`.
- Lapisan database `src/lib/db.ts` dan `src/lib/queries.ts` (query berparameter).
- Skrip `npm run db:migrate` (pelacak migrasi lewat tabel `schema_migrations`) dan `npm run db:seed`.
- Data contoh `db/seed.sql` (semua fiktif, aman dijalankan berulang).
- Panduan pemula `docs/PANDUAN-PEMULA.md`.

### Diubah
- Struktur repositori: aplikasi web dipindah ke root (bukan `apps/web/`) agar mudah dideploy ke Vercel; Flutter direncanakan di `mobile/`.
- `README.md`, `AGENTS.md`, dan `docs/DATABASE.md` diperbarui sesuai struktur dan hosting baru.

### Diuji
- Migrasi dan seed pada PostgreSQL 16 + PostGIS (dijalankan dua kali, idempoten); `npm run typecheck` dan `npm run build` lolos; halaman, pencarian, filter, API, 404, dan mode tanpa database sudah dicoba.

## [0.1.0] - 2026-11-27

### Ditambahkan
- Dokumentasi awal: `README.md`, `AGENTS.md`, `CLAUDE.md`, `CHANGELOG.md`, `LICENSE` (MIT).
- Skema database awal `db/migrations/0001_init.sql`: wilayah, lingkungan, pengguna, keanggotaan, kategori, usaha, jam buka, foto, ulasan, pengumuman, agenda, favorit, token perangkat, dan audit log.
- Dokumen rancangan database `docs/DATABASE.md` beserta ERD.
