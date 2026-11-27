import 'business.dart';

/// Model data publik lingkungan (beranda, kategori, laporan, jam buka), sesuai respons `/api/v1`.

DateTime? _date(Object? v) => v is String ? DateTime.tryParse(v) : null;

class Category {
  const Category({
    required this.id,
    required this.slug,
    required this.name,
    this.icon,
    this.total = 0,
  });

  final String id;
  final String slug;
  final String name;
  final String? icon;
  final int total;

  factory Category.fromJson(Map<String, dynamic> json) => Category(
        id: json['id'] as String,
        slug: json['slug'] as String,
        name: json['name'] as String,
        icon: json['icon'] as String?,
        total: (json['total'] as num?)?.toInt() ?? 0,
      );
}

class Announcement {
  const Announcement({required this.id, required this.title, required this.body, this.publishedAt});

  final String id;
  final String title;
  final String body;
  final DateTime? publishedAt;

  factory Announcement.fromJson(Map<String, dynamic> json) => Announcement(
        id: json['id'] as String,
        title: json['title'] as String,
        body: json['body'] as String,
        publishedAt: _date(json['published_at']),
      );
}

class EventItem {
  const EventItem({required this.id, required this.title, required this.startsAt, this.locationText, this.endsAt});

  final String id;
  final String title;
  final String? locationText;
  final DateTime startsAt;
  final DateTime? endsAt;

  factory EventItem.fromJson(Map<String, dynamic> json) => EventItem(
        id: json['id'] as String,
        title: json['title'] as String,
        locationText: json['location_text'] as String?,
        startsAt: DateTime.parse(json['starts_at'] as String),
        endsAt: _date(json['ends_at']),
      );
}

class PublicReport {
  const PublicReport({
    required this.id,
    required this.category,
    required this.title,
    required this.description,
    required this.status,
    required this.createdAt,
    this.locationText,
  });

  final String id;
  final String category;
  final String title;
  final String description;
  final String? locationText;
  final String status;
  final DateTime createdAt;

  factory PublicReport.fromJson(Map<String, dynamic> json) => PublicReport(
        id: json['id'] as String,
        category: json['category'] as String,
        title: json['title'] as String,
        description: json['description'] as String,
        locationText: json['location_text'] as String?,
        status: json['status'] as String,
        createdAt: DateTime.parse(json['created_at'] as String),
      );
}

class ReportsResult {
  const ReportsResult({required this.reports, required this.counts});

  final List<PublicReport> reports;

  /// Jumlah laporan publik per status (`baru`, `diproses`, `selesai`).
  final Map<String, int> counts;

  int get total => counts.values.fold(0, (a, b) => a + b);

  factory ReportsResult.fromJson(Map<String, dynamic> json) => ReportsResult(
        reports: (json['data'] as List<dynamic>)
            .map((e) => PublicReport.fromJson(e as Map<String, dynamic>))
            .toList(),
        counts: (json['counts'] as Map<String, dynamic>? ?? const {})
            .map((k, v) => MapEntry(k, (v as num).toInt())),
      );
}

class HomeData {
  const HomeData({
    required this.communityName,
    required this.businessCount,
    required this.announcements,
    required this.events,
    required this.reports,
    required this.categories,
    required this.businesses,
    this.communityDescription,
  });

  final String communityName;
  final String? communityDescription;
  final int businessCount;
  final List<Announcement> announcements;
  final List<EventItem> events;
  final List<PublicReport> reports;
  final List<Category> categories;
  final List<Business> businesses;

  factory HomeData.fromJson(Map<String, dynamic> json) {
    List<T> list<T>(String key, T Function(Map<String, dynamic>) f) =>
        (json[key] as List<dynamic>? ?? const []).map((e) => f(e as Map<String, dynamic>)).toList();
    final community = json['community'] as Map<String, dynamic>;
    return HomeData(
      communityName: community['name'] as String,
      communityDescription: community['description'] as String?,
      businessCount: ((json['stats'] as Map<String, dynamic>?)?['businesses'] as num?)?.toInt() ?? 0,
      announcements: list('announcements', Announcement.fromJson),
      events: list('events', EventItem.fromJson),
      reports: list('reports', PublicReport.fromJson),
      categories: list('categories', Category.fromJson),
      businesses: list('businesses', Business.fromJson),
    );
  }
}

class BusinessHour {
  const BusinessHour({required this.dayOfWeek, required this.isClosed, this.openTime, this.closeTime});

  /// 0 = Minggu ... 6 = Sabtu.
  final int dayOfWeek;
  final String? openTime;
  final String? closeTime;
  final bool isClosed;

  factory BusinessHour.fromJson(Map<String, dynamic> json) => BusinessHour(
        dayOfWeek: (json['day_of_week'] as num).toInt(),
        openTime: json['open_time'] as String?,
        closeTime: json['close_time'] as String?,
        isClosed: json['is_closed'] as bool? ?? false,
      );
}

class BusinessDetail {
  const BusinessDetail({required this.business, required this.hours});

  final Business business;
  final List<BusinessHour> hours;

  factory BusinessDetail.fromJson(Map<String, dynamic> json) => BusinessDetail(
        business: Business.fromJson(json['business'] as Map<String, dynamic>),
        hours: (json['hours'] as List<dynamic>? ?? const [])
            .map((e) => BusinessHour.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

/// Isian form laporan warga (dikirim ke `POST /api/v1/reports`).
class ReportDraft {
  const ReportDraft({
    required this.category,
    required this.title,
    required this.description,
    this.locationText = '',
    this.reporterName = '',
    this.reporterPhone = '',
  });

  final String category;
  final String title;
  final String description;
  final String locationText;
  final String reporterName;
  final String reporterPhone;

  Map<String, String> toJson() => {
        'category': category,
        'title': title.trim(),
        'description': description.trim(),
        'location_text': locationText.trim(),
        'reporter_name': reporterName.trim(),
        'reporter_phone': reporterPhone.trim(),
      };
}
