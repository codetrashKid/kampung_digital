import 'dart:convert';

import 'package:material_ui/material_ui.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:kampung_digital/main.dart';
import 'package:kampung_digital/services/api_client.dart';

Map<String, Object?> _biz(String name, {String? wa}) => {
      'id': name,
      'slug': name.toLowerCase().replaceAll(' ', '-'),
      'name': name,
      'description': 'Deskripsi $name',
      'address': 'Jl. Contoh 1',
      'phone_wa': wa,
      'rating_avg': 4.5,
      'rating_count': 2,
      'category_name': 'Makanan',
      'category_slug': 'makanan',
    };

Widget _app(MockClientHandler handler) => KampungDigitalApp(
      api: ApiClient(baseUrl: 'http://test', httpClient: MockClient(handler)),
    );

http.Response _ok(List<Map<String, Object?>> data) =>
    http.Response(jsonEncode({'community': 'c', 'data': data}), 200);

void main() {
  testWidgets('menampilkan daftar usaha dari API', (tester) async {
    await tester.pumpWidget(_app(
        (_) async => _ok([_biz('Warung Bu Sari'), _biz('Bengkel Pak Budi')])));
    expect(find.byType(CircularProgressIndicator), findsOneWidget);

    await tester.pumpAndSettle();

    expect(find.text('Warung Bu Sari'), findsOneWidget);
    expect(find.text('Bengkel Pak Budi'), findsOneWidget);
  });

  testWidgets('menampilkan pesan saat tidak ada usaha', (tester) async {
    await tester.pumpWidget(_app((_) async => _ok([])));
    await tester.pumpAndSettle();
    expect(find.text('Usaha tidak ditemukan.'), findsOneWidget);
  });

  testWidgets('menampilkan error dan bisa coba lagi', (tester) async {
    var calls = 0;
    await tester.pumpWidget(_app((_) async {
      calls++;
      if (calls == 1) {
        return http.Response(jsonEncode({'error': 'DATABASE_URL belum diatur'}), 503);
      }
      return _ok([_biz('Warung Bu Sari')]);
    }));
    await tester.pumpAndSettle();
    expect(find.text('DATABASE_URL belum diatur'), findsOneWidget);

    await tester.tap(find.text('Coba lagi'));
    await tester.pumpAndSettle();
    expect(find.text('Warung Bu Sari'), findsOneWidget);
  });

  testWidgets('pencarian mengirim kata kunci ke API', (tester) async {
    final queries = <String?>[];
    await tester.pumpWidget(_app((req) async {
      queries.add(req.url.queryParameters['q']);
      return _ok([_biz('Warung Bu Sari')]);
    }));
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField), 'nasi');
    await tester.tap(find.byTooltip('Cari'));
    await tester.pumpAndSettle();

    expect(queries, [null, 'nasi']);
  });

  testWidgets('membuka detail; tombol WhatsApp hanya bila ada nomor',
      (tester) async {
    await tester.pumpWidget(_app((_) async => _ok([
          _biz('Warung Bu Sari', wa: '0812'),
          _biz('Bengkel Pak Budi'),
        ])));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Warung Bu Sari'));
    await tester.pumpAndSettle();
    expect(find.text('Deskripsi Warung Bu Sari'), findsOneWidget);
    expect(find.text('Pesan via WhatsApp'), findsOneWidget);

    await tester.pageBack();
    await tester.pumpAndSettle();

    await tester.tap(find.text('Bengkel Pak Budi'));
    await tester.pumpAndSettle();
    expect(find.text('Pesan via WhatsApp'), findsNothing);
  });
}
