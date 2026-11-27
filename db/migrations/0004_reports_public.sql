-- Laporan hanya tampil di halaman publik bila pengurus menyetujuinya (moderasi: cegah spam dan tuduhan).
ALTER TABLE reports ADD COLUMN is_public boolean NOT NULL DEFAULT false;
CREATE INDEX idx_reports_public ON reports(community_id, created_at DESC)
  WHERE is_public AND deleted_at IS NULL;
