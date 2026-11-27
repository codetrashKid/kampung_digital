# Kampung Digital

> Nama proyek bersifat sementara dan bisa diganti kapan saja.

Portal web (dan nanti aplikasi mobile) yang menghubungkan warga dengan usaha dan jasa di lingkungannya, berikut pengumuman dan agenda kegiatan. Dirancang **multi-lingkungan** sejak awal, sehingga satu sistem bisa dipakai banyak kampung, perumahan, RT/RW, bahkan seluruh Indonesia.

**Status:** 🚧 Awal pengembangan (v0.2.0): portal web dasar sudah berjalan (beranda, direktori usaha, detail usaha, API). Aplikasi Flutter versi awal (daftar dan detail usaha) ada di `mobile/`.

## Yang sudah ada

- Beranda lingkungan: profil, pengumuman, usaha terpopuler
- Direktori usaha: pencarian nama, filter kategori, detail usaha, jam buka, tombol pesan via WhatsApp
- API JSON `/api/v1/businesses` dan `/api/v1/health` (akan dipakai aplikasi Flutter)
- Aplikasi mobile Flutter (Android dan iOS): cari usaha, lihat detail, pesan via WhatsApp
- Unit test web (Vitest) dan mobile (flutter test), dijalankan otomatis di GitHub Actions
- Skema database multi-lingkungan (PostgreSQL + PostGIS) beserta migrasi dan data contoh

## Teknologi

| Bagian | Teknologi |
|---|---|
| Web dan API | Next.js 15 (App Router) + TypeScript |
| Database | PostgreSQL (+ PostGIS), diakses dengan library `postgres` |
| Hosting web | Vercel (gratis) |
| Hosting database | Neon atau Supabase (gratis), terpisah dari web |
| Mobile | Flutter, di folder `mobile/` |
| Tes dan CI | Vitest, flutter test, GitHub Actions |

## Mulai cepat

Butuh Node.js 20.6 atau lebih baru dan sebuah database PostgreSQL. **Panduan langkah demi langkah untuk pemula ada di [docs/PANDUAN-PEMULA.md](docs/PANDUAN-PEMULA.md).**

```bash
npm install
cp .env.example .env.local      # lalu isi DATABASE_URL
npm run db:migrate              # membuat tabel
npm run db:seed                 # mengisi data contoh
npm run dev                     # buka http://localhost:3000
```

Tanpa `DATABASE_URL`, aplikasi tetap berjalan dan menampilkan petunjuk pengaturan.

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Menjalankan mode pengembangan |
| `npm run build` | Build produksi (dipakai Vercel) |
| `npm run typecheck` | Memeriksa tipe TypeScript |
| `npm test` | Menjalankan unit test web (Vitest) |
| `npm run db:migrate` | Menerapkan migrasi di `db/migrations/` |
| `npm run db:seed` | Mengisi data contoh dari `db/seed.sql` |

## Struktur repositori

```
.
├── src/
│   ├── app/            # Halaman dan API (routing berbasis folder)
│   │   ├── page.tsx            # Beranda
│   │   ├── usaha/              # Direktori dan detail usaha
│   │   └── api/v1/             # API JSON
│   ├── components/     # Komponen UI bersama
│   └── lib/            # db.ts (koneksi), queries.ts (query), format.ts
├── db/
│   ├── migrations/     # Migrasi SQL berurutan (0001_init.sql, ...)
│   └── seed.sql        # Data contoh
├── scripts/            # migrate.mjs, seed.mjs
├── docs/               # DATABASE.md, PANDUAN-PEMULA.md
├── mobile/             # Aplikasi Flutter (lib/, test/, tool/)
├── tests/              # Unit test web (Vitest)
├── .github/workflows/  # CI: web.yml dan mobile.yml
├── AGENTS.md           # Aturan kerja untuk AI coding assistant
├── CLAUDE.md           # Penunjuk ke AGENTS.md untuk Claude Code
├── CHANGELOG.md        # Catatan setiap perubahan
└── LICENSE
```

## Aplikasi mobile (Flutter)

Butuh [Flutter SDK](https://docs.flutter.dev/get-started/install) (channel stable). Folder `android/` dan `ios/` tidak disimpan di git; dibuat oleh skrip:

```bash
cd mobile
bash tool/prepare_platforms.sh   # sekali saja: membuat android/ dan ios/
flutter pub get
flutter test                     # unit test
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000   # emulator Android -> web lokal
```

- Alamat API diatur lewat `API_BASE_URL` (bawaan `http://10.0.2.2:3000`). Untuk build rilis, isi variabel repositori GitHub `API_BASE_URL` (Settings > Secrets and variables > Actions > Variables) dengan alamat Vercel Anda.
- **GitHub Actions** (`.github/workflows/mobile.yml`): setiap perubahan di `mobile/` menjalankan analyze + test, lalu membangun APK Android (di Linux) dan iOS (di macOS). Hasilnya diunduh dari tab *Actions > Artifacts*.
- APK rilis masih ditandatangani kunci debug dan build iOS memakai `--no-codesign`. Untuk Play Store / App Store perlu keystore dan sertifikat Apple Developer (belum disiapkan).

## Deploy gratis

1. Buat database gratis (Neon atau Supabase), jalankan `npm run db:migrate` dari komputer Anda dengan `DATABASE_URL` database tersebut.
2. Push repositori ke GitHub, lalu impor di Vercel.
3. Isi Environment Variables `DATABASE_URL` dan `DEFAULT_COMMUNITY_SLUG`, lalu Deploy.

Rinciannya ada di [docs/PANDUAN-PEMULA.md](docs/PANDUAN-PEMULA.md). Cek ketentuan terbaru masing-masing layanan, karena paket gratis punya batas dan syarat penggunaan.

## Database

Keputusan, ERD, dan aturan ada di [docs/DATABASE.md](docs/DATABASE.md).

## Roadmap

1. **Tahap 1**: satu lingkungan, portal profil dan direktori usaha (sedang berjalan).
2. **Tahap 2**: login OTP, pendaftaran usaha oleh warga, panel admin, pengumuman dan agenda, notifikasi, aplikasi Flutter.
3. **Tahap 3**: iuran digital, surat pengantar online, bank sampah.
4. **Tahap 4**: replikasi ke banyak lingkungan (subdomain per kampung).

## Kontribusi

Kontribusi sangat disambut. Sebelum membuat perubahan:

1. Baca [AGENTS.md](AGENTS.md); aturannya berlaku untuk manusia maupun AI.
2. Gunakan pesan commit gaya [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, dst.).
3. Catat perubahan di [CHANGELOG.md](CHANGELOG.md) dan perbarui README jika perlu.

## Privasi

Aplikasi ini menyimpan data pribadi (nama, nomor HP). Kumpulkan seminimal mungkin, minta persetujuan sebelum menampilkan nomor ke publik, dan patuhi UU Pelindungan Data Pribadi (UU No. 27 Tahun 2022).

## Lisensi

[MIT](LICENSE)
