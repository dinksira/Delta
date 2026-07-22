import 'package:deltalabs_mobile/shared/management_table/data/management_table_remote_data_source.dart';
import 'package:deltalabs_mobile/shared/management_table/data/models/mt_column_model.dart';
import 'package:deltalabs_mobile/shared/management_table/data/models/mt_column_type.dart';
import 'package:deltalabs_mobile/shared/management_table/data/models/mt_definition_model.dart';
import 'package:deltalabs_mobile/shared/management_table/data/models/mt_row_model.dart';
import 'package:deltalabs_mobile/shared/management_table/data/models/mt_table_group_model.dart';
import 'package:deltalabs_mobile/shared/management_table/presentation/providers/management_table_providers.dart';
import 'package:deltalabs_mobile/shared/management_table/presentation/state/mt_board_model_extensions.dart';
import 'package:deltalabs_mobile/shared/management_table/presentation/state/mt_instance_board_state.dart';
import 'package:deltalabs_mobile/shared/management_table/presentation/utils/mt_cell_value.dart';
import 'package:deltalabs_mobile/shared/management_table/presentation/utils/mt_column_type_meta.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Live board session: optimistic UI first, API sync in background.
class MtInstanceBoardController extends ChangeNotifier {
  MtInstanceBoardController({
    required Ref ref,
    required MtInstanceQuery query,
  })  : _ref = ref,
        _query = query {
    _loadBundle();
  }

  final Ref _ref;
  final MtInstanceQuery _query;

  MtInstanceBoardState _state = const MtInstanceBoardState.loading();
  MtInstanceBoardState get state => _state;

  void _emit(MtInstanceBoardState next) {
    _state = next;
    notifyListeners();
  }

  ManagementTableRemoteDataSource get _ds =>
      _ref.read(managementTableRemoteDataSourceProvider);

  Future<void> refresh() => _loadBundle(reloadRows: true);

  Future<void> _loadBundle({bool reloadRows = false}) async {
    _emit(_state.copyWith(isLoadingBundle: _state.bundle == null, clearError: true));
    try {
      final bundle = await _ds.fetchInstanceBundle(
        orgId: _query.orgId,
        schoolId: _query.schoolId,
        instanceId: _query.instanceId,
      );
      var next = _state.copyWith(
        bundle: bundle,
        isLoadingBundle: false,
        clearError: true,
      );
      if (reloadRows) {
        next = next.copyWith(
          rowsByGroup: const {},
          loadedGroups: const {},
          loadingGroups: const {},
        );
      }
      _emit(next);
      if (reloadRows) {
        for (final group in bundle.instance.tableGroups) {
          await ensureGroupRows(group.id);
        }
      }
    } catch (_) {
      _emit(
        _state.copyWith(
          isLoadingBundle: false,
          errorMessage: 'Could not load table.',
        ),
      );
    }
  }

  Future<void> ensureGroupRows(String groupId) async {
    if (_state.isGroupLoaded(groupId) || _state.isGroupLoading(groupId)) return;
    _emit(
      _state.copyWith(
        loadingGroups: {..._state.loadingGroups, groupId},
      ),
    );
    try {
      final page = await _ds.fetchRows(
        orgId: _query.orgId,
        schoolId: _query.schoolId,
        instanceId: _query.instanceId,
        groupId: groupId,
      );
      _emit(
        _state.copyWith(
          rowsByGroup: {..._state.rowsByGroup, groupId: page.items},
          loadedGroups: {..._state.loadedGroups, groupId},
          loadingGroups: {..._state.loadingGroups}..remove(groupId),
        ),
      );
    } catch (_) {
      _emit(
        _state.copyWith(
          loadingGroups: {..._state.loadingGroups}..remove(groupId),
          rowsByGroup: {..._state.rowsByGroup, groupId: const []},
          loadedGroups: {..._state.loadedGroups, groupId},
        ),
      );
    }
  }

  Future<void> addRow(String groupId) async {
    final bundle = _state.bundle;
    if (bundle == null) return;

    final previous = List<MtRowModel>.from(_state.rowsFor(groupId));
    final pendingId = mtPendingId('row_');
    final pending = MtRowModel(
      id: pendingId,
      instanceId: _query.instanceId,
      groupId: groupId,
      position: previous.length,
      cells: const {},
      createdAt: '',
      updatedAt: '',
    );
    _emit(
      _state.copyWith(
        rowsByGroup: {..._state.rowsByGroup, groupId: [...previous, pending]},
        loadedGroups: {..._state.loadedGroups, groupId},
      ),
    );

    try {
      final created = await _ds.createRow(
        orgId: _query.orgId,
        schoolId: _query.schoolId,
        instanceId: _query.instanceId,
        groupId: groupId,
      );
      _emit(
        _state.copyWith(
          rowsByGroup: {
            ..._state.rowsByGroup,
            groupId: _state.rowsFor(groupId).map((row) {
              return row.id == pendingId ? created : row;
            }).toList(),
          },
        ),
      );
    } catch (_) {
      _emit(_state.copyWith(rowsByGroup: {..._state.rowsByGroup, groupId: previous}));
      rethrow;
    }
  }

