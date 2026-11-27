# Rencana Tahap 2: Login Warga, Data Warga, dan Chat

Dokumen ini adalah **daftar langkah** agar pekerjaan besar bisa dicicil tanpa lupa. Centang (`[x]`) saat selesai dan perbarui bila ada keputusan baru. Aturan kerja tetap di [AGENTS.md](../AGENTS.md).

Status per 27 November 2026.

## Gambaran

Tiga fitur baru yang saling bergantung:

```
Fase B  Login warga + data warga   (fondasi: tanpa ini tidak ada identitas)
   |
Fase C  Chat: saluran lingkungan + grup warga
   |
Fase D  Aplikasi mobile (login, chat, profil, notifikasi)
```

**Warga wajib login** untuk chat dan data warga. Portal publik (beranda, usaha, laporan, agenda) tetap terbuka tanpa login.

## Fase A: Redesain tampilan  (SELESAI 27 Nov 2026)

- [x] Rencana ini ditulis.
- [x] Sistem desain baru (font Plus Jakarta Sans, warna, bayangan, ikon SVG) untuk portal publik dan CMS.
- [x] Portal publik: header aktif-menu, navigasi bawah di ponsel, tombol aksi cepat, kartu lebih rapi.
- [x] CMS: sidebar berikon + laci menu ponsel, ringkasan dengan kartu statistik, "perlu perhatian", aksi cepat, dan linimasa; tabel dan form lebih nyaman.
- [x] Diuji di desktop dan ponsel (tangkapan layar), tes (87) dan build lolos.
- [ ] (Opsional, belum) mode gelap, halaman detail laporan publik, ilustrasi untuk keadaan kosong.

## Keputusan (dicatat)

Isi jawaban di sini (atau katakan di chat):

1. **Cara warga login** (paling menentukan).
   - **A. Email + sandi, disetujui pengurus** (direkomendasikan, tanpa layanan baru): warga mendaftar, status "menunggu", pengurus menyetujui.
   - **B. Kode undangan dari pengurus + nomor HP + sandi**: pengurus membagikan kode (via grup WhatsApp RT), warga mendaftar sendiri; otomatis terhubung ke lingkungan. Lebih mudah untuk lansia, tanpa layanan baru.
   - **C. OTP WhatsApp/SMS**: paling praktis bagi warga, tetapi butuh penyedia pihak ketiga berbayar per pesan. AGENTS.md melarang menambah layanan berbayar tanpa izin Anda.
   - **Jawaban: B (kode undangan + nomor HP + sandi), diputuskan 27 Nov 2026.**
2. **Data warga apa yang disimpan** (usul minimal, sesuai UU PDP): nama lengkap, nomor HP, alamat/blok dan nomor rumah, RT/RW. Opsional: jumlah anggota keluarga. **Tidak** menyimpan NIK/KK kecuali ada kebutuhan hukum yang jelas.
   - Jawaban: _belum dijawab; dipakai usulan awal (nama, nomor HP, alamat/blok, RT/RW; tanpa NIK/KK)._
3. **Siapa boleh melihat data warga**: usul hanya pengurus dan admin; warga lain hanya melihat nama + blok bila warga setuju ("tampil di direktori warga").
   - Jawaban: _belum dijawab; dipakai usulan awal (hanya pengurus; warga lain lihat nama + blok bila setuju)._
4. **Chat**: siapa boleh membuat grup (semua warga atau hanya pengurus)? Apakah ada saluran pengumuman satu arah (hanya pengurus yang menulis)?
   - Jawaban: _belum dijawab; diputuskan saat Fase C dimulai._
5. **Cara pesan chat tampil real-time di Vercel** (Vercel tidak mendukung koneksi WebSocket yang terus terbuka):
   - **Polling** (aplikasi bertanya tiap beberapa detik): paling sederhana, tanpa layanan baru, cukup untuk skala RT/RW.
   - **Supabase Realtime**: pesan langsung muncul; masih satu penyedia dengan database, tetapi menambah kunci dan konfigurasi baru.
   - Usul: mulai dengan polling, pindah bila perlu.
   - Jawaban: _belum dijawab; diputuskan saat Fase C dimulai._

## Fase B: Login warga dan data warga  (INTI SELESAI 27 Nov 2026)

Skema (migrasi baru, jangan ubah migrasi lama):

- [x] `0006_residents.sql`: tabel `residents` (blok/alamat, RT/RW, persetujuan tampil di direktori, `consented_at`); status keanggotaan memakai `community_members` yang sudah ada.
- [x] Tabel `invite_codes` (kode 8 karakter, batas pakai, kedaluwarsa, aktif/nonaktif) dan `auth_attempts` (pembatasan laju).
- [x] `docs/DATABASE.md` diperbarui.

