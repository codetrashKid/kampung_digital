# Membuat kunci tanda tangan Android TETAP untuk aplikasi (dijalankan SEKALI, di komputer Anda).
# Pakai (PowerShell, dari folder mobile/):  powershell -ExecutionPolicy Bypass -File tool\create-keystore.ps1
#
# Sandi diketik di sini dan tidak ditampilkan. Hasil:
#   tool\keystore-out\release.jks          kunci asli. SIMPAN CADANGANNYA (flashdisk/penyimpanan aman).
#   tool\keystore-out\keystore-base64.txt  isi untuk GitHub Secret ANDROID_KEYSTORE_BASE64 (juga disalin ke papan klip).
# Folder keluaran sudah di-ignore git. JANGAN pernah commit atau mengirim file ini lewat chat.
$ErrorActionPreference = "Stop"

function Find-Keytool {
  $cmd = Get-Command keytool -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  if ($env:JAVA_HOME -and (Test-Path "$env:JAVA_HOME\bin\keytool.exe")) { return "$env:JAVA_HOME\bin\keytool.exe" }
  $studio = "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe"
  if (Test-Path $studio) { return $studio }
  throw "keytool tidak ditemukan. Pasang JDK 17 atau Android Studio, atau atur JAVA_HOME."
}

function Read-Secret([string]$prompt) {
  $secure = Read-Host -AsSecureString $prompt
  return [System.Net.NetworkCredential]::new("", $secure).Password
}

$keytool = Find-Keytool
$out = Join-Path $PSScriptRoot "keystore-out"
$jks = Join-Path $out "release.jks"
if (Test-Path $jks) { throw "Sudah ada $jks. Hapus atau pindahkan dulu bila benar-benar ingin membuat kunci BARU (kunci baru = pengguna harus pasang ulang aplikasi)." }
New-Item -ItemType Directory -Force $out | Out-Null

$alias = "kampung"
$pw = Read-Secret "Sandi keystore (minimal 8 karakter, catat di tempat aman)"
$pw2 = Read-Secret "Ulangi sandi"
if ($pw -ne $pw2) { throw "Sandi tidak sama." }
if ($pw.Length -lt 8) { throw "Sandi minimal 8 karakter." }

& $keytool -genkeypair -v -keystore $jks -alias $alias -keyalg RSA -keysize 2048 -validity 10000 `
  -storepass $pw -keypass $pw -dname "CN=Kampung Digital, O=Kampung Digital, C=ID"
if ($LASTEXITCODE -ne 0) { throw "keytool gagal (kode $LASTEXITCODE)." }

$b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($jks))
Set-Content -Path (Join-Path $out "keystore-base64.txt") -Value $b64 -NoNewline -Encoding ascii
try { Set-Clipboard -Value $b64 } catch { }

Write-Host ""
Write-Host "Selesai. Buat 4 GitHub Secret (Settings > Secrets and variables > Actions > New repository secret):" -ForegroundColor Green
Write-Host "  ANDROID_KEYSTORE_BASE64   = isi file tool\keystore-out\keystore-base64.txt (sudah ada di papan klip)"
Write-Host "  ANDROID_KEYSTORE_PASSWORD = sandi yang barusan Anda ketik"
Write-Host "  ANDROID_KEY_ALIAS         = $alias"
Write-Host "  ANDROID_KEY_PASSWORD      = sandi yang sama dengan di atas"
Write-Host ""
Write-Host "PENTING: simpan cadangan tool\keystore-out\release.jks dan sandinya. Jika hilang, update aplikasi tidak bisa lagi menimpa versi lama." -ForegroundColor Yellow
