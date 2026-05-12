import 'package:flutter/material.dart';

/// DeltaLabs logo — renders the brand image asset.
/// Used on the splash screen and all auth screens.
class DeltaLogo extends StatelessWidget {
  const DeltaLogo({super.key, this.size = 64});

  final double size;

  @override
  Widget build(BuildContext context) {
    return Image.asset(
      'assets/icons/playstore.png',
      width: size,
      height: size,
      fit: BoxFit.contain,
    );
  }
}
