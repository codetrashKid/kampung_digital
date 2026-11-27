import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:kampung_digital/services/api_client.dart';
import 'package:kampung_digital/widgets/update_gate.dart';
import 'package:material_ui/material_ui.dart';

const _home = 'HALAMAN UTAMA';

Map<String, Object?> _latest({String? notes = 'Perbaikan bug'}) => {
      'version': '0.2.0',
      'build': 5,
      'url': 'https://contoh.com/app.apk',
      'notes': notes,
      'published_at': '2026-11-27T00:00:00.000Z',
    };

http.Response _json(Map<String, Object?> body, [int status = 200]) =>
    http.Response(jsonEncode(body), status);

class _Harness {
  _Harness(this.handler);
  final MockClientHandler handler;
  final requests = <Uri>[];
  final opened = <Uri>[];

  Widget app({int build = 3, String? platform = 'android'}) {
    final api = ApiClient(
      baseUrl: 'http://test',
      httpClient: MockClient((req) async {
        requests.add(req.url);
        return handler(req);
      }),
    );
    return MaterialApp(
      home: UpdateGate(
        api: api,
        currentBuild: build,
        platform: platform,
        openUrl: (uri) async {
          opened.add(uri);
          return true;
        },
        child: const Scaffold(body: Text(_home)),
      ),
    );
  }
}

void main() {
  testWidgets('build pengembangan (0) melewati pengecekan', (tester) async {
    final h = _Harness((_) async => _json({}));
    await tester.pumpWidget(h.app(build: 0));
    await tester.pumpAndSettle();
    expect(find.text(_home), findsOneWidget);
    expect(h.requests, isEmpty);
  });

  testWidgets('tanpa platform eksplisit tetap aman (memakai platform perangkat)', (tester) async {
    final h = _Harness((_) async => _json({}));
    await tester.pumpWidget(h.app(platform: null));
    await tester.pumpAndSettle();
    // Di mesin uji, defaultTargetPlatform adalah android, jadi pengecekan tetap jalan.
    expect(find.text(_home), findsOneWidget);
  });

  testWidgets('sudah versi terbaru: langsung ke halaman utama tanpa dialog', (tester) async {
    final h = _Harness((_) async => _json({
          'update_available': false,
          'update_required': false,
          'latest': null,
        }));
    await tester.pumpWidget(h.app());
    await tester.pumpAndSettle();
    expect(find.text(_home), findsOneWidget);
    expect(find.text('Pembaruan tersedia'), findsNothing);
    expect(h.requests.single.queryParameters, {'platform': 'android', 'build': '3'});
  });

  testWidgets('update wajib: layar terkunci, halaman utama tidak tampil', (tester) async {
    final h = _Harness((_) async => _json({
          'update_available': true,
          'update_required': true,
          'latest': _latest(),
        }));
    await tester.pumpWidget(h.app());
    await tester.pumpAndSettle();

    expect(find.text('Perbarui aplikasi'), findsOneWidget);
    expect(find.text('Versi terbaru: 0.2.0'), findsOneWidget);
    expect(find.text('Perbaikan bug'), findsOneWidget);
    expect(find.text(_home), findsNothing);

    await tester.tap(find.text('Perbarui sekarang'));
    await tester.pumpAndSettle();
    expect(h.opened.single.toString(), 'https://contoh.com/app.apk');
  });

  testWidgets('update wajib dengan tautan bukan https tidak dibuka', (tester) async {
    final h = _Harness((_) async => _json({
          'update_available': true,
          'update_required': true,
          'latest': {..._latest(), 'url': 'http://contoh.com/app.apk'},
        }));
    await tester.pumpWidget(h.app());
    await tester.pumpAndSettle();
    await tester.tap(find.text('Perbarui sekarang'));
    await tester.pumpAndSettle();
    expect(h.opened, isEmpty);
    expect(find.text('Tautan pembaruan tidak dapat dibuka.'), findsOneWidget);
  });

  testWidgets('update opsional: aplikasi jalan dan dialog bisa ditutup', (tester) async {
    final h = _Harness((_) async => _json({
          'update_available': true,
          'update_required': false,
          'latest': _latest(),
        }));
    await tester.pumpWidget(h.app());
    await tester.pumpAndSettle();

    expect(find.text(_home), findsOneWidget);
    expect(find.text('Pembaruan tersedia'), findsOneWidget);

    await tester.tap(find.text('Nanti'));
    await tester.pumpAndSettle();
    expect(find.text('Pembaruan tersedia'), findsNothing);
    expect(find.text(_home), findsOneWidget);
    expect(h.opened, isEmpty);
  });

  testWidgets('update opsional: tombol Perbarui membuka tautan', (tester) async {
    final h = _Harness((_) async => _json({
          'update_available': true,
          'update_required': false,
          'latest': _latest(),
        }));
    await tester.pumpWidget(h.app());
    await tester.pumpAndSettle();
    await tester.tap(find.text('Perbarui'));
    await tester.pumpAndSettle();
    expect(h.opened.single.host, 'contoh.com');
  });

  testWidgets('gagal memeriksa (server error): aplikasi tetap bisa dipakai', (tester) async {
    final h = _Harness((_) async => _json({'error': 'boom'}, 500));
    await tester.pumpWidget(h.app());
    await tester.pumpAndSettle();
    expect(find.text(_home), findsOneWidget);
    expect(find.text('Perbarui aplikasi'), findsNothing);
  });

  testWidgets('gagal memeriksa (tanpa jaringan): aplikasi tetap bisa dipakai', (tester) async {
    final h = _Harness((_) async => throw http.ClientException('offline'));
    await tester.pumpWidget(h.app());
    await tester.pumpAndSettle();
    expect(find.text(_home), findsOneWidget);
  });
}
