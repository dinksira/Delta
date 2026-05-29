import 'package:deltalabs_mobile/features/workspace/data/models/my_school_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/providers/school_providers.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Active (non-archived) schools — prefer [myActiveSchoolsProvider] in new code.
@Deprecated('Use myActiveSchoolsProvider from school_providers.dart')
final mySchoolsProvider = FutureProvider<List<MySchoolModel>>((ref) {
  return ref.watch(myActiveSchoolsProvider.future);
});
