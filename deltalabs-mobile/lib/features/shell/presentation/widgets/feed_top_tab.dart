/// Top feed categories (TikTok-style), shown in the shell header.
enum FeedTopTab { video, audio, ai, simulation, custom }

extension FeedTopTabX on FeedTopTab {
  String get label {
    switch (this) {
      case FeedTopTab.video:
        return 'Video';
      case FeedTopTab.audio:
        return 'Audio';
      case FeedTopTab.ai:
        return 'AI';
      case FeedTopTab.simulation:
        return 'Simulation';
      case FeedTopTab.custom:
        return 'Custom';
    }
  }

  /// Custom tab uses the user's saved label when configured.
  String displayLabel({String? customTabLabel}) {
    if (this != FeedTopTab.custom) return label;
    final trimmed = customTabLabel?.trim();
    if (trimmed == null || trimmed.isEmpty) return label;
    return trimmed.length > 12 ? '${trimmed.substring(0, 12)}…' : trimmed;
  }
}
