import 'package:material_ui/material_ui.dart';

import '../models/business.dart';
import '../models/home.dart';
import '../services/api_client.dart';
import '../utils/format.dart';
import '../widgets/common.dart';
import 'business_detail_screen.dart';
import 'business_list_screen.dart';

/// Beranda: sama dengan beranda web (profil lingkungan, kategori, pengumuman, agenda, laporan, usaha).
class HomeScreen extends StatefulWidget {
  const HomeScreen({
    super.key,
    required this.api,
    required this.onOpenBusinesses,
    required this.onOpenReports,
    required this.onCreateReport,
  });

  final ApiClient api;
  final VoidCallback onOpenBusinesses;
  final VoidCallback onOpenReports;
  final VoidCallback onCreateReport;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  late Future<HomeData> _future;

  @override
  void initState() {
    super.initState();
    _future = widget.api.getHome();
  }

  Future<void> _reload() async {
    final next = widget.api.getHome();
    setState(() {
      _future = next;
    });
    try {
      await next;
    } catch (_) {
      // Error ditampilkan oleh FutureBuilder.
    }
  }

  void _openBusiness(Business b) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => BusinessDetailScreen(api: widget.api, business: b)),
    );
  }

  void _openCategory(Category c) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => BusinessListScreen(api: widget.api, initialCategorySlug: c.slug, title: c.name),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: FutureBuilder<HomeData>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return SafeArea(child: ErrorState(error: snapshot.error, onRetry: _reload));
          }
          final data = snapshot.data!;
          return RefreshIndicator(
            onRefresh: _reload,
            child: ListView(
              padding: EdgeInsets.zero,
              children: [
                _Hero(data: data),
                _QuickActions(
                  onOpenBusinesses: widget.onOpenBusinesses,
                  onCreateReport: widget.onCreateReport,
                  onOpenReports: widget.onOpenReports,
                ),
                if (data.categories.isNotEmpty) ...[
                  const SectionHeader('Cari berdasarkan kategori'),
                  SizedBox(
                    height: 44,
                    child: ListView.separated(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      scrollDirection: Axis.horizontal,
                      itemCount: data.categories.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 8),
                      itemBuilder: (context, i) {
                        final c = data.categories[i];
                        return ActionChip(
                          label: Text('${c.icon ?? ''} ${c.name} (${c.total})'.trim()),
                          onPressed: () => _openCategory(c),
                        );
                      },
                    ),
                  ),
                ],
                if (data.announcements.isNotEmpty) ...[
                  const SectionHeader('Pengumuman'),
                  for (final a in data.announcements) _AnnouncementCard(a),
                ],
                if (data.events.isNotEmpty) ...[
                  const SectionHeader('Agenda'),
                  for (final e in data.events) _EventTile(e),
                ],
                if (data.reports.isNotEmpty) ...[
                  SectionHeader('Laporan warga terbaru', actionLabel: 'Lihat semua', onAction: widget.onOpenReports),
                  for (final r in data.reports) _ReportTile(r, onTap: widget.onOpenReports),
                ],
                SectionHeader('Usaha terpopuler', actionLabel: 'Lihat semua', onAction: widget.onOpenBusinesses),
                if (data.businesses.isEmpty)
                  const EmptyState('Belum ada usaha terdaftar.')
                else
                  for (final b in data.businesses) _BusinessTile(b, onTap: () => _openBusiness(b)),
                const SizedBox(height: 24),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _Hero extends StatelessWidget {
  const _Hero({required this.data});

  final HomeData data;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(20, MediaQuery.of(context).padding.top + 28, 20, 72),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFF0B2A4A), Color(0xFF14507A), Color(0xFFE9824A)],
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.16),
              borderRadius: BorderRadius.circular(999),
            ),
            child: const Text(
              'PORTAL WARGA',
              style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700, letterSpacing: 1),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            data.communityName,
            style: const TextStyle(color: Colors.white, fontSize: 30, fontWeight: FontWeight.w800),
          ),
          if (data.communityDescription != null) ...[
            const SizedBox(height: 8),
            Text(data.communityDescription!, style: const TextStyle(color: Colors.white, fontSize: 16)),
          ],
          const SizedBox(height: 16),
          Text(
            '${data.businessCount} usaha & jasa  ·  ${data.events.length} agenda mendatang',
            style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}

