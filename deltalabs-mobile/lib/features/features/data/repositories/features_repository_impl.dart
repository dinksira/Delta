import 'package:deltalabs_mobile/core/error/error_handler.dart';
import 'package:deltalabs_mobile/features/features/data/data_sources/features_layout_local_store.dart';
import 'package:deltalabs_mobile/features/features/data/data_sources/features_remote_data_source.dart';
import 'package:deltalabs_mobile/features/features/domain/entities/feature.dart';
import 'package:deltalabs_mobile/features/features/domain/entities/features_layout.dart';
import 'package:deltalabs_mobile/features/features/domain/repositories/features_repository.dart';
import 'package:dio/dio.dart';

class FeaturesRepositoryImpl implements FeaturesRepository {
  FeaturesRepositoryImpl({
    required FeaturesRemoteDataSource remote,
    required FeaturesLayoutLocalStore localStore,
  })  : _remote = remote,
        _localStore = localStore;

  final FeaturesRemoteDataSource _remote;
  final FeaturesLayoutLocalStore _localStore;

  static bool _layoutApiUnavailable(Object e) {
    if (e is DioException) {
      final status = e.response?.statusCode;
      return status == 405 || status == 404 || status == 501;
    }
    return false;
  }

  @override
  Future<List<Feature>> fetchFeatures() async {
    try {
      final models = await _remote.fetchFeatures();
      return models.map((m) => m.toEntity()).toList();
    } catch (e, st) {
      throw ErrorHandler.fromObject(e, st);
    }
  }

  @override
  Future<FeaturesLayout> fetchLayout() async {
    try {
      final model = await _remote.fetchLayout();
      await _localStore.save(
        orderKeys: model.orderKeys,
        hiddenKeys: model.hiddenKeys,
        labels: model.labels,
      );
      return model.toEntity();
    } catch (e, st) {
      final cached = await _localStore.load();
      if (cached != null) return cached.toEntity();
      if (_layoutApiUnavailable(e)) return FeaturesLayout.empty;
      throw ErrorHandler.fromObject(e, st);
    }
  }

  @override
  Future<FeaturesLayout> saveLayout({
    required List<String> orderKeys,
    required List<String> hiddenKeys,
    required Map<String, String> labels,
  }) async {
    try {
      final model = await _remote.upsertLayout(
        orderKeys: orderKeys,
        hiddenKeys: hiddenKeys,
        labels: labels,
      );
      await _localStore.save(
        orderKeys: model.orderKeys,
        hiddenKeys: model.hiddenKeys,
        labels: model.labels,
      );
      return model.toEntity();
    } catch (e, st) {
      if (_layoutApiUnavailable(e)) {
        final local = await _localStore.save(
          orderKeys: orderKeys,
          hiddenKeys: hiddenKeys,
          labels: labels,
        );
        return local.toEntity();
      }
      throw ErrorHandler.fromObject(e, st);
    }
  }
}
