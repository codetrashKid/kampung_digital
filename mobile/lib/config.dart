/// Alamat dasar API. Ubah saat build:
/// `flutter run --dart-define=API_BASE_URL=https://domain-anda.vercel.app`
///
/// Bawaan `10.0.2.2` adalah alamat komputer host dari emulator Android.
const String apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://10.0.2.2:3000',
);
