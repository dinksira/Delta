import 'package:deltalabs_mobile/core/routing/app_routes.dart';
import 'package:flutter/material.dart';

/// Bottom navigation destinations for the School product hub (Phase A).
enum SchoolHubTab {
  home(
    label: 'Home',
    icon: Icons.home_rounded,
    route: AppRoutes.workspaceSchool,
  ),
  offers(
    label: 'Offers',
    icon: Icons.local_offer_outlined,
    route: AppRoutes.workspaceSchoolOffers,
  ),
  marketplace(
    label: 'Market',
    icon: Icons.storefront_outlined,
    route: AppRoutes.workspaceSchoolMarketplace,
  ),
  archive(
    label: 'Archive',
    icon: Icons.archive_outlined,
    route: AppRoutes.workspaceSchoolArchive,
  );

  const SchoolHubTab({
    required this.label,
    required this.icon,
    required this.route,
  });

  final String label;
  final IconData icon;
  final String route;
}
