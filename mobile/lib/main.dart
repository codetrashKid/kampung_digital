import 'package:flutter/material.dart';

import 'config.dart';
import 'screens/business_list_screen.dart';
import 'services/api_client.dart';

void main() {
  runApp(KampungDigitalApp(api: ApiClient(baseUrl: apiBaseUrl)));
}

class KampungDigitalApp extends StatelessWidget {
  const KampungDigitalApp({super.key, required this.api});

  final ApiClient api;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Kampung Digital',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF1B7F5C)),
        useMaterial3: true,
      ),
      home: BusinessListScreen(api: api),
    );
  }
}
