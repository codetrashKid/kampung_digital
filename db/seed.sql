-- Data CONTOH untuk pengembangan. Semua nama dan nomor di sini fiktif.
-- Aman dijalankan berulang kali (idempoten).

INSERT INTO communities (name, slug, description)
VALUES ('Contoh Kampung', 'contoh-kampung',
        'Portal contoh untuk warga dan usaha lokal. Ganti data ini dengan data lingkungan Anda.')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO users (phone, full_name, platform_role, phone_verified_at)
VALUES ('+620000000001', 'Admin Contoh', 'super_admin', now())
ON CONFLICT (phone) DO NOTHING;

INSERT INTO categories (slug, name, icon, sort_order) VALUES
  ('makanan',  'Makanan & Minuman', '🍜', 1),
  ('jasa',     'Jasa & Perbaikan',  '🛠️', 2),
  ('belanja',  'Belanja Harian',    '🛒', 3),
  ('kecantikan','Kecantikan & Kesehatan','💇', 4),
  ('pendidikan','Les & Pendidikan', '📚', 5)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO community_members (community_id, user_id, role)
SELECT c.id, u.id, 'admin_lingkungan'
FROM communities c, users u
WHERE c.slug = 'contoh-kampung' AND u.phone = '+620000000001'
ON CONFLICT DO NOTHING;

INSERT INTO businesses
  (community_id, owner_id, category_id, slug, name, description, phone_wa, address, status, rating_avg, rating_count)
SELECT c.id, u.id, cat.id, v.slug, v.name, v.description, v.phone_wa, v.address, 'active', v.rating, v.cnt
FROM (VALUES
  ('makanan', 'warung-bu-sari',  'Warung Bu Sari',  'Nasi campur dan lauk rumahan, buka dari pagi.', '+620000000101', 'Jl. Contoh No. 1', 4.8, 12),
  ('makanan', 'kopi-pojok',      'Kopi Pojok',      'Kopi susu dan roti bakar untuk nongkrong santai.', '+620000000102', 'Jl. Contoh No. 7', 4.5, 8),
  ('jasa',    'tukang-pak-budi', 'Tukang Pak Budi', 'Perbaikan atap, listrik, dan renovasi kecil.', '+620000000103', 'Gang Melati No. 3', 4.7, 5),
  ('belanja', 'toko-sembako-ani','Toko Sembako Ani','Sembako, galon, dan gas. Bisa antar ke rumah.', '+620000000104', 'Jl. Contoh No. 12', 4.2, 3),
  ('pendidikan','les-kak-dina',  'Les Kak Dina',    'Les privat SD dan SMP untuk semua mata pelajaran.', '+620000000105', 'Gang Mawar No. 9', 0, 0)
) AS v(cat_slug, slug, name, description, phone_wa, address, rating, cnt)
JOIN categories cat ON cat.slug = v.cat_slug
CROSS JOIN communities c
CROSS JOIN users u
WHERE c.slug = 'contoh-kampung' AND u.phone = '+620000000001'
ON CONFLICT (community_id, slug) DO NOTHING;

-- Jam buka contoh untuk Warung Bu Sari (Senin-Sabtu 07:00-15:00, Minggu tutup)
INSERT INTO business_hours (business_id, day_of_week, open_time, close_time, is_closed)
SELECT b.id, d, CASE WHEN d = 0 THEN NULL ELSE '07:00'::time END,
       CASE WHEN d = 0 THEN NULL ELSE '15:00'::time END, d = 0
FROM businesses b, generate_series(0, 6) AS d
WHERE b.slug = 'warung-bu-sari'
ON CONFLICT (business_id, day_of_week) DO NOTHING;

INSERT INTO announcements (community_id, author_id, title, body, status, published_at)
SELECT c.id, u.id, v.title, v.body, 'active', now()
FROM (VALUES
  ('Kerja bakti bulanan', 'Kerja bakti membersihkan selokan hari Minggu pukul 07:00. Mohon bawa peralatan masing-masing.'),
  ('Selamat datang di Kampung Digital', 'Pemilik usaha warga dipersilakan mendaftarkan usahanya agar mudah ditemukan tetangga.')
) AS v(title, body)
CROSS JOIN communities c
CROSS JOIN users u
WHERE c.slug = 'contoh-kampung' AND u.phone = '+620000000001'
  AND NOT EXISTS (SELECT 1 FROM announcements a WHERE a.community_id = c.id AND a.title = v.title);
