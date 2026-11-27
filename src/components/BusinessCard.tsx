import Link from "next/link";
import { avatarColor, initialOf } from "@/lib/format";
import type { Business } from "@/lib/queries";

export default function BusinessCard({ b }: { b: Business }) {
  return (
    <Link href={`/usaha/${b.slug}`} className="card">
      <div className="card-top">
        <span className="avatar" style={{ background: avatarColor(b.category_slug) }} aria-hidden="true">
          {initialOf(b.name)}
        </span>
        <div>
          <h3>{b.name}</h3>
          <span className="badge">{b.category_name}</span>
        </div>
      </div>
      {b.description && <p className="desc">{b.description}</p>}
      <div className="meta">
        {b.rating_count > 0 ? (
          <span className="rating">★ {b.rating_avg.toFixed(1)} <span className="muted">({b.rating_count})</span></span>
        ) : (
          <span className="rating-none">Belum ada ulasan</span>
        )}
        {b.address && <span>{b.address}</span>}
      </div>
    </Link>
  );
}
