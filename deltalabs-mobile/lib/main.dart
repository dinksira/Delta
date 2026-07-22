import 'package:deltalabs_mobile/app/app.dart';
import 'package:deltalabs_mobile/bootstrap.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

void main() async {
  await bootstrap(() => const ProviderScope(child: DeltaLabsApp()));
}