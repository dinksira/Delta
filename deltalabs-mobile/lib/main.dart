import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import 'package:deltalabs_mobile/bootstrap.dart';
import 'package:deltalabs_mobile/app/app.dart';

void main() async {
  await bootstrap(() => const ProviderScope(child: DeltaLabsApp()));
}
