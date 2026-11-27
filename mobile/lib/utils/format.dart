/// Ubah nomor seperti `+62 812-3456` menjadi tautan wa.me.
/// Mengembalikan null bila nomor kosong atau tidak berisi angka.
Uri? whatsappUri(String? phone, {String? text}) {
  if (phone == null) return null;
  final digits = phone.replaceAll(RegExp(r'\D'), '');
  if (digits.isEmpty) return null;
  return Uri.https(
    'wa.me',
    '/$digits',
    text == null || text.isEmpty ? null : {'text': text},
  );
}

/// Format rating menjadi satu angka desimal, misalnya `4.5`.
String formatRating(double rating) => rating.toStringAsFixed(1);
