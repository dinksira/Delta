import 'package:deltalabs_mobile/core/network/api_client.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/data_sources/school_remote_data_source.dart';
import 'package:deltalabs_mobile/shared/management_table/data/models/mt_column_type.dart';
import 'package:deltalabs_mobile/shared/management_table/data/models/mt_definition_model.dart';
import 'package:deltalabs_mobile/shared/management_table/data/models/mt_instance_model.dart';
import 'package:deltalabs_mobile/shared/management_table/data/models/mt_row_model.dart';
import 'package:deltalabs_mobile/shared/management_table/data/models/mt_table_group_model.dart';

typedef MtOrgSchoolScope = ({String orgId, String schoolId});

class ManagementTableRemoteDataSource {
  ManagementTableRemoteDataSource({
    required ApiClient apiClient,
    required SchoolRemoteDataSource schoolDataSource,
  })  : _api = apiClient,
        _school = schoolDataSource;

  final ApiClient _api;
  final SchoolRemoteDataSource _school;

  Future<MtInstanceBundleModel> fetchInstanceBundle({
    required String orgId,
    required String schoolId,
    required String instanceId,
  }) async {
    return _withOrg(orgId, () async {
      final response = await _api.get<Map<String, dynamic>>(
        '/orgs/$orgId/schools/$schoolId/management-tables/instances/$instanceId',
      );
      return MtInstanceBundleModel.fromJson(response.data ?? {});
    });
  }

  Future<MtRowListModel> fetchRows({
    required String orgId,
    required String schoolId,
    required String instanceId,
    required String groupId,
    int page = 1,
    int pageSize = 500,
  }) async {
    return _withOrg(orgId, () async {
      final response = await _api.get<Map<String, dynamic>>(
        '/orgs/$orgId/schools/$schoolId/management-tables/instances/$instanceId/rows',
        queryParameters: {
          'page': page,
          'pageSize': pageSize,
          'groupId': groupId,
        },
      );
      return MtRowListModel.fromJson(response.data ?? {});
    });
  }

  Future<MtRowModel> createRow({
    required String orgId,
    required String schoolId,
    required String instanceId,
    required String groupId,
  }) async {
    return _withOrg(orgId, () async {
      final response = await _api.post<Map<String, dynamic>>(
        '/orgs/$orgId/schools/$schoolId/management-tables/instances/$instanceId/rows',
        queryParameters: {'groupId': groupId},
      );
      return MtRowModel.fromJson(response.data ?? {});
    });
  }

  Future<MtRowModel> patchRowCells({
    required String orgId,
    required String schoolId,
    required String instanceId,
    required String rowId,
    required Map<String, dynamic> cells,
  }) async {
    return _withOrg(orgId, () async {
      final response = await _api.patch<Map<String, dynamic>>(
        '/orgs/$orgId/schools/$schoolId/management-tables/instances/$instanceId/rows/$rowId',
        data: {'cells': cells},
      );
      return MtRowModel.fromJson(response.data ?? {});
    });
  }

  Future<MtDefinitionModel> appendColumn({
    required String orgId,
    required String schoolId,
    required String definitionId,
    required String title,
    required MtColumnType type,
    Map<String, dynamic>? settings,
  }) async {
    return _withOrg(orgId, () async {
      final response = await _api.post<Map<String, dynamic>>(
        '/orgs/$orgId/schools/$schoolId/management-tables/definitions/$definitionId/columns',
        data: {
          'title': title,
          'type': type.apiValue,
          if (settings != null) 'settings': settings,
        },
      );
      return MtDefinitionModel.fromJson(response.data ?? {});
    });
  }

  Future<MtDefinitionModel> patchColumn({
    required String orgId,
    required String schoolId,
    required String definitionId,
    required String columnId,
    required String title,
  }) async {
    return _withOrg(orgId, () async {
      final response = await _api.patch<Map<String, dynamic>>(
        '/orgs/$orgId/schools/$schoolId/management-tables/definitions/$definitionId/columns/$columnId',
        data: {'title': title},
      );
      return MtDefinitionModel.fromJson(response.data ?? {});
    });
  }

  Future<MtDefinitionModel> deleteColumn({
    required String orgId,
    required String schoolId,
    required String definitionId,
    required String columnId,
  }) async {
    return _withOrg(orgId, () async {
      final response = await _api.delete<Map<String, dynamic>>(
        '/orgs/$orgId/schools/$schoolId/management-tables/definitions/$definitionId/columns/$columnId',
      );
      return MtDefinitionModel.fromJson(response.data ?? {});
    });
  }

  Future<MtTableGroupModel> createTableGroup({
    required String orgId,
    required String schoolId,
    required String instanceId,
    required String title,
  }) async {
    return _withOrg(orgId, () async {
      final response = await _api.post<Map<String, dynamic>>(
        '/orgs/$orgId/schools/$schoolId/management-tables/instances/$instanceId/table-groups',
        data: {'title': title},
      );
      return MtTableGroupModel.fromJson(response.data ?? {});
    });
  }

  Future<MtInstanceBundleModel> bootstrapWorkspaceItem({
    required String orgId,
    required String schoolId,
    required String workspaceItemId,
  }) async {
    return _withOrg(orgId, () async {
      final response = await _api.post<Map<String, dynamic>>(
        '/orgs/$orgId/schools/$schoolId/workspace/items/$workspaceItemId/management-table/bootstrap',
      );
      final data = response.data ?? {};
      return MtInstanceBundleModel.fromJson({
        'instance': data['instance'],
        'definition': data['definition'],
      });
    });
  }

  Future<T> _withOrg<T>(String orgId, Future<T> Function() action) async {
    await _school.ensureOrgMembership(orgId);
    return action();
  }
}
