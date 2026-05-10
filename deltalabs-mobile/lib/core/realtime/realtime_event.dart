import 'package:freezed_annotation/freezed_annotation.dart';

part 'realtime_event.freezed.dart';
/// Typed realtime event envelope.
/// Manual fromJson/toJson — avoids json_serializable null-aware-elements issue.
@freezed
abstract class RealtimeEvent with _$RealtimeEvent {
  const factory RealtimeEvent({
    required String type,
    required String channel,
    @Default({}) Map<String, dynamic> payload,
    DateTime? timestamp,
  }) = _RealtimeEvent;

  factory RealtimeEvent.fromJson(Map<String, dynamic> json) => RealtimeEvent(
        type: json['type'] as String,
        channel: json['channel'] as String? ?? '',
        payload: (json['payload'] as Map<String, dynamic>?) ?? {},
        timestamp: json['timestamp'] != null
            ? DateTime.tryParse(json['timestamp'] as String)
            : null,
      );
}

/// Well-known realtime event type constants.
abstract class RealtimeEventTypes {
  static const String ping = 'ping';
  static const String pong = 'pong';
  static const String sessionExpired = 'session.expired';
  static const String notification = 'notification.new';
  static const String chatMessage = 'chat.message';
  static const String chatTyping = 'chat.typing';
  static const String presenceJoin = 'presence.join';
  static const String presenceLeave = 'presence.leave';
  static const String liveClassStarted = 'live_class.started';
  static const String liveClassEnded = 'live_class.ended';
  static const String examStarted = 'exam.started';
  static const String examEnded = 'exam.ended';
}
