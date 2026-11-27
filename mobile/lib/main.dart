import 'package:material_ui/material_ui.dart';

import 'config.dart';
import 'screens/business_list_screen.dart';
import 'services/api_client.dart';
import 'widgets/update_gate.dart';

void main() {
  runApp(KampungDigitalApp(api: ApiClient(baseUrl: apiBaseUrl)));
}

class KampungDigitalApp extends StatelessWidget {
  const KampungDigitalApp({
    super.key,
    required this.api,
    this.currentBuild = appBuildNumber,
    this.platform,
  });

  final ApiClient api;

  /// Nomor build aplikasi untuk pengecekan update (0 = lewati pengecekan).
  final int currentBuild;
  final String? platform;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Kampung Digital',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF1B7F5C)),
        useMaterial3: true,
      ),
      home: UpdateGate(
        api: api,
        currentBuild: currentBuild,
        platform: platform,
        child: BusinessListScreen(api: api),
      ),
    );
  }
}
