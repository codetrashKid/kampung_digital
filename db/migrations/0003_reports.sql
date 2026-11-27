-- Laporan warga (jalan rusak, lampu mati, sampah, dll.). Dikirim lewat form publik tanpa login.
CREATE TYPE report_status AS ENUM ('baru', 'diproses', 'selesai', 'ditolak');

CREATE TABLE reports (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id   uuid NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  category       text NOT NULL CHECK (category IN ('infrastruktur', 'kebersihan', 'keamanan', 'lainnya')),
  title          text NOT NULL,
  description    text NOT NULL,
  location_text  text,
  reporter_name  text,                 -- opsional (data pribadi: kumpulkan seminimal mungkin)
  reporter_phone text,                 -- opsional, hanya terlihat oleh pengurus
  ip_hash        text,                 -- hash IP + rahasia, hanya untuk pembatasan spam; bukan IP asli
  status         report_status NOT NULL DEFAULT 'baru',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  deleted_at     timestamptz
);
CREATE INDEX idx_reports_community_status ON reports(community_id, status, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_reports_ip_time ON reports(ip_hash, created_at DESC) WHERE ip_hash IS NOT NULL;
CREATE TRIGGER trg_reports_updated BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
