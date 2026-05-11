import 'package:dartz/dartz.dart';

import 'package:deltalabs_mobile/core/error/failures.dart';

/// Base repository interface.
/// All feature repositories extend this for consistent CRUD contracts.
abstract class Repository<T, ID> {
  Future<Either<Failure, T>> findById(ID id);
  Future<Either<Failure, List<T>>> findAll();
  Future<Either<Failure, T>> save(T entity);
  Future<Either<Failure, void>> delete(ID id);
}

/// Repository with offline-first caching support.
abstract class CachedRepository<T, ID> extends Repository<T, ID> {
  Future<Either<Failure, T>> findByIdCached(ID id);
  Future<Either<Failure, void>> invalidateCache(ID id);
  Future<Either<Failure, void>> clearCache();
}
