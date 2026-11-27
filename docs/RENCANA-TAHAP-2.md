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

## Keputusan yang dibutuhkan sebelum Fase B

Isi jawaban di sini (atau katakan di chat):

1. **Cara warga login** (paling menentukan).
   - **A. Email + sandi, disetujui pengurus** (direkomendasikan, tanpa layanan baru): warga mendaftar, status "menunggu", pengurus menyetujui.
   - **B. Kode undangan dari pengurus + nomor HP + sandi**: pengurus membagikan kode (via grup WhatsApp RT), warga mendaftar sendiri; otomatis terhubung ke lingkungan. Lebih mudah untuk lansia, tanpa layanan baru.
   - **C. OTP WhatsApp/SMS**: paling praktis bagi warga, tetapi butuh penyedia pihak ketiga berbayar per pesan. AGENTS.md melarang menambah layanan berbayar tanpa izin Anda.
   - Jawaban: _belum diputuskan_
2. **Data warga apa yang disimpan** (usul minimal, sesuai UU PDP): nama lengkap, nomor HP, alamat/blok dan nomor rumah, RT/RW. Opsional: jumlah anggota keluarga. **Tidak** menyimpan NIK/KK kecuali ada kebutuhan hukum yang jelas.
   - Jawaban: _belum diputuskan_
3. **Siapa boleh melihat data warga**: usul hanya pengurus dan admin; warga lain hanya melihat nama + blok bila warga setuju ("tampil di direktori warga").
   - Jawaban: _belum diputuskan_
4. **Chat**: siapa boleh membuat grup (semua warga atau hanya pengurus)? Apakah ada saluran pengumuman satu arah (hanya pengurus yang menulis)?
   - Jawaban: _belum diputuskan_
5. **Cara pesan chat tampil real-time di Vercel** (Vercel tidak mendukung koneksi WebSocket yang terus terbuka):
   - **Polling** (aplikasi bertanya tiap beberapa detik): paling sederhana, tanpa layanan baru, cukup untuk skala RT/RW.
   - **Supabase Realtime**: pesan langsung muncul; masih satu penyedia dengan database, tetapi menambah kunci dan konfigurasi baru.
   - Usul: mulai dengan polling, pindah bila perlu.
   - Jawaban: _belum diputuskan_

## Fase B: Login warga dan data warga

Skema (migrasi baru, jangan ubah migrasi lama):

- [ ] `0006_residents.sql`: profil warga per lingkungan (blok/alamat, RT/RW, persetujuan tampil di direktori, `consented_at`), status keanggotaan sudah ada di `community_members` (`pending|active|suspended`).
- [ ] Bila login metode B: tabel kode undangan (`invite_codes`: kode, lingkungan, kedaluwarsa, batas pakai, dibuat oleh).
- [ ] Perbarui `docs/DATABASE.md`.

Backend dan web:

- [ ] Halaman daftar warga (`/daftar`) dengan persetujuan penggunaan data (teks UU PDP, tautan kebijakan privasi).
- [ ] Halaman masuk warga (`/masuk`), keluar, lupa/ubah sandi. Sesi cookie terpisah dari admin atau peran dibedakan di sesi yang sama.
- [ ] Pembatasan percobaan login per akun/IP (juga memperkuat login admin).
- [ ] Halaman profil: ubah data sendiri, hapus akun (anonimkan data).
- [ ] CMS "Data warga": daftar, cari, filter status; setujui, tangguhkan, ubah peran; ekspor terbatas; catatan audit setiap akses.
- [ ] Halaman kebijakan privasi.
- [ ] Tes unit (validasi, otorisasi, pembatasan login) dan uji end-to-end.

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
3. Fase B → Fase C (web) → Fase D (mobile) → Fase E.
