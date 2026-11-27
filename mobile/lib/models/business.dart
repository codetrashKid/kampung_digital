/// Usaha lokal, sesuai bentuk respons `GET /api/v1/businesses`.
class Business {
  const Business({
    required this.id,
    required this.slug,
    required this.name,
    required this.categoryName,
    required this.categorySlug,
    this.description,
    this.address,
    this.phoneWa,
    this.ratingAvg = 0,
    this.ratingCount = 0,
  });

  final String id;
  final String slug;
  final String name;
  final String? description;
  final String? address;
  final String? phoneWa;
  final double ratingAvg;
  final int ratingCount;
  final String categoryName;
  final String categorySlug;

  factory Business.fromJson(Map<String, dynamic> json) {
    return Business(
      id: json['id'] as String,
      slug: json['slug'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      address: json['address'] as String?,
      phoneWa: json['phone_wa'] as String?,
      ratingAvg: (json['rating_avg'] as num?)?.toDouble() ?? 0,
      ratingCount: (json['rating_count'] as num?)?.toInt() ?? 0,
      categoryName: json['category_name'] as String,
      categorySlug: json['category_slug'] as String,
    );
  }
}
