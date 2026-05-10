import 'dart:async';
import 'dart:convert';

import 'package:rxdart/rxdart.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

import '../logging/app_logger.dart';
import 'realtime_event.dart';

enum WebSocketState { disconnected, connecting, connected, reconnecting }

/// Manages the WebSocket lifecycle: connect, disconnect, reconnect, and event routing.
/// All incoming events are broadcast on [eventStream] for feature modules to subscribe.
class WebSocketManager {
  WebSocketManager({required this.wsBaseUrl});

  final String wsBaseUrl;

  WebSocketChannel? _channel;
  StreamSubscription<dynamic>? _subscription;
  Timer? _reconnectTimer;
  Timer? _heartbeatTimer;

  int _reconnectAttempts = 0;
  static const int _maxReconnectAttempts = 10;
  static const Duration _heartbeatInterval = Duration(seconds: 30);

  final _stateController = BehaviorSubject<WebSocketState>.seeded(
    WebSocketState.disconnected,
  );
  final _eventController = PublishSubject<RealtimeEvent>();

  Stream<WebSocketState> get stateStream => _stateController.stream;
  Stream<RealtimeEvent> get eventStream => _eventController.stream;
  WebSocketState get currentState => _stateController.value;

  /// Connect to the WebSocket server with an auth token.
  Future<void> connect({required String token}) async {
    if (currentState == WebSocketState.connected ||
        currentState == WebSocketState.connecting) {
      return;
    }

    _stateController.add(WebSocketState.connecting);
    AppLogger.info('WebSocket connecting to $wsBaseUrl');

    try {
      _channel = WebSocketChannel.connect(
        Uri.parse('$wsBaseUrl?token=$token'),
      );

      await _channel!.ready;

      _stateController.add(WebSocketState.connected);
      _reconnectAttempts = 0;
      AppLogger.info('WebSocket connected');

      _startHeartbeat();

      _subscription = _channel!.stream.listen(
        _onMessage,
        onError: _onError,
        onDone: _onDone,
      );
    } catch (e) {
      AppLogger.error('WebSocket connection failed', error: e);
      _stateController.add(WebSocketState.disconnected);
      _scheduleReconnect(token: token);
    }
  }

  void disconnect() {
    _reconnectTimer?.cancel();
    _heartbeatTimer?.cancel();
    _subscription?.cancel();
    _channel?.sink.close();
    _stateController.add(WebSocketState.disconnected);
    AppLogger.info('WebSocket disconnected');
  }

  /// Send a typed event to the server.
  void send(RealtimeEvent event) {
    if (currentState != WebSocketState.connected) {
      AppLogger.warning('WebSocket send attempted while not connected');
      return;
    }
    _channel?.sink.add(jsonEncode(event.toJson()));
  }

  /// Subscribe to events of a specific type.
  Stream<RealtimeEvent> on(String eventType) =>
      eventStream.where((e) => e.type == eventType);

  void _onMessage(dynamic raw) {
    try {
      final json = jsonDecode(raw as String) as Map<String, dynamic>;
      final event = RealtimeEvent.fromJson(json);
      _eventController.add(event);
    } catch (e) {
      AppLogger.warning('Failed to parse WebSocket message', error: e);
    }
  }

  void _onError(Object error) {
    AppLogger.error('WebSocket error', error: error);
    _stateController.add(WebSocketState.disconnected);
  }

  void _onDone() {
    AppLogger.warning('WebSocket connection closed');
    _stateController.add(WebSocketState.disconnected);
    // Reconnect will be triggered by the consumer if needed
  }

  void _startHeartbeat() {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = Timer.periodic(_heartbeatInterval, (_) {
      if (currentState == WebSocketState.connected) {
        _channel?.sink.add(jsonEncode({'type': 'ping'}));
      }
    });
  }

  void _scheduleReconnect({required String token}) {
    if (_reconnectAttempts >= _maxReconnectAttempts) {
      AppLogger.error('WebSocket max reconnect attempts reached');
      return;
    }

    _reconnectAttempts++;
    _stateController.add(WebSocketState.reconnecting);

    // Exponential backoff: 2s, 4s, 8s, ... capped at 60s
    final delay = Duration(
      seconds: (2 * (1 << (_reconnectAttempts - 1))).clamp(2, 60),
    );

    AppLogger.info(
      'WebSocket reconnecting in ${delay.inSeconds}s '
      '(attempt $_reconnectAttempts/$_maxReconnectAttempts)',
    );

    _reconnectTimer = Timer(delay, () => connect(token: token));
  }

  void dispose() {
    disconnect();
    _stateController.close();
    _eventController.close();
  }
}
