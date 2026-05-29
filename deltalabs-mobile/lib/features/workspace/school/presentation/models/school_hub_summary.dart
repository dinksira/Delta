/// Aggregated counts for the School home dashboard (from live APIs).
class SchoolHubSummary {
  const SchoolHubSummary({
    required this.activeSchools,
    required this.archivedSchools,
    required this.pendingOffers,
    required this.marketplaceListings,
  });

  final int activeSchools;
  final int archivedSchools;
  final int pendingOffers;
  final int marketplaceListings;
}
