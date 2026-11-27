# Changelog

Semua perubahan penting pada proyek ini dicatat di sini.
Format mengikuti [Keep a Changelog](https://keepachangelog.com/id-ID/1.1.0/) dan penomoran versi mengikuti [Semantic Versioning](https://semver.org/lang/id/).

Kategori: `Ditambahkan`, `Diubah`, `Diperbaiki`, `Dihapus`, `Keamanan`.

## [Belum dirilis]

### Ditambahkan
- Aplikasi mobile Flutter di `mobile/`: daftar usaha, pencarian, detail usaha, tombol WhatsApp; memakai API `/api/v1/businesses`. Alamat API diatur lewat `--dart-define=API_BASE_URL`.
- Unit test Flutter (`mobile/test/`): model, format, klien API (HTTP palsu), dan widget layar daftar/detail.
- Unit test web dengan Vitest (`tests/`): helper format, `GET /api/v1/businesses`, `GET /api/v1/health`; skrip `npm test`. Dependensi dev baru: `vitest` (runner tes ringan, tanpa konfigurasi rumit).
- GitHub Actions: `.github/workflows/mobile.yml` (analyze, test, build APK Android, build iOS tanpa signing) dan `web.yml` (typecheck, test, build).
- `mobile/tool/prepare_platforms.sh`: membuat folder `android/` dan `ios/` lewat `flutter create` serta menambah izin INTERNET.

### Diuji
- Web: `npm test` (16 tes), `npm run typecheck`, dan `npm run build` lolos.
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
