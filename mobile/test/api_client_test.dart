import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:kampung_digital/services/api_client.dart';

const _item = {
  'id': '1',
  'slug': 'warung',
  'name': 'Warung',
  'category_name': 'Makanan',
  'category_slug': 'makanan',
};

ApiClient _clientWith(MockClientHandler handler) =>
    ApiClient(baseUrl: 'http://test', httpClient: MockClient(handler));

void main() {
  test('mengambil daftar usaha dan mengirim parameter yang benar', () async {
    late Uri captured;
    final api = _clientWith((req) async {
      captured = req.url;
      return http.Response(
        jsonEncode({'community': 'contoh', 'data': [_item]}),
        200,
        headers: {'content-type': 'application/json; charset=utf-8'},
      );
    });

    final list = await api.listBusinesses(
        query: '  nasi ', categorySlug: 'makanan', limit: 10);

    expect(list, hasLength(1));
    expect(list.first.name, 'Warung');
    expect(captured.path, '/api/v1/businesses');
    expect(captured.queryParameters, {
      'limit': '10',
      'q': 'nasi',
      'kategori': 'makanan',
    });
  });

  test('query kosong tidak dikirim', () async {
    late Uri captured;
    final api = _clientWith((req) async {
      captured = req.url;
      return http.Response(jsonEncode({'data': []}), 200);
    });
    await api.listBusinesses(query: '   ');
    expect(captured.queryParameters.containsKey('q'), isFalse);
    expect(captured.queryParameters['limit'], '24');
  });

  test('membaca karakter UTF-8 dengan benar', () async {
    final api = _clientWith((req) async => http.Response.bytes(
          utf8.encode(jsonEncode({
            'data': [
              {..._item, 'name': 'Kedai Kopi Éndah'}
            ]
          })),
          200,
        ));
    final list = await api.listBusinesses();
    expect(list.first.name, 'Kedai Kopi Éndah');
  });

  test('memakai pesan error dari server', () async {
    final api = _clientWith((req) async =>
        http.Response(jsonEncode({'error': 'DATABASE_URL belum diatur'}), 503));
    expect(
      api.listBusinesses(),
      throwsA(isA<ApiException>()
          .having((e) => e.message, 'message', 'DATABASE_URL belum diatur')),
    );
  });

  test('pesan umum bila body error tidak berupa JSON', () async {
    final api = _clientWith((req) async => http.Response('boom', 500));
    expect(
      api.listBusinesses(),
      throwsA(isA<ApiException>()
          .having((e) => e.message, 'message', contains('500'))),
    );
  });

  test('error jaringan menjadi ApiException', () async {
    final api = _clientWith((req) async => throw http.ClientException('x'));
    expect(
      api.listBusinesses(),
      throwsA(isA<ApiException>()
          .having((e) => e.message, 'message', contains('terhubung'))),
    );
  });

  test('respons 200 yang bentuknya salah menjadi ApiException', () async {
    final api = _clientWith(
        (req) async => http.Response(jsonEncode({'data': 'bukan list'}), 200));
    expect(api.listBusinesses(), throwsA(isA<ApiException>()));
  });
}
