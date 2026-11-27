import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:kampung_digital/main.dart';
import 'package:kampung_digital/services/api_client.dart';
import 'package:material_ui/material_ui.dart';

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

final _report = {
  'id': 'r1',
  'category': 'infrastruktur',
  'title': 'Lampu mati',
  'description': 'Lampu jalan mati sejak Senin.',
  'location_text': 'Gang Melati',
  'status': 'diproses',
  'created_at': '2026-11-27T05:00:00.000Z',
};

final _home = {
  'community': {'name': 'Contoh Kampung', 'slug': 'contoh-kampung', 'description': 'Portal contoh'},
  'stats': {'businesses': 2, 'events': 1},
  'announcements': [
    {'id': 'a1', 'title': 'Kerja bakti bulanan', 'body': 'Bawa peralatan masing-masing.', 'published_at': '2026-11-27T00:00:00.000Z'}
  ],
  'events': [
    {'id': 'e1', 'title': 'Senam pagi', 'location_text': 'Lapangan RT', 'starts_at': '2026-12-04T00:00:00.000Z', 'ends_at': null}
  ],
  'reports': [_report],
  'categories': [
    {'id': 'k1', 'slug': 'makanan', 'name': 'Makanan', 'icon': '🍜', 'total': 2}
  ],
  'businesses': [_biz('Warung Bu Sari', wa: '+620000000101'), _biz('Bengkel Pak Budi')],
};

/// Respons JSON berbyte UTF-8 seperti server sungguhan (http.Response(String) memakai Latin-1 dan menolak emoji).
http.Response _json(Object body, int status) => http.Response.bytes(
      utf8.encode(jsonEncode(body)),
      status,
      headers: {'content-type': 'application/json; charset=utf-8'},
    );

/// Server palsu: mencatat semua permintaan dan menjawab sesuai path.
class _FakeServer {
  _FakeServer({this.homeFailures = 0, this.postStatus = 201});

  int homeFailures;
  int postStatus;
  final requests = <http.Request>[];

  Future<http.Response> handle(http.Request req) async {
    requests.add(req);
    final path = req.url.path;
    http.Response ok(Object body) => _json(body, 200);

    if (path == '/api/v1/home') {
      if (homeFailures > 0) {
        homeFailures--;
        throw http.ClientException("Failed host lookup: 'example.invalid'");
      }
      return ok(_home);
    }
    if (path == '/api/v1/categories') return ok({'data': _home['categories']});
    if (path == '/api/v1/businesses') return ok({'community': 'c', 'data': _home['businesses']});
    if (path == '/api/v1/businesses/warung-bu-sari') {
      return ok({
        'business': _biz('Warung Bu Sari', wa: '+620000000101'),
        'hours': [
          {'day_of_week': 1, 'open_time': '07:00:00', 'close_time': '15:00:00', 'is_closed': false},
          {'day_of_week': 0, 'open_time': null, 'close_time': null, 'is_closed': true},
        ],
      });
    }
    if (path == '/api/v1/reports') {
      if (req.method == 'POST') {
        return _json(
          postStatus == 201 ? {'ok': true} : {'error': 'Terlalu banyak laporan dari jaringan Anda.'},
          postStatus,
        );
      }
      return ok({
        'data': [_report],
        'counts': {'baru': 1, 'diproses': 2, 'selesai': 3},
      });
    }
    return http.Response('tidak ada', 404);
  }

  List<http.Request> where(String path, {String? method}) =>
      requests.where((r) => r.url.path == path && (method == null || r.method == method)).toList();
}

Widget _app(_FakeServer server) => KampungDigitalApp(
      api: ApiClient(baseUrl: 'http://test', httpClient: MockClient(server.handle)),
    );

/// Layar tinggi agar semua item daftar langsung terbangun (tanpa menggulir).
void _tallScreen(WidgetTester tester) {
  tester.view.physicalSize = const Size(800, 3200);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);
}

Finder _tab(String label) => find.descendant(of: find.byType(NavigationBar), matching: find.text(label));

