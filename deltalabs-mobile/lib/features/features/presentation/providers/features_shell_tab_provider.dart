import 'package:flutter_riverpod/flutter_riverpod.dart';

class FeaturesShellTabState {
  const FeaturesShellTabState({this.selectedCategoryId = 'all'});

  final String selectedCategoryId;

  FeaturesShellTabState copyWith({String? selectedCategoryId}) {
    return FeaturesShellTabState(
      selectedCategoryId: selectedCategoryId ?? this.selectedCategoryId,
    );
  }
}

class FeaturesShellTabNotifier extends Notifier<FeaturesShellTabState> {
  @override
  FeaturesShellTabState build() => const FeaturesShellTabState();

  void select(String categoryId) {
    state = state.copyWith(selectedCategoryId: categoryId);
  }
}

final featuresShellTabProvider =
    NotifierProvider<FeaturesShellTabNotifier, FeaturesShellTabState>(
  FeaturesShellTabNotifier.new,
);
