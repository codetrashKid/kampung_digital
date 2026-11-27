import 'package:material_ui/material_ui.dart';
import 'package:url_launcher/url_launcher.dart';

import '../models/business.dart';
import '../utils/format.dart';

/// Detail usaha dengan tombol pesan lewat WhatsApp.
class BusinessDetailScreen extends StatelessWidget {
  const BusinessDetailScreen({super.key, required this.business});

  final Business business;

  Future<void> _openWhatsapp(BuildContext context) async {
    final uri = whatsappUri(
      business.phoneWa,
      text: 'Halo ${business.name}, saya warga dari Kampung Digital.',
    );
    if (uri == null) return;
    final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!ok && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('WhatsApp tidak dapat dibuka.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasWa = whatsappUri(business.phoneWa) != null;
    return Scaffold(
      appBar: AppBar(title: Text(business.name)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            business.name,
            style: Theme.of(context)
                .textTheme
                .headlineSmall
                ?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            '${business.categoryName} · ★ ${formatRating(business.ratingAvg)} (${business.ratingCount} ulasan)',
            style: const TextStyle(fontSize: 18),
          ),
          if (business.description != null) ...[
            const SizedBox(height: 16),
            Text(business.description!, style: const TextStyle(fontSize: 18)),
          ],
          if (business.address != null) ...[
            const SizedBox(height: 16),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.place_outlined),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(business.address!,
                      style: const TextStyle(fontSize: 18)),
                ),
              ],
            ),
          ],
          const SizedBox(height: 24),
          if (hasWa)
            SizedBox(
              height: 56,
              child: FilledButton.icon(
                onPressed: () => _openWhatsapp(context),
                icon: const Icon(Icons.chat),
                label: const Text('Pesan via WhatsApp',
                    style: TextStyle(fontSize: 18)),
              ),
            ),
        ],
      ),
    );
  }
}
