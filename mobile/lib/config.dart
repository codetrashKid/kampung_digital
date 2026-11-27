/// Alamat dasar API. Ubah saat build:
/// `flutter run --dart-define=API_BASE_URL=https://domain-anda.vercel.app`
///
/// Bawaan `10.0.2.2` adalah alamat komputer host dari emulator Android.
const String apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://10.0.2.2:3000',
);

/// Nomor build aplikasi ini. Diisi CI (`--dart-define=BUILD_NUMBER=<nomor>`) dan harus sama dengan
/// `--build-number` yang dipakai saat build. Nilai 0 (bawaan, saat `flutter run` biasa) berarti
/// build pengembangan: pengecekan update dilewati supaya developer tidak terkunci.
const int appBuildNumber = int.fromEnvironment('BUILD_NUMBER', defaultValue: 0);

/// Nama versi untuk ditampilkan (mis. 0.1.0).
const String appVersionName = String.fromEnvironment('APP_VERSION', defaultValue: 'dev');
