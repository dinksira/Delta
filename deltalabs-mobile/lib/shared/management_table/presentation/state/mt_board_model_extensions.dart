import 'package:deltalabs_mobile/shared/management_table/data/models/mt_column_model.dart';
import 'package:deltalabs_mobile/shared/management_table/data/models/mt_definition_model.dart';
import 'package:deltalabs_mobile/shared/management_table/data/models/mt_instance_model.dart';
import 'package:deltalabs_mobile/shared/management_table/data/models/mt_table_group_model.dart';

String mtPendingId([String prefix = '']) =>
    '__pending_$prefix${DateTime.now().microsecondsSinceEpoch}';

bool mtIsPendingId(String id) => id.startsWith('__pending_');

extension MtDefinitionModelCopy on MtDefinitionModel {
  MtDefinitionModel copyWithColumns(List<MtColumnModel> columns) {
    final sorted = [...columns]..sort((a, b) => a.order.compareTo(b.order));
    return MtDefinitionModel(
      id: id,
      orgId: orgId,
      schoolId: schoolId,
      title: title,
      visibility: visibility,
      sourceDefinitionId: sourceDefinitionId,
      version: version,
      columns: sorted,
      createdByUserId: createdByUserId,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}

extension MtInstanceModelCopy on MtInstanceModel {
  MtInstanceModel copyWithTableGroups(List<MtTableGroupModel> tableGroups) {
    final sorted = [...tableGroups]..sort((a, b) => a.order.compareTo(b.order));
    return MtInstanceModel(
      id: id,
      orgId: orgId,
      schoolId: schoolId,
      definitionId: definitionId,
      definitionVersion: definitionVersion,
      workspaceItemId: workspaceItemId,
      title: title,
      tableGroups: sorted,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}

extension MtInstanceBundleModelCopy on MtInstanceBundleModel {
  MtInstanceBundleModel copyWithDefinition(MtDefinitionModel definition) {
    return MtInstanceBundleModel(instance: instance, definition: definition);
  }

  MtInstanceBundleModel copyWithInstance(MtInstanceModel instance) {
    return MtInstanceBundleModel(instance: instance, definition: definition);
  }
}
