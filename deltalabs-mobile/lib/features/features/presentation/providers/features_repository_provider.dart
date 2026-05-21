import 'package:deltalabs_mobile/core/di/service_locator.dart';
import 'package:deltalabs_mobile/features/features/domain/repositories/features_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final featuresRepositoryProvider = Provider<FeaturesRepository>((ref) {
  return sl<FeaturesRepository>();
});
