# Kampung Digital

> Nama proyek bersifat sementara dan bisa diganti kapan saja.

Portal web (dan nanti aplikasi mobile) yang menghubungkan warga dengan usaha dan jasa di lingkungannya, berikut pengumuman dan agenda kegiatan. Dirancang **multi-lingkungan** sejak awal, sehingga satu sistem bisa dipakai banyak kampung, perumahan, RT/RW, bahkan seluruh Indonesia.

**Status:** 🚧 Awal pengembangan (v0.2.0): portal web dasar sudah berjalan (beranda, direktori usaha, detail usaha, API). Aplikasi Flutter versi awal (daftar dan detail usaha) ada di `mobile/`.

## Yang sudah ada

- Beranda lingkungan: profil, pengumuman, usaha terpopuler
- Direktori usaha: pencarian nama, filter kategori, detail usaha, jam buka, tombol pesan via WhatsApp
- API JSON `/api/v1/businesses`, `/api/v1/health`, dan `/api/v1/app-version` (cek versi/update wajib), dipakai aplikasi Flutter
- **Panel admin (CMS)** di `/admin`: kelola usaha, pengumuman, agenda, dan laporan warga
- **Laporan warga**: warga melapor di `/lapor` tanpa login, pengurus menindaklanjuti di panel, dan laporan yang disetujui tampil di `/laporan`
- **Sistem rilis aplikasi**: pengecekan versi, update wajib/opsional, dikelola dari panel admin
- Tema visual Jakarta (siluet kota senja dengan Monas)
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
npm run admin:create -- --email anda@contoh.com   # membuat admin (sandi ditanya)
npm run dev                     # buka http://localhost:3000, panel di /admin
```

Isi juga `AUTH_SECRET` di `.env.local` (minimal 32 karakter acak, perintah pembuatnya ada di `.env.example`); tanpa itu login admin dinonaktifkan.

Tanpa `DATABASE_URL`, aplikasi tetap berjalan dan menampilkan petunjuk pengaturan.

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Menjalankan mode pengembangan |
| `npm run build` | Build produksi (dipakai Vercel) |
| `npm run typecheck` | Memeriksa tipe TypeScript |
| `NEXT_DIST_DIR=.next-check npm run build` | Build tanpa bentrok dengan `npm run dev` yang sedang jalan (Windows PowerShell: `$env:NEXT_DIST_DIR='.next-check'; npm run build`) |
| `npm test` | Menjalankan unit test web (Vitest) |
| `npm run admin:create -- --email ...` | Membuat/mengatur sandi admin lingkungan |
| `npm run db:migrate` | Menerapkan migrasi di `db/migrations/` |
| `npm run db:seed` | Mengisi data contoh dari `db/seed.sql` |

## Struktur repositori

```
.
├── src/
│   ├── app/            # Halaman dan API (routing berbasis folder)
│   │   ├── (public)/           # Beranda, direktori dan detail usaha
│   │   ├── admin/              # Panel admin (login + CMS)
│   │   └── api/v1/             # API JSON
│   ├── components/     # Komponen UI bersama
│   └── lib/            # db.ts, queries.ts, admin-queries.ts, auth/session/password, validation, format
├── db/
│   ├── migrations/     # Migrasi SQL berurutan (0001_init.sql, ...)
│   └── seed.sql        # Data contoh
├── public/             # Aset statis (jakarta-skyline.svg)
├── scripts/            # migrate.mjs, seed.mjs, create-admin.mjs
├── docs/               # DATABASE.md, PANDUAN-PEMULA.md
├── mobile/             # Aplikasi Flutter (lib/, test/, tool/)
├── tests/              # Unit test web (Vitest)
├── .github/workflows/  # CI: web.yml dan mobile.yml
├── AGENTS.md           # Aturan kerja untuk AI coding assistant
├── CLAUDE.md           # Penunjuk ke AGENTS.md untuk Claude Code
├── CHANGELOG.md        # Catatan setiap perubahan
└── LICENSE
```

## Rilis aplikasi dan update wajib

Aplikasi mobile menanyakan server setiap dibuka (`GET /api/v1/app-version?platform=android&build=12`).
- Ada rilis **wajib** yang lebih baru: layar aplikasi terkunci sampai pengguna menekan "Perbarui sekarang" (membuka tautan unduhan).
- Ada rilis **opsional**: muncul dialog "Pembaruan tersedia" yang bisa ditutup.
- Server tidak terjangkau atau error: aplikasi **tetap jalan** (supaya server mati tidak mengunci semua orang). Build pengembangan (`flutter run` biasa, build 0) tidak diperiksa.

**Cara menerbitkan versi baru (hanya `super_admin`):**
1. Ubah `version:` di `mobile/pubspec.yaml` bila perlu (mis. `0.2.0+1`), lalu `git push`. CI membangun aplikasi dengan **nomor build = nomor run GitHub Actions** (selalu naik). Nomor itu ada di nama artefak (`kampung-digital-apk-build-N`) dan di ringkasan job.
2. Unduh artefak APK, lalu unggah ke tempat unduhan yang berupa tautan **https** langsung ke file (paling mudah: buat **Release** di GitHub repositori ini dan lampirkan APK).
3. Buka **Panel Admin > Rilis aplikasi > Rilis baru**: pilih platform, isi versi, nomor build (sama dengan N di atas), tautan unduhan, dan catatan rilis. Centang **Update wajib** bila versi lama harus dikunci. Klik **Uji tautan** di daftar untuk memastikan unduhan berjalan **sebelum** mewajibkan.
4. Salah mewajibkan? Klik **Nonaktifkan** pada rilis itu; kunci langsung dicabut (hingga 1 menit karena cache).

**iOS:** file `.zip` hasil CI belum ditandatangani sehingga tidak bisa dipasang di iPhone. Untuk pengguna, build harus ditandatangani dan didistribusikan lewat TestFlight atau App Store (perlu akun Apple Developer berbayar, belum disiapkan). Tautan TestFlight/App Store itulah yang diisikan sebagai tautan unduhan rilis iOS.

### Kunci tanda tangan Android (wajib agar update bisa terpasang)
Android hanya mau memperbarui aplikasi bila APK baru ditandatangani **kunci yang sama** dengan yang terpasang. Tanpa secret di bawah, CI memakai kunci debug acak yang berbeda di tiap build, sehingga update gagal ("aplikasi tidak terpasang"). Buat kunci **sekali saja** dan simpan cadangannya dengan aman (jika hilang, pengguna harus mencopot-pasang aplikasi):

```bash
keytool -genkey -v -keystore release.jks -alias kampung -keyalg RSA -keysize 2048 -validity 10000
# PowerShell: [Convert]::ToBase64String([IO.File]::ReadAllBytes("release.jks")) | Set-Clipboard
# macOS/Linux: base64 -w0 release.jks
```
Di GitHub: Settings > Secrets and variables > Actions > **Secrets**, tambahkan `ANDROID_KEYSTORE_BASE64` (isi base64 tadi), `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` (`kampung`), dan `ANDROID_KEY_PASSWORD`. **Jangan commit `release.jks`.** Memasang APK dari tautan di luar Play Store juga mengharuskan pengguna mengizinkan "pasang aplikasi dari sumber tidak dikenal".

## Panel admin (CMS)

Buka `/admin` (tautan "Masuk pengurus" ada di footer). Yang bisa dikelola: **usaha** (tambah, ubah, tayangkan atau sembunyikan, hapus), **pengumuman**, **agenda**, dan **laporan warga** (lihat dan ubah status). Hanya `super_admin` platform, atau `admin_lingkungan`/`pengurus` aktif di lingkungan ini, yang bisa masuk. Penghapusan bersifat lembut (data tidak hilang dari database).

- Sandi disimpan sebagai hash scrypt; sesi memakai cookie HttpOnly bertanda tangan. Di Vercel, isi `AUTH_SECRET` di Environment Variables.
- Laporan warga masuk lewat `/lapor` tanpa login. Nama dan nomor HP pelapor opsional dan hanya terlihat pengurus; ada kolom jebakan bot dan batas 5 laporan per jam per jaringan.
- Laporan baru **tidak otomatis tampil publik**: pengurus menyetujuinya lewat tombol "Tampilkan ke publik" (mencegah spam dan tuduhan). Nama dan nomor pelapor tidak pernah ditampilkan.
- Menu **Rilis aplikasi** (khusus `super_admin`) mengelola versi aplikasi mobile dan update wajib (lihat bagian di atas).
- Belum ada: tanggapan pengurus, foto laporan, unggah foto, edit jam buka, pembatasan percobaan login per IP, dan login OTP untuk warga (tahap berikutnya).

## Aplikasi mobile (Flutter)

Butuh [Flutter SDK](https://docs.flutter.dev/get-started/install) (channel stable, minimal 3.47 karena memakai paket `material_ui`). Folder `android/` dan `ios/` tidak disimpan di git; dibuat oleh skrip:

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

1. Buat database gratis (Neon atau Supabase), jalankan `npm run db:migrate` (dan `npm run admin:create`) dari komputer Anda dengan `DATABASE_URL` database tersebut.
2. Push repositori ke GitHub, lalu impor di Vercel (Framework otomatis terdeteksi Next.js, Root Directory dibiarkan `./`).
3. Isi **Environment Variables** di Vercel (Settings > Environment Variables, centang Production dan Preview):

| Variabel | Nilai |
|---|---|
| `DATABASE_URL` | Connection string database. Supabase: **Transaction pooler** (port **6543**, bukan 5432 yang cepat penuh), sandi di-URL-encode |
| `DEFAULT_COMMUNITY_SLUG` | Slug lingkungan, mis. `contoh-kampung` |
| `AUTH_SECRET` | Kunci acak minimal 32 karakter, **buat yang baru untuk produksi** (jangan pakai milik lokal) |

4. Klik Deploy. `vercel.json` sudah mengatur region fungsi ke Tokyo (`hnd1`) agar dekat dengan database Supabase di `ap-northeast-1`; ubah bila database Anda di region lain.
5. Setelah dapat alamat `https://nama-proyek.vercel.app`, isi variabel repositori GitHub **`API_BASE_URL`** dengan alamat itu (tanpa `/api/v1`) agar build aplikasi mobile menunjuk ke sana. Cek dulu `https://nama-proyek.vercel.app/api/v1/health`.

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
