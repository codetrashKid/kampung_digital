-- Fase B: login warga dengan kode undangan, data warga, dan pembatasan percobaan login.

-- Kode undangan dari pengurus. Warga yang mendaftar dengan kode otomatis jadi anggota aktif.
CREATE TABLE invite_codes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  code         text NOT NULL,                        -- 8 karakter huruf besar/angka tanpa O,0,I,1
  label        text,                                 -- mis. "RT 03 November"
  max_uses     integer CHECK (max_uses IS NULL OR max_uses > 0),  -- NULL = tanpa batas
  used_count   integer NOT NULL DEFAULT 0,
  expires_at   timestamptz,                          -- NULL = tidak kedaluwarsa
  is_active    boolean NOT NULL DEFAULT true,
  created_by   uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz
);
CREATE UNIQUE INDEX uq_invite_code ON invite_codes(code) WHERE deleted_at IS NULL;
CREATE INDEX idx_invite_community ON invite_codes(community_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE TRIGGER trg_invite_codes_updated BEFORE UPDATE ON invite_codes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Profil warga per lingkungan. Data seminimal mungkin (UU PDP); tanpa NIK/KK.
CREATE TABLE residents (
  community_id      uuid NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id           uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address_block     text NOT NULL,                   -- blok / nama jalan
  house_number      text,
  rt                text,
  rw                text,
  show_in_directory boolean NOT NULL DEFAULT false,  -- warga setuju namanya tampil di direktori warga
  consented_at      timestamptz NOT NULL,            -- saat warga menyetujui penggunaan datanya
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (community_id, user_id)
);
CREATE INDEX idx_residents_user ON residents(user_id);
CREATE TRIGGER trg_residents_updated BEFORE UPDATE ON residents
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Catatan percobaan gagal (login, kode undangan) untuk pembatasan laju tanpa state di server.
-- key_hash adalah hash (rahasia server + nilai), bukan IP/nomor asli.
CREATE TABLE auth_attempts (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kind       text NOT NULL,        -- 'login-ip', 'login-akun', 'admin-login-ip', 'admin-login-akun', 'kode-ip'
  key_hash   text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_auth_attempts_lookup ON auth_attempts(kind, key_hash, created_at DESC);
