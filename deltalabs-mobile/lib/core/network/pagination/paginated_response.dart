import 'package:freezed_annotation/freezed_annotation.dart';

part 'paginated_response.freezed.dart';
part 'paginated_response.g.dart';

/// Generic paginated API response wrapper.
@Freezed(genericArgumentFactories: true)
abstract class PaginatedResponse<T> with _$PaginatedResponse<T> {
  const factory PaginatedResponse({
    required List<T> data,
    required PaginationMeta meta,
  }) = _PaginatedResponse;

  factory PaginatedResponse.fromJson(
    Map<String, dynamic> json,
    T Function(Object?) fromJsonT,
  ) =>
      _$PaginatedResponseFromJson(json, fromJsonT);
}

@freezed
abstract class PaginationMeta with _$PaginationMeta {
  const factory PaginationMeta({
    required int currentPage,
    required int totalPages,
    required int totalItems,
    required int perPage,
    required bool hasNextPage,
    required bool hasPreviousPage,
  }) = _PaginationMeta;

  factory PaginationMeta.fromJson(Map<String, dynamic> json) =>
      _$PaginationMetaFromJson(json);
}

/// Cursor-based pagination params for infinite scroll feeds.
class CursorParams {
  const CursorParams({
    this.cursor,
    this.limit = 20,
  });

  final String? cursor;
  final int limit;

  Map<String, dynamic> toQueryParams() => {
        if (cursor != null) 'cursor': cursor,
        'limit': limit,
      };
}

/// Offset-based pagination params.
class OffsetParams {
  const OffsetParams({
    this.page = 1,
    this.perPage = 20,
  });

  final int page;
  final int perPage;

  Map<String, dynamic> toQueryParams() => {
        'page': page,
        'per_page': perPage,
      };
}