class _QuickActions extends StatelessWidget {
  const _QuickActions({
    required this.onOpenBusinesses,
    required this.onCreateReport,
    required this.onOpenReports,
  });

  final VoidCallback onOpenBusinesses;
  final VoidCallback onCreateReport;
  final VoidCallback onOpenReports;

  @override
  Widget build(BuildContext context) {
    Widget tile(IconData icon, String label, Color bg, Color fg, VoidCallback onTap) {
      return Expanded(
        child: Material(
          color: Colors.white,
          elevation: 2,
          borderRadius: BorderRadius.circular(16),
          child: InkWell(
            borderRadius: BorderRadius.circular(16),
            onTap: onTap,
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 6),
              child: Column(
                children: [
                  CircleAvatar(backgroundColor: bg, child: Icon(icon, color: fg)),
                  const SizedBox(height: 8),
                  Text(label, textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.w700)),
                ],
              ),
            ),
          ),
        ),
      );
    }

    return Transform.translate(
      offset: const Offset(0, -48),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Row(
          children: [
            tile(Icons.storefront, 'Cari usaha', const Color(0xFFDFF3E7), const Color(0xFF0B6B34), onOpenBusinesses),
            const SizedBox(width: 10),
            tile(Icons.flag, 'Buat laporan', const Color(0xFFFDE4EA), const Color(0xFFB4234A), onCreateReport),
            const SizedBox(width: 10),
            tile(Icons.inbox, 'Laporan warga', const Color(0xFFE0ECFF), const Color(0xFF1D4ED8), onOpenReports),
          ],
        ),
      ),
    );
  }
}

class _AnnouncementCard extends StatelessWidget {
  const _AnnouncementCard(this.a);

  final Announcement a;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.fromLTRB(16, 4, 16, 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(a.title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            if (a.publishedAt != null)
              Text(formatDateId(a.publishedAt!), style: const TextStyle(color: Colors.black54, fontSize: 13)),
            const SizedBox(height: 6),
            Text(a.body, style: const TextStyle(fontSize: 16)),
          ],
        ),
      ),
    );
  }
}

class _EventTile extends StatelessWidget {
  const _EventTile(this.e);

  final EventItem e;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.fromLTRB(16, 4, 16, 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            DateBadge(e.startsAt),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(e.title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
                  Text(formatEventTime(e.startsAt), style: const TextStyle(color: Colors.black54, fontSize: 13)),
                  if (e.locationText != null)
                    Text(e.locationText!, style: const TextStyle(color: Colors.black54, fontSize: 13)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ReportTile extends StatelessWidget {
  const _ReportTile(this.r, {required this.onTap});

  final PublicReport r;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.fromLTRB(16, 4, 16, 8),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(child: Text(reportCategoryLabel(r.category), style: const TextStyle(color: brandColor, fontWeight: FontWeight.w700, fontSize: 13))),
                  StatusChip(r.status),
                ],
              ),
              const SizedBox(height: 6),
              Text(r.title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
              Text(r.description, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 15)),
            ],
          ),
        ),
      ),
    );
  }
}

class _BusinessTile extends StatelessWidget {
  const _BusinessTile(this.b, {required this.onTap});

  final Business b;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.fromLTRB(16, 4, 16, 8),
      child: ListTile(
        contentPadding: const EdgeInsets.all(14),
        title: Text(b.name, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        subtitle: Text(
          '${b.categoryName} · ★ ${formatRating(b.ratingAvg)} (${b.ratingCount})',
          style: const TextStyle(fontSize: 15),
        ),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}
