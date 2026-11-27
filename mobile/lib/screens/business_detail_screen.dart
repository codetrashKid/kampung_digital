import 'package:material_ui/material_ui.dart';
import 'package:url_launcher/url_launcher.dart';

import '../models/business.dart';
import '../models/home.dart';
import '../services/api_client.dart';
import '../utils/format.dart';

/// Detail usaha: deskripsi, alamat, jam buka, dan tombol pesan lewat WhatsApp.
class BusinessDetailScreen extends StatefulWidget {
  const BusinessDetailScreen({super.key, required this.api, required this.business});

  final ApiClient api;
  final Business business;

  @override
  State<BusinessDetailScreen> createState() => _BusinessDetailScreenState();
}

class _BusinessDetailScreenState extends State<BusinessDetailScreen> {
  late final Future<BusinessDetail> _detail;

  @override
  void initState() {
    super.initState();
    _detail = widget.api.getBusiness(widget.business.slug);
  }

  Future<void> _openWhatsapp(BuildContext context) async {
    final business = widget.business;
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
    final business = widget.business;
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
                  child: Text(business.address!, style: const TextStyle(fontSize: 18)),
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
                label: const Text('Pesan via WhatsApp', style: TextStyle(fontSize: 18)),
              ),
            ),
          FutureBuilder<BusinessDetail>(
            future: _detail,
            builder: (context, snapshot) {
              final hours = snapshot.data?.hours;
              // Jam buka bersifat tambahan: bila gagal dimuat, bagian ini disembunyikan.
              if (hours == null || hours.isEmpty) return const SizedBox.shrink();
              final today = toWib(DateTime.now()).weekday % 7;
              return Padding(
                padding: const EdgeInsets.only(top: 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Jam buka', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    for (final h in hours)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 6),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              dayNames[h.dayOfWeek] + (h.dayOfWeek == today ? ' (hari ini)' : ''),
                              style: TextStyle(
                                fontSize: 17,
                                fontWeight: h.dayOfWeek == today ? FontWeight.bold : FontWeight.normal,
                              ),
                            ),
                            Text(
                              h.isClosed ? 'Tutup' : '${shortTime(h.openTime)} – ${shortTime(h.closeTime)}',
                              style: const TextStyle(fontSize: 17),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
