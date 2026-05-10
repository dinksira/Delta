import 'package:freezed_annotation/freezed_annotation.dart';

part 'realtime_event.freezed.dart';
part 'realtime_event.g.dart';

/// Typed realtime event envelope.
/// All WebSocket messages are wrapped in this structure.
@freezed
abstract class RealtimeEvent with _$RealtimeEvent {
  const factory RealtimeEvent({
    required String type,
    required String channel,
    @Default({}) Map<String, dynamic> payload,
    DateTime? timestamp,
  }) = _RealtimeEvent;

  factory RealtimeEvent.fromJson(Map<String, dynamic> json) =>
      _$RealtimeEventFromJson(json);
}

/// Well-known realtime event type constants.
/// Feature modules define their own event types in their domain layer.
abstract class RealtimeEventTypes {
  // System
  static const String ping = 'ping';
  static const String pong = 'pong';
  static const String error = 'error';

  // Auth
  static const String sessionExpired = 'session.expired';
  static const String forceLogout = 'auth.force_logout';

  // Notifications
  static const String notification = 'notification.new';

  // Chat
  static const String chatMessage = 'chat.message';
  static const String chatTyping = 'chat.typing';
  static const String chatRead = 'chat.read';

  // Presence
  static const String presenceJoin = 'presence.join';
  static const String presenceLeave = 'presence.leave';
  static const String presenceUpdate = 'presence.update';

  // Live Class
  static const String liveClassStarted = 'live_class.started';
  static const String liveClassEnded = 'live_class.ended';
  static const String liveClassParticipantJoined = 'live_class.participant_joined';

  // Live Exam
  static const String examStarted = 'exam.started';
  static const String examEnded = 'exam.ended';
  static const String examTimeWarning = 'exam.time_warning';
}
