import Link from "next/link";

export default function NotFound() {
  return (
    <div className="hero">
      <h1>Halaman tidak ditemukan</h1>
      <p>Alamat yang Anda buka tidak ada atau sudah dipindahkan.</p>
      <Link href="/" className="btn">Ke beranda</Link>
    </div>
  );
}
