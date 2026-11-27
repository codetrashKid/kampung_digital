#!/usr/bin/env bash
# Membuat folder android/ dan ios/ (tidak disimpan di git) lalu menambah izin internet.
# Jalankan dari folder mobile/ :  bash tool/prepare_platforms.sh
set -euo pipefail

flutter create --platforms=android,ios --org id.kampungdigital --project-name kampung_digital .

# Manifest utama bawaan flutter create tidak memuat izin INTERNET (hanya debug/profile),
# padahal build release membutuhkannya untuk memanggil API.
MANIFEST=android/app/src/main/AndroidManifest.xml
if ! grep -q 'android.permission.INTERNET' "$MANIFEST"; then
  sed -i.bak 's#<application#<uses-permission android:name="android.permission.INTERNET"/>\n    <application#' "$MANIFEST"
fi
# Nama aplikasi yang tampil di layar utama.
sed -i.bak 's#android:label="[^"]*"#android:label="Kampung Digital"#' "$MANIFEST"
rm -f "$MANIFEST.bak"

# Tanda tangan rilis Android yang TETAP. Tanpa ini setiap build ditandatangani kunci debug acak milik
# mesin CI, dan Android menolak memasang update di atas versi lama (tanda tangan berbeda).
# Isi 4 variabel lingkungan (di CI: GitHub Secrets); lihat README bagian "Kunci tanda tangan Android".
if [ -n "${ANDROID_KEYSTORE_BASE64:-}" ]; then
  : "${ANDROID_KEYSTORE_PASSWORD:?ANDROID_KEYSTORE_PASSWORD wajib diisi}"
  : "${ANDROID_KEY_ALIAS:?ANDROID_KEY_ALIAS wajib diisi}"
  : "${ANDROID_KEY_PASSWORD:?ANDROID_KEY_PASSWORD wajib diisi}"
  KEYSTORE_PATH="$(pwd)/android/release.jks"
  printf '%s' "$ANDROID_KEYSTORE_BASE64" | base64 -d > "$KEYSTORE_PATH"
  # Properti "injected" dibaca Android Gradle Plugin untuk build release; file ini tidak di-commit (android/ di-ignore).
  {
    echo ""
    echo "android.injected.signing.store.file=$KEYSTORE_PATH"
    echo "android.injected.signing.store.password=$ANDROID_KEYSTORE_PASSWORD"
    echo "android.injected.signing.key.alias=$ANDROID_KEY_ALIAS"
    echo "android.injected.signing.key.password=$ANDROID_KEY_PASSWORD"
  } >> android/gradle.properties
  echo "Tanda tangan rilis Android: memakai keystore dari secret."
else
  echo "PERINGATAN: ANDROID_KEYSTORE_BASE64 kosong; APK memakai kunci debug acak dan TIDAK bisa di-update di atas versi sebelumnya."
fi
