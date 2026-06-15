import 'package:deltalabs_mobile/shared/management_table/data/models/mt_instance_model.dart';
import 'package:deltalabs_mobile/shared/management_table/data/models/mt_row_model.dart';

class MtInstanceBoardState {
  const MtInstanceBoardState({
    this.bundle,
    this.rowsByGroup = const {},
    this.loadedGroups = const {},
    this.loadingGroups = const {},
    this.isLoadingBundle = false,
    this.errorMessage,
  });

  const MtInstanceBoardState.loading()
      : bundle = null,
        rowsByGroup = const {},
        loadedGroups = const {},
        loadingGroups = const {},
        isLoadingBundle = true,
        errorMessage = null;

  final MtInstanceBundleModel? bundle;
  final Map<String, List<MtRowModel>> rowsByGroup;
  final Set<String> loadedGroups;
  final Set<String> loadingGroups;
  final bool isLoadingBundle;
  final String? errorMessage;

  List<MtRowModel> rowsFor(String groupId) => rowsByGroup[groupId] ?? const [];

  bool isGroupLoaded(String groupId) => loadedGroups.contains(groupId);

  bool isGroupLoading(String groupId) => loadingGroups.contains(groupId);

  MtInstanceBoardState copyWith({
    MtInstanceBundleModel? bundle,
    Map<String, List<MtRowModel>>? rowsByGroup,
    Set<String>? loadedGroups,
    Set<String>? loadingGroups,
    bool? isLoadingBundle,
    String? errorMessage,
    bool clearError = false,
  }) {
    return MtInstanceBoardState(
      bundle: bundle ?? this.bundle,
      rowsByGroup: rowsByGroup ?? this.rowsByGroup,
      loadedGroups: loadedGroups ?? this.loadedGroups,
      loadingGroups: loadingGroups ?? this.loadingGroups,
      isLoadingBundle: isLoadingBundle ?? this.isLoadingBundle,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }
}
