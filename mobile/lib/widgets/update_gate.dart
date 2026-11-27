import 'package:flutter/foundation.dart';
import 'package:material_ui/material_ui.dart';
import 'package:url_launcher/url_launcher.dart';

import '../config.dart';
import '../models/update_status.dart';
import '../screens/update_required_screen.dart';
import '../services/api_client.dart';

/// Membuka tautan unduhan; true bila berhasil dibuka.
typedef UrlOpener = Future<bool> Function(Uri uri);

Future<bool> _launchExternally(Uri uri) => launchUrl(uri, mode: LaunchMode.externalApplication);

/// Membungkus layar utama: memeriksa versi saat aplikasi dibuka.
///
/// - Update **wajib**: menampilkan [UpdateRequiredScreen]; aplikasi tidak bisa dipakai.
/// - Update **opsional**: aplikasi jalan dan muncul dialog "Pembaruan tersedia" yang bisa ditutup.
/// - Gagal memeriksa (offline/server bermasalah): **lanjut** supaya server yang mati tidak mengunci semua pengguna.
/// - Build pengembangan ([currentBuild] <= 0) atau platform selain Android/iOS: tidak diperiksa.
class UpdateGate extends StatefulWidget {
  const UpdateGate({
    super.key,
    required this.api,
    required this.child,
    this.currentBuild = appBuildNumber,
    this.platform,
    this.openUrl = _launchExternally,
  });

  final ApiClient api;
  final Widget child;
  final int currentBuild;

  /// 'android' atau 'ios'. Bila null, ditentukan dari sistem operasi perangkat.
  final String? platform;
  final UrlOpener openUrl;

  @override
  State<UpdateGate> createState() => _UpdateGateState();
}

class _UpdateGateState extends State<UpdateGate> {
  Future<UpdateStatus>? _check;
  bool _dialogShown = false;

  String? get _platform {
    if (widget.platform != null) return widget.platform;
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return 'android';
      case TargetPlatform.iOS:
        return 'ios';
      default:
        return null;
    }
  }

  @override
  void initState() {
    super.initState();
    final platform = _platform;
    if (widget.currentBuild > 0 && platform != null) {
      _check = widget.api.checkAppVersion(platform: platform, build: widget.currentBuild);
    }
  }

  Future<void> _openUpdate(UpdateStatus status) async {
    final uri = status.url == null ? null : Uri.tryParse(status.url!);
    final ok = uri != null && uri.scheme == 'https' && await widget.openUrl(uri);
    if (!ok && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Tautan pembaruan tidak dapat dibuka.')),
      );
    }
  }

  void _showOptionalDialog(UpdateStatus status) {
    if (_dialogShown) return;
    _dialogShown = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      showDialog<void>(
        context: context,
        builder: (dialogContext) => AlertDialog(
          title: const Text('Pembaruan tersedia'),
          content: Text(
            'Versi ${status.latestVersion ?? 'terbaru'} sudah tersedia.'
            '${(status.notes ?? '').isEmpty ? '' : '\n\n${status.notes}'}',
            style: const TextStyle(fontSize: 16),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: const Text('Nanti'),
            ),
            FilledButton(
              onPressed: () {
                Navigator.of(dialogContext).pop();
                _openUpdate(status);
              },
              child: const Text('Perbarui'),
            ),
          ],
        ),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final check = _check;
    if (check == null) return widget.child;

    return FutureBuilder<UpdateStatus>(
      future: check,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Scaffold(
            body: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text('Memeriksa pembaruan…', style: TextStyle(fontSize: 16)),
                ],
              ),
            ),
          );
        }
        final status = snapshot.data;
        if (snapshot.hasError || status == null) return widget.child; // gagal memeriksa: lanjut
        if (status.updateRequired) {
          return UpdateRequiredScreen(status: status, onUpdate: () => _openUpdate(status));
        }
        if (status.updateAvailable) _showOptionalDialog(status);
        return widget.child;
      },
    );
  }
}
