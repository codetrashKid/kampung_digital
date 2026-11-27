import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/business.dart';

/// Kesalahan saat memanggil API, dengan pesan yang aman ditampilkan ke warga.
class ApiException implements Exception {
  const ApiException(this.message);
  final String message;

  @override
  String toString() => message;
}

/// Klien API Kampung Digital (`/api/v1`). Logika bisnis ada di server.
class ApiClient {
  /// [baseUrl] boleh berakhiran `/` (mis. dari salinan URL Vercel); garis miring di ujung dibuang.
  ApiClient({required String baseUrl, http.Client? httpClient})
      : baseUrl = baseUrl.trim().replaceAll(RegExp(r'/+$'), ''),
        _http = httpClient ?? http.Client();

  final String baseUrl;
  final http.Client _http;

  Future<List<Business>> listBusinesses({
    String? query,
    String? categorySlug,
    int limit = 24,
  }) async {
    final params = <String, String>{'limit': '$limit'};
    if (query != null && query.trim().isNotEmpty) params['q'] = query.trim();
    if (categorySlug != null && categorySlug.isNotEmpty) {
      params['kategori'] = categorySlug;
    }
    final uri = Uri.parse('$baseUrl/api/v1/businesses')
        .replace(queryParameters: params);

    final http.Response res;
    try {
      res = await _http.get(uri).timeout(const Duration(seconds: 15));
    } catch (_) {
      throw const ApiException(
          'Tidak dapat terhubung ke server. Periksa koneksi internet.');
    }

    if (res.statusCode != 200) {
      throw ApiException(_errorMessage(res));
    }
    try {
      final body =
          jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
      final data = body['data'] as List<dynamic>;
      return data
          .map((e) => Business.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (_) {
      throw const ApiException('Respons server tidak dapat dibaca.');
    }
  }

  String _errorMessage(http.Response res) {
    try {
      final body =
          jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
      final msg = body['error'];
      if (msg is String && msg.isNotEmpty) return msg;
    } catch (_) {}
    return 'Server bermasalah (kode ${res.statusCode}).';
  }

  void close() => _http.close();
}
