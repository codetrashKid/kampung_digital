-- Daftar rilis aplikasi mobile untuk fitur "update wajib".
-- Tabel ini milik platform (bukan per lingkungan) karena satu aplikasi dipakai semua lingkungan,
-- jadi sengaja tanpa community_id; hanya super_admin yang boleh mengelolanya.
CREATE TYPE app_platform AS ENUM ('android', 'ios');

CREATE TABLE app_releases (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform      app_platform NOT NULL,
  version_name  text NOT NULL,                       -- mis. 0.2.0 (untuk ditampilkan)
  build_number  integer NOT NULL CHECK (build_number > 0),  -- pembanding versi; naik setiap build
  download_url  text NOT NULL,                       -- tautan https unduhan (APK) atau TestFlight/App Store
  release_notes text,
  is_mandatory  boolean NOT NULL DEFAULT false,      -- true: build yang lebih lama dikunci sampai update
  is_active     boolean NOT NULL DEFAULT true,       -- false: rilis diabaikan (mencabut kunci)
  created_by    uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz
);
CREATE UNIQUE INDEX uq_app_releases_build ON app_releases(platform, build_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_app_releases_lookup ON app_releases(platform, build_number DESC)
  WHERE is_active AND deleted_at IS NULL;
CREATE TRIGGER trg_app_releases_updated BEFORE UPDATE ON app_releases
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
