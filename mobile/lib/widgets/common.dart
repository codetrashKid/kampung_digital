import 'package:material_ui/material_ui.dart';

import '../services/api_client.dart';
import '../utils/format.dart';

const brandColor = Color(0xFF0F6B4A);
const navyColor = Color(0xFF0B2A4A);

/// Judul bagian dengan tautan opsional di kanan (mis. "Lihat semua").
class SectionHeader extends StatelessWidget {
  const SectionHeader(this.title, {super.key, this.actionLabel, this.onAction});

  final String title;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
      child: Row(
        children: [
          Expanded(
            child: Text(title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          ),
          if (actionLabel != null && onAction != null)
            TextButton(onPressed: onAction, child: Text(actionLabel!)),
        ],
      ),
    );
  }
}

/// Pil status laporan (Baru / Diproses / Selesai).
class StatusChip extends StatelessWidget {
  const StatusChip(this.status, {super.key});

  final String status;

  @override
  Widget build(BuildContext context) {
    final (bg, fg) = switch (status) {
      'baru' => (const Color(0xFFE0ECFF), const Color(0xFF1D4ED8)),
      'diproses' => (const Color(0xFFFFF1CF), const Color(0xFF8A5A00)),
      'selesai' => (const Color(0xFFDCF5E5), const Color(0xFF0B6B34)),
      _ => (const Color(0xFFE8EBE9), const Color(0xFF4B5A52)),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(999)),
      child: Text(
        reportStatusLabels[status] ?? status,
        style: TextStyle(color: fg, fontSize: 12, fontWeight: FontWeight.w700),
      ),
    );
  }
}

/// Tampilan gagal-memuat dengan penyebab teknis (alamat server) dan tombol coba lagi.
class ErrorState extends StatelessWidget {
  const ErrorState({super.key, required this.error, required this.onRetry});

  final Object? error;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final detail = error is ApiException ? (error as ApiException).detail : null;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.cloud_off, size: 48, color: Colors.black45),
            const SizedBox(height: 12),
            Text(
              error.toString(),
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 18),
            ),
            if (detail != null) ...[
              const SizedBox(height: 12),
              SelectableText(
                detail,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 13, color: Colors.black54),
              ),
            ],
            const SizedBox(height: 16),
            FilledButton(onPressed: onRetry, child: const Text('Coba lagi')),
          ],
        ),
      ),
    );
  }
}

class EmptyState extends StatelessWidget {
  const EmptyState(this.message, {super.key});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(32),
      child: Center(
        child: Text(message, textAlign: TextAlign.center, style: const TextStyle(fontSize: 17, color: Colors.black54)),
      ),
    );
  }
}

/// Kotak tanggal agenda (hari besar + bulan singkat).
class DateBadge extends StatelessWidget {
  const DateBadge(this.date, {super.key});

  final DateTime date;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 56,
      padding: const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(color: const Color(0xFFE8F5EE), borderRadius: BorderRadius.circular(12)),
      child: Column(
        children: [
          Text(eventDay(date), style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: brandColor)),
          Text(eventMonth(date), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: brandColor)),
        ],
      ),
    );
  }
}