void main() {
  testWidgets('Beranda menampilkan profil, pengumuman, agenda, laporan, dan usaha', (tester) async {
    _tallScreen(tester);
    await tester.pumpWidget(_app(_FakeServer()));
    await tester.pumpAndSettle();

    expect(find.text('Contoh Kampung'), findsOneWidget);
    expect(find.text('Portal contoh'), findsOneWidget);
    expect(find.text('Kerja bakti bulanan'), findsOneWidget);
    expect(find.text('Senam pagi'), findsOneWidget);
    expect(find.text('4'), findsOneWidget); // kotak tanggal agenda (4 Des, WIB)
    expect(find.text('DES'), findsOneWidget);
    expect(find.text('Lampu mati'), findsOneWidget);
    expect(find.text('Diproses'), findsOneWidget);
    expect(find.text('Warung Bu Sari'), findsOneWidget);
    expect(find.text('Bengkel Pak Budi'), findsOneWidget);
  });

  testWidgets('navigasi bawah memuat empat tab seperti web', (tester) async {
    _tallScreen(tester);
    await tester.pumpWidget(_app(_FakeServer()));
    await tester.pumpAndSettle();
    for (final label in ['Beranda', 'Usaha', 'Laporan', 'Lapor']) {
      expect(_tab(label), findsOneWidget, reason: label);
    }
  });

  testWidgets('tab Usaha: daftar, kategori, dan pencarian', (tester) async {
    _tallScreen(tester);
    final server = _FakeServer();
    await tester.pumpWidget(_app(server));
    await tester.pumpAndSettle();

    await tester.tap(_tab('Usaha'));
    await tester.pumpAndSettle();
    expect(find.text('Usaha & Jasa'), findsOneWidget);
    expect(find.text('🍜 Makanan'), findsOneWidget);

    await tester.enterText(find.byType(TextField), 'nasi');
    await tester.tap(find.byTooltip('Cari'));
    await tester.pumpAndSettle();
    expect(server.where('/api/v1/businesses').last.url.queryParameters['q'], 'nasi');

    await tester.tap(find.text('🍜 Makanan'));
    await tester.pumpAndSettle();
    expect(server.where('/api/v1/businesses').last.url.queryParameters['kategori'], 'makanan');
  });

  testWidgets('detail usaha: jam buka dan tombol WhatsApp hanya bila ada nomor', (tester) async {
    _tallScreen(tester);
    await tester.pumpWidget(_app(_FakeServer()));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Warung Bu Sari'));
    await tester.pumpAndSettle();
    expect(find.text('Deskripsi Warung Bu Sari'), findsOneWidget);
    expect(find.text('Pesan via WhatsApp'), findsOneWidget);
    expect(find.text('Jam buka'), findsOneWidget);
    expect(find.text('07:00 – 15:00'), findsOneWidget);
    expect(find.text('Tutup'), findsOneWidget);

    await tester.pageBack();
    await tester.pumpAndSettle();
    await tester.tap(find.text('Bengkel Pak Budi'));
    await tester.pumpAndSettle();
    expect(find.text('Pesan via WhatsApp'), findsNothing);
  });

  testWidgets('tab Laporan: daftar dan filter status memanggil API', (tester) async {
    _tallScreen(tester);
    final server = _FakeServer();
    await tester.pumpWidget(_app(server));
    await tester.pumpAndSettle();

    await tester.tap(_tab('Laporan'));
    await tester.pumpAndSettle();
    expect(find.text('Laporan Warga'), findsOneWidget);
    expect(find.text('Lampu mati'), findsOneWidget);
    expect(find.text('Semua (6)'), findsOneWidget);

    await tester.tap(find.text('Selesai (3)'));
    await tester.pumpAndSettle();
    expect(server.where('/api/v1/reports', method: 'GET').last.url.queryParameters['status'], 'selesai');

    await tester.tap(find.text('Sampah dan kebersihan'));
    await tester.pumpAndSettle();
    expect(server.where('/api/v1/reports', method: 'GET').last.url.queryParameters['jenis'], 'kebersihan');
  });

  testWidgets('form laporan: validasi dulu, lalu kirim ke server', (tester) async {
    _tallScreen(tester);
    final server = _FakeServer();
    await tester.pumpWidget(_app(server));
    await tester.pumpAndSettle();

    await tester.tap(_tab('Lapor'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Kirim laporan'));
    await tester.pumpAndSettle();
    expect(find.text('• Pilih jenis laporan.'), findsOneWidget);
    expect(find.text('• Judul laporan wajib diisi.'), findsOneWidget);
    expect(server.where('/api/v1/reports', method: 'POST'), isEmpty);

    await tester.tap(find.text('Jalan, selokan, lampu'));
    await tester.enterText(find.widgetWithText(TextField, 'Judul singkat *'), 'Lampu mati di gang');
    await tester.enterText(find.widgetWithText(TextField, 'Ceritakan masalahnya *'), 'Lampu jalan mati sejak Senin malam.');
    await tester.enterText(find.widgetWithText(TextField, 'Nomor HP (boleh dikosongkan)'), '0812-0000-0001');
    await tester.tap(find.text('Kirim laporan'));
    await tester.pumpAndSettle();

    final posts = server.where('/api/v1/reports', method: 'POST');
    expect(posts, hasLength(1));
    final body = jsonDecode(posts.single.body) as Map<String, dynamic>;
    expect(body['category'], 'infrastruktur');
    expect(body['title'], 'Lampu mati di gang');
    expect(body['reporter_phone'], '0812-0000-0001');
    expect(find.text('Terima kasih, laporan Anda sudah terkirim.'), findsOneWidget);

    await tester.tap(find.text('Kirim laporan lain'));
    await tester.pumpAndSettle();
    expect(find.text('Kirim laporan'), findsOneWidget);
  });

  testWidgets('form laporan: pesan penolakan server ditampilkan', (tester) async {
    _tallScreen(tester);
    await tester.pumpWidget(_app(_FakeServer(postStatus: 429)));
    await tester.pumpAndSettle();
    await tester.tap(_tab('Lapor'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Lainnya'));
    await tester.enterText(find.widgetWithText(TextField, 'Judul singkat *'), 'Judul laporan');
    await tester.enterText(find.widgetWithText(TextField, 'Ceritakan masalahnya *'), 'Uraian yang cukup panjang.');
    await tester.tap(find.text('Kirim laporan'));
    await tester.pumpAndSettle();

    expect(find.text('• Terlalu banyak laporan dari jaringan Anda.'), findsOneWidget);
    expect(find.text('Terima kasih, laporan Anda sudah terkirim.'), findsNothing);
  });

  testWidgets('gagal memuat Beranda: tampil penyebab dan bisa coba lagi', (tester) async {
    _tallScreen(tester);
    final server = _FakeServer(homeFailures: 1);
    await tester.pumpWidget(_app(server));
    await tester.pumpAndSettle();

    expect(find.text('Tidak dapat terhubung ke server. Periksa koneksi internet.'), findsOneWidget);
    expect(find.textContaining('http://test'), findsOneWidget);
    expect(find.textContaining('example.invalid'), findsOneWidget);

    await tester.tap(find.text('Coba lagi'));
    await tester.pumpAndSettle();
    expect(find.text('Contoh Kampung'), findsOneWidget);
  });
}
