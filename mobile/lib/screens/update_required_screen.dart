import 'package:material_ui/material_ui.dart';

import '../models/update_status.dart';

/// Layar penuh yang menghalangi pemakaian aplikasi sampai pengguna memperbarui.
class UpdateRequiredScreen extends StatelessWidget {
  const UpdateRequiredScreen({
    super.key,
    required this.status,
    required this.onUpdate,
  });

  final UpdateStatus status;
  final VoidCallback onUpdate;

  @override
  Widget build(BuildContext context) {
    final notes = status.notes;
    return PopScope(
      canPop: false, // tidak bisa ditutup dengan tombol kembali
      child: Scaffold(
        body: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.system_update, size: 72),
                  const SizedBox(height: 16),
                  Text(
                    'Perbarui aplikasi',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Versi aplikasi Anda sudah terlalu lama. Silakan perbarui dulu untuk melanjutkan.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 18),
                  ),
                  if (status.latestVersion != null) ...[
                    const SizedBox(height: 8),
                    Text('Versi terbaru: ${status.latestVersion}', style: const TextStyle(fontSize: 16)),
                  ],
                  if (notes != null && notes.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    Text(notes, textAlign: TextAlign.center, style: const TextStyle(fontSize: 16)),
                  ],
                  const SizedBox(height: 28),
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: FilledButton(
                      onPressed: onUpdate,
                      child: const Text('Perbarui sekarang', style: TextStyle(fontSize: 18)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
