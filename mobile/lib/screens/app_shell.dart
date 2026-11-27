import 'package:material_ui/material_ui.dart';

import '../services/api_client.dart';
import 'business_list_screen.dart';
import 'home_screen.dart';
import 'report_form_screen.dart';
import 'reports_screen.dart';

/// Kerangka utama aplikasi: navigasi bawah seperti di web (Beranda, Usaha, Laporan, Lapor).
class AppShell extends StatefulWidget {
  const AppShell({super.key, required this.api});

  final ApiClient api;

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  static const tabHome = 0;
  static const tabBusinesses = 1;
  static const tabReports = 2;
  static const tabReportForm = 3;

  int _index = tabHome;

  void _go(int index) => setState(() => _index = index);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _index,
        children: [
          HomeScreen(
            api: widget.api,
            onOpenBusinesses: () => _go(tabBusinesses),
            onOpenReports: () => _go(tabReports),
            onCreateReport: () => _go(tabReportForm),
          ),
          BusinessListScreen(api: widget.api),
          ReportsScreen(api: widget.api, onCreateReport: () => _go(tabReportForm)),
          ReportFormScreen(api: widget.api),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: _go,
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Beranda'),
          NavigationDestination(icon: Icon(Icons.storefront_outlined), selectedIcon: Icon(Icons.storefront), label: 'Usaha'),
          NavigationDestination(icon: Icon(Icons.flag_outlined), selectedIcon: Icon(Icons.flag), label: 'Laporan'),
          NavigationDestination(icon: Icon(Icons.add_circle_outline), selectedIcon: Icon(Icons.add_circle), label: 'Lapor'),
        ],
      ),
    );
  }
}