  Future<void> patchCell({
    required String groupId,
    required MtRowModel row,
    required MtColumnModel column,
    required Object? rawValue,
  }) async {
    final normalized = normalizeMtCellValue(column.type, rawValue);
    if (mtCellValuesEqual(column.type, normalized, row.cellValue(column.id))) {
      return;
    }

    final previous = List<MtRowModel>.from(_state.rowsFor(groupId));
    _emit(
      _state.copyWith(
        rowsByGroup: {
          ..._state.rowsByGroup,
          groupId: previous
              .map(
                (item) => item.id == row.id
                    ? item.copyWithCells({column.id: normalized})
                    : item,
              )
              .toList(),
        },
      ),
    );

    if (mtIsPendingId(row.id)) return;

    try {
      final updated = await _ds.patchRowCells(
        orgId: _query.orgId,
        schoolId: _query.schoolId,
        instanceId: _query.instanceId,
        rowId: row.id,
        cells: {column.id: normalized},
      );
      _emit(
        _state.copyWith(
          rowsByGroup: {
            ..._state.rowsByGroup,
            groupId: _state.rowsFor(groupId).map((item) {
              return item.id == updated.id ? updated : item;
            }).toList(),
          },
        ),
      );
    } catch (_) {
      _emit(_state.copyWith(rowsByGroup: {..._state.rowsByGroup, groupId: previous}));
      rethrow;
    }
  }

  Future<void> appendColumn(
    MtColumnType type, {
    String? title,
    Map<String, dynamic>? settings,
  }) async {
    final bundle = _state.bundle;
    if (bundle == null) return;

    final definition = bundle.definition;
    final pendingId = mtPendingId('col_');
    final resolvedSettings = settings ?? defaultSettingsForColumnType(type);
    final pending = MtColumnModel(
      id: pendingId,
      title: (title?.trim().isNotEmpty ?? false)
          ? title!.trim()
          : defaultTitleForColumnType(type),
      type: type,
      order: definition.columns.length,
      settings: Map<String, dynamic>.from(resolvedSettings),
    );
    final previousBundle = bundle;
    _applyDefinition(definition.copyWithColumns([...definition.columns, pending]));

    try {
      final serverDef = await _ds.appendColumn(
        orgId: _query.orgId,
        schoolId: _query.schoolId,
        definitionId: definition.id,
        title: pending.title,
        type: type,
        settings: pending.settings,
      );
      _applyDefinition(serverDef);
    } catch (_) {
      _emit(_state.copyWith(bundle: previousBundle));
      rethrow;
    }
  }

  Future<void> renameColumn(MtColumnModel column, String title) async {
    final bundle = _state.bundle;
    if (bundle == null) return;

    final trimmed = title.trim();
    if (trimmed.isEmpty || trimmed == column.title) return;

    final previousBundle = bundle;
    final definition = bundle.definition;
    _applyDefinition(
      definition.copyWithColumns(
        definition.columns
            .map(
              (col) => col.id == column.id
                  ? MtColumnModel(
                      id: col.id,
                      title: trimmed,
                      type: col.type,
                      order: col.order,
                      settings: col.settings,
                    )
                  : col,
            )
            .toList(),
      ),
    );

    if (mtIsPendingId(column.id)) return;

    try {
      final serverDef = await _ds.patchColumn(
        orgId: _query.orgId,
        schoolId: _query.schoolId,
        definitionId: definition.id,
        columnId: column.id,
        title: trimmed,
      );
      _applyDefinition(serverDef);
    } catch (_) {
      _emit(_state.copyWith(bundle: previousBundle));
      rethrow;
    }
  }

  Future<void> deleteColumn(MtColumnModel column) async {
    final bundle = _state.bundle;
    if (bundle == null) return;

    final previousBundle = bundle;
    final definition = bundle.definition;
    _applyDefinition(
      definition.copyWithColumns(
        definition.columns.where((col) => col.id != column.id).toList(),
      ),
    );

    if (mtIsPendingId(column.id)) return;

    try {
      final serverDef = await _ds.deleteColumn(
        orgId: _query.orgId,
        schoolId: _query.schoolId,
        definitionId: definition.id,
        columnId: column.id,
      );
      _applyDefinition(serverDef);
    } catch (_) {
      _emit(_state.copyWith(bundle: previousBundle));
      rethrow;
    }
  }

  Future<void> addTableGroup(String title) async {
    final bundle = _state.bundle;
    if (bundle == null) return;

    final trimmed = title.trim();
    if (trimmed.isEmpty) return;

    final instance = bundle.instance;
    final pendingId = mtPendingId('grp_');
    final pending = MtTableGroupModel(
      id: pendingId,
      title: trimmed,
      order: instance.tableGroups.length,
    );
    final previousBundle = bundle;
    _emit(
      _state.copyWith(
        bundle: bundle.copyWithInstance(
          instance.copyWithTableGroups([...instance.tableGroups, pending]),
        ),
        rowsByGroup: {..._state.rowsByGroup, pendingId: const []},
        loadedGroups: {..._state.loadedGroups, pendingId},
      ),
    );

    try {
      final created = await _ds.createTableGroup(
        orgId: _query.orgId,
        schoolId: _query.schoolId,
        instanceId: _query.instanceId,
        title: trimmed,
      );
      final groups = _state.bundle!.instance.tableGroups
          .map((g) => g.id == pendingId ? created : g)
          .toList();
      final rows = Map<String, List<MtRowModel>>.from(_state.rowsByGroup);
      if (rows.containsKey(pendingId)) {
        rows[created.id] = rows.remove(pendingId)!;
      }
      final loaded = Set<String>.from(_state.loadedGroups)
        ..remove(pendingId)
        ..add(created.id);
      _emit(
        _state.copyWith(
          bundle: _state.bundle!.copyWithInstance(
            instance.copyWithTableGroups(groups),
          ),
          rowsByGroup: rows,
          loadedGroups: loaded,
        ),
      );
    } catch (_) {
      _emit(_state.copyWith(bundle: previousBundle));
      rethrow;
    }
  }

  void _applyDefinition(MtDefinitionModel definition) {
    final bundle = _state.bundle;
    if (bundle == null) return;
    _emit(_state.copyWith(bundle: bundle.copyWithDefinition(definition)));
  }
}
