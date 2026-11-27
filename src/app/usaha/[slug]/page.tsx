import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SetupNotice from "@/components/SetupNotice";
import { isDbConfigured } from "@/lib/db";
import { DAY_NAMES, shortTime, whatsappUrl } from "@/lib/format";
import { getBusiness, getCurrentCommunity } from "@/lib/queries";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  const community = await getCurrentCommunity();
  if (!community) return null;
  return getBusiness(community.id, slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!isDbConfigured()) return { title: "Usaha" };
  try {
    const data = await load(slug);
    return { title: data?.business.name ?? "Usaha" };
  } catch {
    return { title: "Usaha" };
  }
}

export default async function BusinessDetailPage({ params }: Props) {
  if (!isDbConfigured()) return <SetupNotice message="Variabel DATABASE_URL belum diisi." />;
  const { slug } = await params;

  let data;
  try {
    data = await load(slug);
  } catch (err) {
    console.error(err);
    return <SetupNotice message="Tidak bisa terhubung ke database." />;
  }
  if (!data) notFound();

  const { business: b, hours } = data;
  const wa = whatsappUrl(b.phone_wa, `Halo, saya melihat ${b.name} di Kampung Digital.`);

  return (
    <article>
      <p><Link href="/usaha">← Kembali</Link></p>
      <span className="badge">{b.category_name}</span>
      <h1>{b.name}</h1>
      <p className="muted">
        {b.rating_count > 0 ? `★ ${b.rating_avg.toFixed(1)} (${b.rating_count} ulasan)` : "Belum ada ulasan"}
      </p>
      {b.description && <p>{b.description}</p>}
      {b.address && <p>📍 {b.address}</p>}
      {wa && (
        <p>
          <a className="btn" href={wa} target="_blank" rel="noopener noreferrer">
            Pesan via WhatsApp
          </a>
        </p>
      )}
      {hours.length > 0 && (
        <section>
          <h2>Jam buka</h2>
          <ul className="hours">
            {hours.map((h) => (
              <li key={h.day_of_week}>
                <span>{DAY_NAMES[h.day_of_week]}</span>
                <span>{h.is_closed ? "Tutup" : `${shortTime(h.open_time)} – ${shortTime(h.close_time)}`}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
