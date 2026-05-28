import 'package:deltalabs_mobile/core/di/service_locator.dart';
import 'package:deltalabs_mobile/core/network/api_client.dart';
import 'package:deltalabs_mobile/features/workspace/data/models/my_school_model.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final mySchoolsProvider = FutureProvider<List<MySchoolModel>>((ref) async {
  final client = sl<ApiClient>();
  final response = await client.get<Map<String, dynamic>>('/me/schools');
  final items = response.data?['items'];
  if (items is! List) return [];
  return items
      .whereType<Map<String, dynamic>>()
      .map(MySchoolModel.fromJson)
      .where((s) => !s.archived)
      .toList();
});
