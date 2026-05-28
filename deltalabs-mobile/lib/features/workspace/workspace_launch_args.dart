/// Arguments passed when opening a feature workspace from the hub.
class WorkspaceLaunchArgs {
  const WorkspaceLaunchArgs({
    required this.featureKey,
    required this.displayTitle,
    this.webRoutePath,
  });

  final String featureKey;
  final String displayTitle;
  final String? webRoutePath;
}
