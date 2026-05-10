import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

/// Wraps a widget in the minimum required providers for testing.
Widget buildTestableWidget(
  Widget widget, {
  List<Override> overrides = const [],
}) {
  return ProviderScope(
    overrides: overrides,
    child: MaterialApp(home: widget),
  );
}

/// Pump a widget with all required wrappers.
Future<void> pumpWidget(
  WidgetTester tester,
  Widget widget, {
  List<Override> overrides = const [],
}) async {
  await tester.pumpWidget(buildTestableWidget(widget, overrides: overrides));
  await tester.pumpAndSettle();
}
