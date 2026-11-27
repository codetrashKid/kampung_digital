import 'package:material_ui/material_ui.dart';

import '../models/home.dart';
import '../services/api_client.dart';
import '../utils/format.dart';

/// Form laporan warga (tanpa login): sama dengan `/lapor` di web. Nama dan nomor HP boleh dikosongkan.
class ReportFormScreen extends StatefulWidget {
  const ReportFormScreen({super.key, required this.api});

  final ApiClient api;

  @override
  State<ReportFormScreen> createState() => _ReportFormScreenState();
}

class _ReportFormScreenState extends State<ReportFormScreen> {
  final _title = TextEditingController();
  final _description = TextEditingController();
  final _location = TextEditingController();
  final _name = TextEditingController();
  final _phone = TextEditingController();

  String? _category;
  List<String> _errors = const [];
  bool _sending = false;
  bool _sent = false;

  @override
  void dispose() {
    _title.dispose();
    _description.dispose();
    _location.dispose();
    _name.dispose();
    _phone.dispose();
    super.dispose();
  }

  void _reset() {
    _title.clear();
    _description.clear();
    _location.clear();
    _name.clear();
    _phone.clear();
    setState(() {
      _category = null;
      _errors = const [];
      _sent = false;
    });
  }

  Future<void> _submit() async {
    final errors = validateReport(
      category: _category,
      title: _title.text,
      description: _description.text,
      locationText: _location.text,
      reporterName: _name.text,
      reporterPhone: _phone.text,
    );
    if (errors.isNotEmpty) {
      setState(() => _errors = errors);
      return;
    }
    setState(() {
      _errors = const [];
      _sending = true;
    });
    try {
      await widget.api.submitReport(ReportDraft(
        category: _category!,
        title: _title.text,
        description: _description.text,
        locationText: _location.text,
        reporterName: _name.text,
        reporterPhone: _phone.text,
      ));
      if (!mounted) return;
      setState(() {
        _sending = false;
        _sent = true;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _sending = false;
        _errors = [e.message];
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Lapor ke Pengurus')),
      body: _sent ? _success() : _form(),
    );
  }

  Widget _success() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.check_circle, size: 72, color: Color(0xFF0B6B34)),
            const SizedBox(height: 12),
            const Text(
              'Terima kasih, laporan Anda sudah terkirim.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'Pengurus akan memeriksanya; laporan baru tampil di daftar laporan warga setelah disetujui pengurus.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 16),
            ),
            const SizedBox(height: 24),
            FilledButton(onPressed: _reset, child: const Text('Kirim laporan lain')),
          ],
        ),
      ),
    );
  }

  Widget _form() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text(
          'Ada jalan rusak, lampu mati, sampah menumpuk, atau hal lain di lingkungan? Tulis di sini, pengurus akan menindaklanjuti.',
          style: TextStyle(fontSize: 16),
        ),
        const SizedBox(height: 16),
        const Text('Jenis laporan *', style: TextStyle(fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 4,
          children: [
            for (final c in reportCategories)
              ChoiceChip(
                label: Text(c.label),
                selected: _category == c.value,
                onSelected: (_) => setState(() => _category = c.value),
              ),
          ],
        ),
        const SizedBox(height: 16),
        _field(_title, 'Judul singkat *', maxLength: 120, hint: 'Contoh: Lampu jalan mati di Gang Melati'),
        _field(_description, 'Ceritakan masalahnya *', maxLength: 2000, lines: 5),
        _field(_location, 'Lokasi', maxLength: 200, hint: 'Contoh: depan rumah No. 5'),
        _field(_name, 'Nama (boleh dikosongkan)', maxLength: 80),
        _field(_phone, 'Nomor HP (boleh dikosongkan)', keyboard: TextInputType.phone, hint: '0812-3456-7890'),
        const Text(
          'Nama dan nomor HP hanya bisa dilihat pengurus, dipakai untuk menindaklanjuti laporan, dan tidak ditampilkan ke publik.',
          style: TextStyle(color: Colors.black54, fontSize: 13),
        ),
        const SizedBox(height: 16),
        if (_errors.isNotEmpty)
          Container(
            margin: const EdgeInsets.only(bottom: 16),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFFDECEA),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFF3C1BD)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                for (final e in _errors) Text('• $e', style: const TextStyle(color: Color(0xFF7A1914), fontSize: 15)),
              ],
            ),
          ),
        SizedBox(
          height: 56,
          child: FilledButton(
            onPressed: _sending ? null : _submit,
            child: Text(_sending ? 'Mengirim…' : 'Kirim laporan', style: const TextStyle(fontSize: 18)),
          ),
        ),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _field(
    TextEditingController controller,
    String label, {
    int? maxLength,
    int lines = 1,
    String? hint,
    TextInputType? keyboard,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: TextField(
        controller: controller,
        maxLength: maxLength,
        minLines: lines,
        maxLines: lines,
        keyboardType: keyboard,
        style: const TextStyle(fontSize: 17),
        decoration: InputDecoration(labelText: label, hintText: hint, border: const OutlineInputBorder()),
      ),
    );
  }
}