Backend dan web:

- [x] Halaman `/daftar` dengan kode undangan dan persetujuan penggunaan data (tautan kebijakan privasi).
- [x] Halaman `/masuk`, keluar, dan ganti sandi di `/akun`. Satu cookie sesi; peran dicek di server pada setiap halaman.
- [ ] **Lupa sandi**: saat ini warga diminta menghubungi pengurus. Tambahkan fitur "atur ulang sandi oleh pengurus" (sandi sementara) di CMS.
- [x] Pembatasan percobaan login per akun dan per IP (warga dan admin) serta tebak kode undangan per IP.
- [x] Halaman `/akun`: ubah data sendiri, ganti sandi, hapus akun (anonimisasi, konfirmasi sandi).
- [x] CMS "Data warga" (daftar, cari, filter, detail, tangguhkan/aktifkan, ubah peran sesuai hak) dan "Kode undangan" (buat, salin kode/tautan, nonaktifkan); pembukaan detail warga dicatat (`resident.view`).
- [ ] Ekspor data warga terbatas (belum).
- [ ] Halaman **direktori warga** (hanya untuk warga login; menampilkan nama + blok bagi yang setuju). Kolom `show_in_directory` sudah ada, halamannya belum.
- [x] Halaman `/privasi` (draf; perlu ditinjau pihak yang paham hukum sebelum dipakai warga sungguhan).
- [x] Tes unit (validasi, kode undangan, hak kelola, pembatasan laju; total 112) dan uji end-to-end di Chrome terhadap Supabase.

## Fase C: Chat

Skema:

- [ ] `0007_chat.sql`: `chat_channels` (jenis `saluran`|`grup`, nama, `community_id`, hanya-pengurus-yang-menulis), `chat_members` (peran, terakhir dibaca), `chat_messages` (isi teks, pengirim, `deleted_at`).
- [ ] Indeks `(channel_id, created_at)`; semua query memfilter `community_id`.

Fitur:

- [ ] API `/api/v1/chat/...`: daftar kanal saya, pesan (paginasi), kirim, tandai dibaca. Semua cek keanggotaan di server.
- [ ] Saluran lingkungan otomatis (mis. "Pengumuman RT", "Obrolan Warga"); warga aktif otomatis masuk.
- [ ] Grup: buat, tambah/keluarkan anggota, keluar grup.
- [ ] Antarmuka web: daftar percakapan + jendela chat, polling (atau Realtime sesuai keputusan 5).
- [ ] Moderasi: hapus pesan oleh pengurus, laporkan pesan, bisukan/tangguhkan anggota.
- [ ] Anti-spam: batas pesan per menit, panjang pesan, bersihkan teks.
- [ ] Kebijakan retensi (hapus pesan lama) dan penegasan: pengurus tidak membaca grup privat.
- [ ] Tes unit dan uji end-to-end.
- [ ] Ditunda: lampiran foto (butuh object storage), pesan suara, panggilan.

## Fase D: Aplikasi mobile
- [x] Bagian publik (27 Nov 2026): Beranda, Usaha (kategori, jam buka), Laporan warga, form Lapor, update wajib. Diuji dengan `flutter analyze` dan `flutter test` (39 tes).

- [ ] Layar daftar/masuk, penyimpanan token aman (`flutter_secure_storage`).
- [ ] Daftar percakapan dan layar chat.
- [ ] Profil dan direktori warga.
- [ ] Notifikasi push (Firebase Cloud Messaging adalah layanan Google = pihak ketiga baru, **butuh izin Anda**).
- [ ] API versi `/api/v1` tetap kompatibel; fitur baru memakai endpoint baru. Rilis lewat sistem update wajib yang sudah ada.

## Fase E: Keamanan dan kepatuhan (sebelum dibuka ke warga sungguhan)

- [ ] Ulas UU PDP: dasar pemrosesan, hak warga (akses, koreksi, hapus), pemberitahuan insiden.
- [ ] Pembatasan percobaan login dan laju permintaan di semua endpoint tulis.
- [ ] Cadangan database terjadwal (Supabase) dan uji pemulihan.
- [ ] Proyek database produksi terpisah dari pengembangan.
- [ ] Domain sendiri + HTTPS, kunci tanda tangan Android tetap (lihat README), akun Apple Developer bila iOS.
- [ ] Ulasan keamanan menyeluruh (`/security-review`).

## Urutan pengerjaan yang disarankan

1. Fase A (tampilan) → bisa dimulai sekarang.
2. Jawab 5 keputusan di atas.
3. Fase B (inti selesai; sisa: lupa sandi oleh pengurus, direktori warga, ekspor) → Fase C (web) → Fase D (mobile) → Fase E.
