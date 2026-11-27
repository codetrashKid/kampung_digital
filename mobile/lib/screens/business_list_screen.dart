import 'package:material_ui/material_ui.dart';

import '../models/business.dart';
import '../models/home.dart';
import '../services/api_client.dart';
import '../utils/format.dart';
import '../widgets/common.dart';
import 'business_detail_screen.dart';

/// Direktori usaha: pencarian nama, filter kategori, dan daftar usaha.
class BusinessListScreen extends StatefulWidget {
  const BusinessListScreen({
    super.key,
    required this.api,
    this.initialCategorySlug,
    this.title = 'Usaha & Jasa',
  });

  final ApiClient api;
  final String? initialCategorySlug;
  final String title;

  @override
  State<BusinessListScreen> createState() => _BusinessListScreenState();
}

class _BusinessListScreenState extends State<BusinessListScreen> {
  final _searchController = TextEditingController();
  late Future<List<Business>> _future;
  late Future<List<Category>> _categories;
  String? _category;

  @override
  void initState() {
    super.initState();
    _category = widget.initialCategorySlug;
    _categories = widget.api.listCategories();
    _future = _load();
  }

  Future<List<Business>> _load() => widget.api.listBusinesses(
        query: _searchController.text,
        categorySlug: _category,
      );

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _reload() {
    // Blok (bukan panah): setState tidak boleh menerima fungsi yang mengembalikan Future.
    setState(() {
      _future = _load();
    });
  }

  void _selectCategory(String? slug) {
    _category = slug;
    _reload();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.title)),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: TextField(
              controller: _searchController,
              textInputAction: TextInputAction.search,
              onSubmitted: (_) => _reload(),
              style: const TextStyle(fontSize: 18),
              decoration: InputDecoration(
                hintText: 'Cari usaha atau jasa',
                border: const OutlineInputBorder(),
                suffixIcon: IconButton(
                  tooltip: 'Cari',
                  icon: const Icon(Icons.search),
                  onPressed: _reload,
                ),
              ),
            ),
          ),
          FutureBuilder<List<Category>>(
            future: _categories,
            builder: (context, snapshot) {
              final categories = snapshot.data;
              if (categories == null || categories.isEmpty) return const SizedBox.shrink();
              return SizedBox(
                height: 48,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  children: [
                    Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: const Text('Semua'),
                        selected: _category == null,
                        onSelected: (_) => _selectCategory(null),
                      ),
                    ),
                    for (final c in categories)
                      Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text('${c.icon ?? ''} ${c.name}'.trim()),
                          selected: _category == c.slug,
                          onSelected: (_) => _selectCategory(c.slug),
                        ),
                      ),
                  ],
                ),
              );
            },
          ),
          Expanded(
            child: FutureBuilder<List<Business>>(
              future: _future,
              builder: (context, snapshot) {
                if (snapshot.connectionState != ConnectionState.done) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (snapshot.hasError) {
                  return ErrorState(error: snapshot.error, onRetry: _reload);
                }
                final items = snapshot.data ?? const <Business>[];
                if (items.isEmpty) return const EmptyState('Usaha tidak ditemukan.');
                return ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                  itemCount: items.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (context, i) => _BusinessTile(api: widget.api, business: items[i]),
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
  const _BusinessTile({required this.api, required this.business});

  final ApiClient api;
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
            builder: (_) => BusinessDetailScreen(api: api, business: business),
          ),
        ),
      ),
    );
  }
}
