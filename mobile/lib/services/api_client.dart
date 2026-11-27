import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/business.dart';
import '../models/home.dart';
import '../models/update_status.dart';

/// Kesalahan saat memanggil API, dengan pesan yang aman ditampilkan ke warga.
class ApiException implements Exception {
  const ApiException(this.message, {this.detail});
  final String message;

  /// Keterangan teknis untuk membantu mencari penyebab (alamat server dan jenis kegagalan). Bukan rahasia.
  final String? detail;

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
    } catch (e) {
      throw ApiException(
        'Tidak dapat terhubung ke server. Periksa koneksi internet.',
        detail: _describe(e),
      );
    }

    if (res.statusCode != 200) {
      throw ApiException(_errorMessage(res), detail: '$baseUrl (kode ${res.statusCode})');
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

  /// Menanyakan server apakah ada versi aplikasi yang lebih baru untuk [platform] ('android' / 'ios').
  Future<UpdateStatus> checkAppVersion({required String platform, required int build}) async {
    final uri = Uri.parse('$baseUrl/api/v1/app-version')
        .replace(queryParameters: {'platform': platform, 'build': '$build'});

    final http.Response res;
    try {
      res = await _http.get(uri).timeout(const Duration(seconds: 6));
    } catch (e) {
      throw ApiException('Tidak dapat memeriksa pembaruan.', detail: _describe(e));
    }
    if (res.statusCode != 200) throw ApiException(_errorMessage(res));
    try {
      return UpdateStatus.fromJson(
          jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>);
    } catch (_) {
      throw const ApiException('Respons server tidak dapat dibaca.');
    }
  }

  /// GET JSON dengan penanganan error yang sama untuk semua endpoint.
  Future<Map<String, dynamic>> _getJson(
    String path, {
    Map<String, String>? query,
    Duration timeout = const Duration(seconds: 15),
  }) async {
    var uri = Uri.parse('$baseUrl$path');
    if (query != null && query.isNotEmpty) uri = uri.replace(queryParameters: query);

    final http.Response res;
    try {
      res = await _http.get(uri).timeout(timeout);
    } catch (e) {
      throw ApiException(
        'Tidak dapat terhubung ke server. Periksa koneksi internet.',
        detail: _describe(e),
      );
    }
    if (res.statusCode != 200) {
      throw ApiException(_errorMessage(res), detail: '$baseUrl (kode ${res.statusCode})');
    }
    try {
      return jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
    } catch (_) {
      throw const ApiException('Respons server tidak dapat dibaca.');
    }
  }

  T _parse<T>(Map<String, dynamic> json, T Function(Map<String, dynamic>) convert) {
    try {
      return convert(json);
    } catch (_) {
      throw const ApiException('Respons server tidak dapat dibaca.');
    }
  }

  /// Semua yang dibutuhkan beranda (pengumuman, agenda, laporan terbaru, kategori, usaha) dalam satu panggilan.
  Future<HomeData> getHome() async => _parse(await _getJson('/api/v1/home'), HomeData.fromJson);

  Future<List<Category>> listCategories() async => _parse(
        await _getJson('/api/v1/categories'),
        (j) => (j['data'] as List<dynamic>).map((e) => Category.fromJson(e as Map<String, dynamic>)).toList(),
      );

  /// Detail usaha beserta jam buka.
  Future<BusinessDetail> getBusiness(String slug) async => _parse(
        await _getJson('/api/v1/businesses/${Uri.encodeComponent(slug)}'),
        BusinessDetail.fromJson,
      );

  /// Laporan warga yang sudah disetujui pengurus (tanpa data pelapor).
  Future<ReportsResult> listReports({String? status, String? category}) async {
    final query = <String, String>{};
    if (status != null && status.isNotEmpty) query['status'] = status;
    if (category != null && category.isNotEmpty) query['jenis'] = category;
    return _parse(await _getJson('/api/v1/reports', query: query), ReportsResult.fromJson);
  }

  /// Mengirim laporan warga (tanpa login). Melempar [ApiException] bila ditolak server.
  Future<void> submitReport(ReportDraft draft) async {
    final uri = Uri.parse('$baseUrl/api/v1/reports');
    final http.Response res;
    try {
      res = await _http
          .post(
            uri,
            headers: {'content-type': 'application/json; charset=utf-8'},
            body: jsonEncode(draft.toJson()),
          )
          .timeout(const Duration(seconds: 15));
    } catch (e) {
      throw ApiException(
        'Tidak dapat terhubung ke server. Periksa koneksi internet.',
        detail: _describe(e),
      );
    }
    if (res.statusCode != 201 && res.statusCode != 200) {
      throw ApiException(_errorMessage(res), detail: '$baseUrl (kode ${res.statusCode})');
    }
  }

  /// Alamat server + jenis kegagalan, mis. "https://x.vercel.app: waktu habis".
  String _describe(Object e) {
    final what = e is TimeoutException
        ? 'waktu habis'
        : e.toString().replaceFirst('ClientException: ', '').replaceFirst('Exception: ', '');
    final text = what.length > 140 ? '${what.substring(0, 140)}…' : what;
    return '$baseUrl: $text';
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
