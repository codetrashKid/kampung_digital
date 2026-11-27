/// Hasil pengecekan versi dari `GET /api/v1/app-version`.
class UpdateStatus {
  const UpdateStatus({
    required this.updateAvailable,
    required this.updateRequired,
    this.latestVersion,
    this.latestBuild,
    this.url,
    this.notes,
  });

  /// Tidak ada pembaruan.
  static const none = UpdateStatus(updateAvailable: false, updateRequired: false);

  final bool updateAvailable;

  /// true: aplikasi tidak boleh dipakai sebelum diperbarui.
  final bool updateRequired;
  final String? latestVersion;
  final int? latestBuild;
  final String? url;
  final String? notes;

  factory UpdateStatus.fromJson(Map<String, dynamic> json) {
    final latest = json['latest'] as Map<String, dynamic>?;
    return UpdateStatus(
      updateAvailable: json['update_available'] as bool? ?? false,
      updateRequired: json['update_required'] as bool? ?? false,
      latestVersion: latest?['version'] as String?,
      latestBuild: (latest?['build'] as num?)?.toInt(),
      url: latest?['url'] as String?,
      notes: latest?['notes'] as String?,
    );
  }
}
