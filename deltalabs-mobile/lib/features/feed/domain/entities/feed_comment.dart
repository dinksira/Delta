import 'package:deltalabs_mobile/core/domain/entity.dart';

/// A comment on a feed clip.
class FeedComment extends Entity {
  const FeedComment({
    required super.id,
    required this.userId,
    required this.userName,
    required this.body,
    required this.createdAt,
  });

  final String userId;
  final String userName;
  final String body;
  final DateTime createdAt;

  @override
  List<Object?> get props => [id, userId, userName, body, createdAt];
}
