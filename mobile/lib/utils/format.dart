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

// ---------- Tanggal (zona WIB, UTC+7, sama seperti web) ----------

const _months = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const _monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const _days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

/// Nilai kalender (tahun, bulan, hari, jam) di objek hasil adalah waktu WIB.
DateTime toWib(DateTime d) => d.toUtc().add(const Duration(hours: 7));

String _two(int n) => n.toString().padLeft(2, '0');

/// Contoh: `27 November 2026`.
String formatDateId(DateTime d) {
  final w = toWib(d);
  return '${w.day} ${_months[w.month - 1]} ${w.year}';
}

/// Angka hari untuk kotak tanggal agenda, contoh `4`.
String eventDay(DateTime d) => '${toWib(d).day}';

/// Singkatan bulan untuk kotak tanggal agenda, contoh `DES`.
String eventMonth(DateTime d) => _monthsShort[toWib(d).month - 1].toUpperCase();

/// Contoh: `Jumat, 4 Des 2026 · 07.00 WIB`.
String formatEventTime(DateTime d) {
  final w = toWib(d);
  return '${_days[w.weekday % 7]}, ${w.day} ${_monthsShort[w.month - 1]} ${w.year} · ${_two(w.hour)}.${_two(w.minute)} WIB';
}

/// `08:30:00` menjadi `08:30`.
String shortTime(String? t) => t == null ? '' : (t.length >= 5 ? t.substring(0, 5) : t);

const dayNames = _days;

// ---------- Laporan warga ----------

const reportStatusLabels = {'baru': 'Baru', 'diproses': 'Diproses', 'selesai': 'Selesai'};

class ReportCategory {
  const ReportCategory(this.value, this.label);
  final String value;
  final String label;
}

const reportCategories = [
  ReportCategory('infrastruktur', 'Jalan, selokan, lampu'),
  ReportCategory('kebersihan', 'Sampah dan kebersihan'),
  ReportCategory('keamanan', 'Keamanan dan ketertiban'),
  ReportCategory('lainnya', 'Lainnya'),
];

String reportCategoryLabel(String value) {
  for (final c in reportCategories) {
    if (c.value == value) return c.label;
  }
  return value;
}

/// Validasi isian laporan di sisi aplikasi (server tetap memvalidasi ulang). Mengembalikan daftar pesan error.
List<String> validateReport({
  required String? category,
  required String title,
  required String description,
  String locationText = '',
  String reporterName = '',
  String reporterPhone = '',
}) {
  final errors = <String>[];
  final t = title.trim();
  final d = description.trim();
  if (category == null) errors.add('Pilih jenis laporan.');
  if (t.isEmpty) {
    errors.add('Judul laporan wajib diisi.');
  } else if (t.length < 3) {
    errors.add('Judul laporan minimal 3 karakter.');
  } else if (t.length > 120) {
    errors.add('Judul laporan maksimal 120 karakter.');
  }
  if (d.isEmpty) {
    errors.add('Uraian wajib diisi.');
  } else if (d.length < 10) {
    errors.add('Uraian minimal 10 karakter.');
  } else if (d.length > 2000) {
    errors.add('Uraian maksimal 2000 karakter.');
  }
  if (locationText.trim().length > 200) errors.add('Lokasi maksimal 200 karakter.');
  if (reporterName.trim().length > 80) errors.add('Nama maksimal 80 karakter.');
  final phone = reporterPhone.replaceAll(RegExp(r'[\s().-]'), '');
  if (phone.isNotEmpty) {
    final digits = phone.replaceFirst('+', '');
    if (!RegExp(r'^\d+$').hasMatch(phone.replaceFirst(RegExp(r'^\+'), '')) ||
        digits.length < 9 ||
        digits.length > 15) {
      errors.add('Nomor HP tidak valid (contoh: 0812-3456-7890).');
    }
  }
  return errors;
}
