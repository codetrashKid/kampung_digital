import 'package:material_ui/material_ui.dart';

import '../models/business.dart';
import '../services/api_client.dart';
import '../utils/format.dart';
import 'business_detail_screen.dart';

/// Direktori usaha: pencarian nama dan daftar usaha.
class BusinessListScreen extends StatefulWidget {
  const BusinessListScreen({super.key, required this.api});

  final ApiClient api;

  @override
  State<BusinessListScreen> createState() => _BusinessListScreenState();
}

class _BusinessListScreenState extends State<BusinessListScreen> {
  final _searchController = TextEditingController();
  late Future<List<Business>> _future;

  @override
  void initState() {
    super.initState();
    _future = widget.api.listBusinesses();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _search() {
    setState(() {
      _future = widget.api.listBusinesses(query: _searchController.text);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Kampung Digital')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              textInputAction: TextInputAction.search,
              onSubmitted: (_) => _search(),
              style: const TextStyle(fontSize: 18),
              decoration: InputDecoration(
                hintText: 'Cari usaha atau jasa',
                border: const OutlineInputBorder(),
                suffixIcon: IconButton(
                  tooltip: 'Cari',
                  icon: const Icon(Icons.search),
                  onPressed: _search,
                ),
              ),
            ),
          ),
          Expanded(
            child: FutureBuilder<List<Business>>(
              future: _future,
              builder: (context, snapshot) {
                if (snapshot.connectionState != ConnectionState.done) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (snapshot.hasError) {
                  final error = snapshot.error;
                  return _ErrorView(
                    message: error.toString(),
                    detail: error is ApiException ? error.detail : null,
                    onRetry: _search,
                  );
                }
                final items = snapshot.data ?? const <Business>[];
                if (items.isEmpty) {
                  return const Center(
                    child: Text('Usaha tidak ditemukan.',
                        style: TextStyle(fontSize: 18)),
                  );
                }
                return ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                  itemCount: items.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (context, i) =>
                      _BusinessTile(business: items[i]),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _BusinessTile extends StatelessWidget {
  const _BusinessTile({required this.business});

  final Business business;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        title: Text(
          business.name,
          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 4),
          child: Text(
            '${business.categoryName} · ★ ${formatRating(business.ratingAvg)} (${business.ratingCount})',
            style: const TextStyle(fontSize: 16),
          ),
        ),
        trailing: const Icon(Icons.chevron_right),
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute<void>(
            builder: (_) => BusinessDetailScreen(business: business),
          ),
        ),
      ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.message, required this.onRetry, this.detail});

  final String message;
  final String? detail;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(message,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 18)),
            if (detail != null) ...[
              const SizedBox(height: 12),
              SelectableText(
                detail!,
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
