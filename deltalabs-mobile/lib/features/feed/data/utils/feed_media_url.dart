import 'package:deltalabs_mobile/core/config/app_config.dart';

/// Resolves feed `videoSrc` paths to absolute URLs the player can fetch.
String? resolveFeedMediaUrl(String? raw) {
  if (raw == null || raw.trim().isEmpty) return null;
  final value = raw.trim();

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }

  // Seeded mock clips are static files on the Next.js app, not the API host.
  if (value.startsWith('/mock-feed-videos/') || value.startsWith('/mock-feed-audio/')) {
    final base = AppConfig.instance.webAppBaseUrl;
    return '$base$value';
  }

  final cdn = AppConfig.instance.cdnBaseUrl;
  if (value.startsWith('/')) return '$cdn$value';
  return '$cdn/$value';
}
