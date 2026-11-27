-- Login admin dengan email + sandi (tanpa layanan pihak ketiga).
-- Login OTP untuk warga menyusul di tahap berikutnya.
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text;  -- format: scrypt$<salt hex>$<hash hex>
