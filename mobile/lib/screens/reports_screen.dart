import 'package:material_ui/material_ui.dart';

import '../models/home.dart';
import '../services/api_client.dart';
import '../utils/format.dart';
import '../widgets/common.dart';

/// Laporan warga yang sudah disetujui pengurus, dengan filter status dan jenis (seperti `/laporan` di web).
class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key, required this.api, required this.onCreateReport});

  final ApiClient api;
  final VoidCallback onCreateReport;

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  late Future<ReportsResult> _future;
  String? _status;
  String? _category;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<ReportsResult> _load() => widget.api.listReports(status: _status, category: _category);

  void _reload() {
    setState(() {
      _future = _load();
    });
  }

  Future<void> _refresh() async {
    final next = _load();
    setState(() {
      _future = next;
    });
    try {
      await next;
    } catch (_) {
      // Error ditampilkan oleh FutureBuilder.
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Laporan Warga'),
        actions: [
          TextButton.icon(
            onPressed: widget.onCreateReport,
            icon: const Icon(Icons.add),
            label: const Text('Buat laporan'),
          ),
        ],
      ),
      body: FutureBuilder<ReportsResult>(
        future: _future,
        builder: (context, snapshot) {
          final result = snapshot.data;
          final loading = snapshot.connectionState != ConnectionState.done;
          return Column(
            children: [
              SizedBox(
                height: 52,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                  children: [
                    _chip('Semua${result == null ? '' : ' (${result.total})'}', _status == null, () {
                      _status = null;
                      _reload();
                    }),
                    for (final s in reportStatusLabels.entries)
                      _chip('${s.value}${result == null ? '' : ' (${result.counts[s.key] ?? 0})'}', _status == s.key, () {
                        _status = s.key;
                        _reload();
                      }),
                  ],
                ),
              ),
              SizedBox(
                height: 52,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
                  children: [
                    _chip('Semua jenis', _category == null, () {
                      _category = null;
                      _reload();
                    }),
                    for (final c in reportCategories)
                      _chip(c.label, _category == c.value, () {
                        _category = c.value;
                        _reload();
                      }),
                  ],
                ),
              ),
              Expanded(
                child: loading
                    ? const Center(child: CircularProgressIndicator())
                    : snapshot.hasError
                        ? ErrorState(error: snapshot.error, onRetry: _reload)
                        : RefreshIndicator(
                            onRefresh: _refresh,
                            child: result!.reports.isEmpty
                                ? ListView(children: const [EmptyState('Belum ada laporan yang ditampilkan.')])
                                : ListView.builder(
                                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                                    itemCount: result.reports.length + 1,
                                    itemBuilder: (context, i) {
                                      if (i == result.reports.length) {
                                        return const Padding(
                                          padding: EdgeInsets.only(top: 12),
                                          child: Text(
                                            'Hanya laporan yang sudah diperiksa pengurus yang ditampilkan. Identitas pelapor tidak pernah dipublikasikan.',
                                            style: TextStyle(color: Colors.black54, fontSize: 13),
                                          ),
                                        );
                                      }
                                      return _ReportCard(result.reports[i]);
                                    },
                                  ),
                          ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _chip(String label, bool selected, VoidCallback onTap) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(label: Text(label), selected: selected, onSelected: (_) => onTap()),
    );
  }
}

class _ReportCard extends StatelessWidget {
  const _ReportCard(this.report);

  final PublicReport report;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    reportCategoryLabel(report.category),
                    style: const TextStyle(color: brandColor, fontWeight: FontWeight.w700, fontSize: 13),
                  ),
                ),
                StatusChip(report.status),
              ],
            ),
            const SizedBox(height: 6),
            Text(report.title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text(report.description, style: const TextStyle(fontSize: 16)),
            const SizedBox(height: 8),
            Text(
              [
                if (report.locationText != null) report.locationText!,
                formatDateId(report.createdAt),
              ].join(' · '),
              style: const TextStyle(color: Colors.black54, fontSize: 13),
            ),
          ],
        ),
      ),
    );
  }
}
