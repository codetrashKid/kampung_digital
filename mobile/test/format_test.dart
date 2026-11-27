import 'package:flutter_test/flutter_test.dart';
import 'package:kampung_digital/utils/format.dart';

void main() {
  group('whatsappUri', () {
    test('mengambil angka saja dari nomor', () {
      expect(whatsappUri('+62 812-3456-7890').toString(),
          'https://wa.me/6281234567890');
    });

    test('mengembalikan null untuk null, kosong, atau tanpa angka', () {
      expect(whatsappUri(null), isNull);
      expect(whatsappUri(''), isNull);
      expect(whatsappUri('abc-+'), isNull);
    });

    test('menyertakan teks yang di-encode', () {
      final uri = whatsappUri('0812', text: 'Halo Bu Sari')!;
      expect(uri.host, 'wa.me');
      expect(uri.path, '/0812');
      expect(uri.queryParameters['text'], 'Halo Bu Sari');
    });

    test('teks kosong tidak menambah query', () {
      expect(whatsappUri('0812', text: '').toString(), 'https://wa.me/0812');
    });
  });

  group('formatRating', () {
    test('satu angka desimal', () {
      expect(formatRating(4.5), '4.5');
      expect(formatRating(4), '4.0');
      expect(formatRating(4.26), '4.3');
    });
  });
}
