-- =====================================================================
-- Kampung Digital — Migrasi 0001: skema awal
-- Target: PostgreSQL 15+ dengan ekstensi PostGIS
-- Prinsip: multi-lingkungan (multi-tenant) lewat kolom community_id,
--          hierarki wilayah nasional, UUID sebagai primary key,
--          soft delete (deleted_at), geografi lewat PostGIS.
-- JANGAN edit file ini setelah dipakai di lingkungan mana pun;
-- buat migrasi baru (0002_..., 0003_...) untuk setiap perubahan.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS postgis;    -- tipe geography & indeks spasial
CREATE EXTENSION IF NOT EXISTS pg_trgm;    -- pencarian nama yang toleran typo
CREATE EXTENSION IF NOT EXISTS citext;     -- email tidak peka huruf besar/kecil

-- ---------- Tipe enum ----------
CREATE TYPE region_level   AS ENUM ('provinsi','kabupaten_kota','kecamatan','kelurahan_desa','rw','rt');
CREATE TYPE platform_role  AS ENUM ('user','super_admin');
CREATE TYPE member_role    AS ENUM ('warga','penjual','pengurus','admin_lingkungan');
CREATE TYPE member_status  AS ENUM ('pending','active','suspended');
CREATE TYPE publish_status AS ENUM ('draft','pending','active','rejected','archived');
CREATE TYPE device_platform AS ENUM ('android','ios','web');

-- ---------- Fungsi pembantu ----------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------- Wilayah administratif (hierarki nasional) ----------
CREATE TABLE regions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id  uuid REFERENCES regions(id) ON DELETE RESTRICT,
  level      region_level NOT NULL,
  code       text,                      -- kode wilayah resmi (Kemendagri), bila ada
  name       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parent_id, level, name)
);
CREATE INDEX idx_regions_parent ON regions(parent_id);
CREATE UNIQUE INDEX uq_regions_code ON regions(code) WHERE code IS NOT NULL;
CREATE TRIGGER trg_regions_updated BEFORE UPDATE ON regions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------- Lingkungan / komunitas (unit tenant) ----------
CREATE TABLE communities (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id   uuid REFERENCES regions(id) ON DELETE SET NULL,
  name        text NOT NULL,
  slug        text NOT NULL UNIQUE,     -- dipakai untuk subdomain / URL
  description text,
  logo_url    text,
  cover_url   text,
  center      geography(Point, 4326),
  boundary    geography(Polygon, 4326),
  settings    jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz
);
CREATE INDEX idx_communities_region ON communities(region_id);
CREATE INDEX idx_communities_center ON communities USING gist(center);
CREATE TRIGGER trg_communities_updated BEFORE UPDATE ON communities
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------- Pengguna (global, satu akun bisa di banyak lingkungan) ----------
CREATE TABLE users (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone             text NOT NULL UNIQUE,   -- format E.164, mis. +62812xxxx
  email             citext UNIQUE,
  full_name         text NOT NULL,
  avatar_url        text,
  platform_role     platform_role NOT NULL DEFAULT 'user',
  phone_verified_at timestamptz,
  last_login_at     timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz
);
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------- Keanggotaan pengguna di lingkungan ----------
CREATE TABLE community_members (
  community_id uuid NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role         member_role   NOT NULL DEFAULT 'warga',
  status       member_status NOT NULL DEFAULT 'active',
  joined_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (community_id, user_id)
);
CREATE INDEX idx_members_user ON community_members(user_id);

-- ---------- Kategori usaha (global, hierarkis) ----------
CREATE TABLE categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id  uuid REFERENCES categories(id) ON DELETE SET NULL,
  slug       text NOT NULL UNIQUE,
  name       text NOT NULL,
  icon       text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active  boolean NOT NULL DEFAULT true
);

-- ---------- Usaha / jasa warga ----------
CREATE TABLE businesses (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  owner_id     uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  category_id  uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  slug         text NOT NULL,
  name         text NOT NULL,
  description  text,
  phone_wa     text,                       -- nomor WhatsApp usaha (atas persetujuan pemilik)
  address      text,
  location     geography(Point, 4326),
  status       publish_status NOT NULL DEFAULT 'pending',
  rating_avg   numeric(3,2) NOT NULL DEFAULT 0,
  rating_count integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz,
  UNIQUE (community_id, slug)
);
CREATE INDEX idx_biz_community_status ON businesses(community_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_biz_category ON businesses(category_id);
CREATE INDEX idx_biz_owner ON businesses(owner_id);
CREATE INDEX idx_biz_location ON businesses USING gist(location);
CREATE INDEX idx_biz_name_trgm ON businesses USING gin(name gin_trgm_ops);
CREATE TRIGGER trg_businesses_updated BEFORE UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE business_hours (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),  -- 0 = Minggu
  open_time   time,
  close_time  time,
  is_closed   boolean NOT NULL DEFAULT false,
  UNIQUE (business_id, day_of_week)
);

CREATE TABLE business_photos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  url         text NOT NULL,               -- file disimpan di object storage, bukan di DB
  caption     text,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_photos_business ON business_photos(business_id, sort_order);

-- ---------- Ulasan ----------
CREATE TABLE reviews (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating      smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     text,
  status      publish_status NOT NULL DEFAULT 'active',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz,
  UNIQUE (business_id, user_id)            -- satu ulasan per pengguna per usaha
);
CREATE TRIGGER trg_reviews_updated BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------- Pengumuman & agenda ----------
CREATE TABLE announcements (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  author_id    uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title        text NOT NULL,
  body         text NOT NULL,
  status       publish_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz
);
CREATE INDEX idx_ann_community_pub ON announcements(community_id, published_at DESC) WHERE deleted_at IS NULL;
CREATE TRIGGER trg_announcements_updated BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id  uuid NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  author_id     uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title         text NOT NULL,
  description   text,
  location_text text,
  starts_at     timestamptz NOT NULL,
  ends_at       timestamptz,
  status        publish_status NOT NULL DEFAULT 'draft',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz,
  CHECK (ends_at IS NULL OR ends_at >= starts_at)
);
CREATE INDEX idx_events_community_start ON events(community_id, starts_at) WHERE deleted_at IS NULL;
CREATE TRIGGER trg_events_updated BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------- Favorit & token notifikasi ----------
CREATE TABLE favorites (
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, business_id)
);

CREATE TABLE device_tokens (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      text NOT NULL UNIQUE,
  platform   device_platform NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_devices_user ON device_tokens(user_id);

-- ---------- Jejak audit (kandidat partisi per bulan saat data besar) ----------
CREATE TABLE audit_logs (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  community_id uuid REFERENCES communities(id) ON DELETE SET NULL,
  actor_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  action       text NOT NULL,              -- mis. 'business.approve'
  entity_type  text NOT NULL,
  entity_id    uuid,
  metadata     jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_community_time ON audit_logs(community_id, created_at DESC);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
