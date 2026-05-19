import 'package:deltalabs_mobile/features/feed/domain/entities/feed_comment.dart';
import 'package:deltalabs_mobile/features/feed/presentation/providers/feed_repository_provider.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'feed_comments_provider.g.dart';

@riverpod
Future<List<FeedComment>> feedComments(Ref ref, String itemId) async {
  final result = await ref.read(feedRepositoryProvider).getComments(itemId);
  return result.fold(
    (failure) => throw Exception(failure.message),
    (comments) => comments,
  );
}
