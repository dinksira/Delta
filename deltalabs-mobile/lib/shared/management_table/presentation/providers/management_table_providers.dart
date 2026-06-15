import 'package:deltalabs_mobile/core/di/service_locator.dart';
import 'package:deltalabs_mobile/core/network/api_client.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/providers/school_providers.dart';
import 'package:deltalabs_mobile/shared/management_table/data/management_table_remote_data_source.dart';
import 'package:deltalabs_mobile/shared/management_table/data/models/mt_instance_model.dart';
import 'package:deltalabs_mobile/shared/management_table/data/models/mt_row_model.dart';
import 'package:deltalabs_mobile/shared/management_table/presentation/state/mt_instance_board_controller.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final managementTableRemoteDataSourceProvider =
    Provider<ManagementTableRemoteDataSource>((ref) {
  return ManagementTableRemoteDataSource(
    apiClient: sl<ApiClient>(),
    schoolDataSource: ref.watch(schoolRemoteDataSourceProvider),
  );
});

typedef MtInstanceQuery = ({
  String orgId,
  String schoolId,
  String instanceId,
});

typedef MtRowsQuery = ({
  String orgId,
  String schoolId,
  String instanceId,
  String groupId,
});

/// Live board session with optimistic mutations (preferred for editor UI).
final mtInstanceBoardProvider = Provider.autoDispose
    .family<MtInstanceBoardController, MtInstanceQuery>((Ref ref, MtInstanceQuery query) {
  final controller = MtInstanceBoardController(ref: ref, query: query);
  ref.onDispose(controller.dispose);
  return controller;
});

/// Read-only fetch helpers (legacy / refresh fallbacks).
final managementTableBundleProvider =
    FutureProvider.family<MtInstanceBundleModel, MtInstanceQuery>((ref, query) {
  return ref.read(managementTableRemoteDataSourceProvider).fetchInstanceBundle(
        orgId: query.orgId,
        schoolId: query.schoolId,
        instanceId: query.instanceId,
      );
});

final managementTableRowsProvider =
    FutureProvider.family<MtRowListModel, MtRowsQuery>((ref, query) {
  return ref.read(managementTableRemoteDataSourceProvider).fetchRows(
        orgId: query.orgId,
        schoolId: query.schoolId,
        instanceId: query.instanceId,
        groupId: query.groupId,
      );
});
