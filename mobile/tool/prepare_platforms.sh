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
