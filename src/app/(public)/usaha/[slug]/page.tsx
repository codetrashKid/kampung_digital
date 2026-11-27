import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SetupNotice from "@/components/SetupNotice";
import { isDbConfigured } from "@/lib/db";
import { DAY_NAMES, avatarColor, initialOf, shortTime, whatsappUrl } from "@/lib/format";
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
  // Hari ini menurut waktu WIB, untuk menebalkan baris jam buka.
  const today = new Date(Date.now() + 7 * 3600_000).getUTCDay();

  return (
    <article>
      <p className="crumb"><Link href="/usaha">← Semua usaha</Link></p>
      <div className="detail">
        <section className="panel">
          <div className="detail-head">
            <span className="avatar avatar-lg" style={{ background: avatarColor(b.category_slug) }} aria-hidden="true">
              {initialOf(b.name)}
            </span>
            <div>
              <span className="badge">{b.category_name}</span>
              <h1>{b.name}</h1>
              <span className="rating">
                {b.rating_count > 0 ? (
                  <>★ {b.rating_avg.toFixed(1)} <span className="muted">({b.rating_count} ulasan)</span></>
                ) : (
                  <span className="rating-none">Belum ada ulasan</span>
                )}
              </span>
            </div>
          </div>
          {b.description && <p>{b.description}</p>}
          {b.address && <p className="info-row"><span aria-hidden="true">📍</span><span>{b.address}</span></p>}
          {wa && (
            <p>
              <a className="btn btn-wa" href={wa} target="_blank" rel="noopener noreferrer">
                Pesan via WhatsApp
              </a>
            </p>
          )}
        </section>

        {hours.length > 0 && (
          <aside className="panel">
            <h2>Jam buka</h2>
            <ul className="hours">
              {hours.map((h) => (
                <li key={h.day_of_week} className={h.day_of_week === today ? "today" : undefined}>
                  <span>{DAY_NAMES[h.day_of_week]}{h.day_of_week === today ? " (hari ini)" : ""}</span>
                  <span>{h.is_closed ? "Tutup" : `${shortTime(h.open_time)} – ${shortTime(h.close_time)}`}</span>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </article>
  );
}
