import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Kebijakan Privasi" };

export default function PrivacyPage() {
  return (
    <div className="narrow prose">
      <h1>Kebijakan Privasi</h1>
      <p className="muted small">
        Draf awal untuk pengurus lingkungan. Sesuaikan nama penyelenggara dan kontak, dan sebaiknya ditinjau oleh pihak yang
        paham hukum sebelum dipakai warga sungguhan. Dasar acuan: UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi.
      </p>

      <h2>Data yang kami kumpulkan</h2>
      <ul>
        <li><strong>Saat mendaftar:</strong> nama lengkap, nomor HP, sandi (disimpan dalam bentuk acak/hash, bukan teks asli), serta alamat (blok/jalan, nomor rumah, RT, RW).</li>
        <li><strong>Saat melapor tanpa akun:</strong> uraian laporan; nama dan nomor HP bersifat opsional.</li>
        <li><strong>Teknis:</strong> catatan aktivitas pengurus di panel, dan penanda keamanan (hash, bukan IP asli) untuk membatasi percobaan masuk dan spam.</li>
      </ul>
      <p>Kami <strong>tidak</strong> meminta NIK, nomor KK, atau dokumen identitas.</p>

      <h2>Untuk apa data dipakai</h2>
      <ul>
        <li>Mengelola keanggotaan warga dan layanan lingkungan (laporan, pengumuman, agenda, dan fitur komunikasi warga).</li>
        <li>Menghubungi Anda terkait laporan atau layanan bila Anda mengisi nomor HP.</li>
        <li>Menjaga keamanan layanan.</li>
      </ul>

      <h2>Siapa yang dapat melihat data Anda</h2>
      <ul>
        <li><strong>Pengurus lingkungan</strong> yang berwenang dapat melihat data pendaftaran Anda. Pembukaan data per warga oleh pengurus dicatat.</li>
        <li><strong>Warga lain</strong> hanya melihat nama dan blok Anda bila Anda memilih tampil di direktori warga. Pilihan ini bisa diubah kapan saja.</li>
        <li>Nomor HP dan sandi Anda tidak ditampilkan ke warga lain. Data tidak dijual atau dibagikan ke pihak ketiga untuk iklan.</li>
      </ul>

      <h2>Hak Anda</h2>
      <ul>
        <li><strong>Melihat dan memperbaiki</strong> data alamat Anda di halaman <Link href="/akun">Akun saya</Link>.</li>
        <li><strong>Menghapus akun</strong> kapan saja di halaman Akun saya. Nama dan nomor HP dikosongkan dan data alamat dihapus.</li>
        <li><strong>Menarik persetujuan</strong> dengan menghapus akun, atau meminta bantuan pengurus.</li>
      </ul>

      <h2>Penyimpanan dan keamanan</h2>
      <p>
        Data disimpan pada basis data terkelola. Sandi di-hash, sesi masuk memakai cookie aman, dan akses pengurus dibatasi menurut peran.
        Tidak ada sistem yang sepenuhnya kebal; bila terjadi insiden yang berdampak pada data Anda, pengurus akan memberi tahu warga.
      </p>

      <h2>Kontak</h2>
      <p>Pertanyaan atau permintaan terkait data pribadi: hubungi pengurus lingkungan Anda.</p>

      <p><Link href="/daftar">Kembali ke pendaftaran</Link></p>
    </div>
  );
}
