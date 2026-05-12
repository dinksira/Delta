import 'package:equatable/equatable.dart';

/// Base class for all domain entities.
/// Entities are identified by their [id] and are immutable.
abstract class Entity extends Equatable {
  const Entity({required this.id});

  final String id;

  @override
  List<Object?> get props => [id];
}
