import Link from "next/link";
import type { Business } from "@/lib/queries";

export default function BusinessCard({ b }: { b: Business }) {
  return (
    <Link href={`/usaha/${b.slug}`} className="card">
      <span className="badge">{b.category_name}</span>
      <h3>{b.name}</h3>
      {b.description && <p className="muted clamp">{b.description}</p>}
      <p className="muted small">
        {b.rating_count > 0 ? `★ ${b.rating_avg.toFixed(1)} (${b.rating_count} ulasan)` : "Belum ada ulasan"}
      </p>
    </Link>
  );
}
