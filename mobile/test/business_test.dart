import 'package:flutter_test/flutter_test.dart';
import 'package:kampung_digital/models/business.dart';

void main() {
  group('Business.fromJson', () {
    test('membaca semua kolom dari respons API', () {
      final b = Business.fromJson({
        'id': 'abc',
        'slug': 'warung-bu-sari',
        'name': 'Warung Bu Sari',
        'description': 'Nasi uduk',
        'address': 'Jl. Melati 1',
        'phone_wa': '+62 812-0000-0000',
        'rating_avg': 4.5,
        'rating_count': 12,
        'category_name': 'Makanan',
        'category_slug': 'makanan',
      });
      expect(b.name, 'Warung Bu Sari');
      expect(b.phoneWa, '+62 812-0000-0000');
      expect(b.ratingAvg, 4.5);
      expect(b.ratingCount, 12);
      expect(b.categorySlug, 'makanan');
    });

    test('kolom opsional boleh null dan rating bawaan 0', () {
      final b = Business.fromJson({
        'id': '1',
        'slug': 's',
        'name': 'N',
        'description': null,
        'address': null,
        'phone_wa': null,
        'category_name': 'K',
        'category_slug': 'k',
      });
      expect(b.description, isNull);
      expect(b.phoneWa, isNull);
      expect(b.ratingAvg, 0);
      expect(b.ratingCount, 0);
    });

    test('rating bilangan bulat tetap terbaca sebagai double', () {
      final b = Business.fromJson({
        'id': '1',
        'slug': 's',
        'name': 'N',
        'rating_avg': 4,
        'rating_count': 3,
        'category_name': 'K',
        'category_slug': 'k',
      });
      expect(b.ratingAvg, 4.0);
    });

    test('melempar error bila kolom wajib tidak ada', () {
      expect(() => Business.fromJson({'id': '1'}), throwsA(isA<TypeError>()));
    });
  });
}
