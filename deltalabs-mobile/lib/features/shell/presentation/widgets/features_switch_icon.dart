import 'package:flutter/material.dart';

/// Panel-style icon (matches web features switch): outline with left rail.
class FeaturesSwitchIcon extends StatelessWidget {
  const FeaturesSwitchIcon({super.key, this.color, this.size = 22});

  final Color? color;
  final double size;

  @override
  Widget build(BuildContext context) {
    final stroke = color ?? const Color(0xFF1A3C4D);

    return SizedBox(
      width: size,
      height: size * 0.82,
      child: CustomPaint(
        painter: _FeaturesSwitchPainter(stroke: stroke),
      ),
    );
  }
}

class _FeaturesSwitchPainter extends CustomPainter {
  _FeaturesSwitchPainter({required this.stroke});

  final Color stroke;

  @override
  void paint(Canvas canvas, Size size) {
    final r = RRect.fromRectAndRadius(
      Rect.fromLTWH(0, 0, size.width, size.height),
      const Radius.circular(3),
    );
    canvas.drawRRect(
      r,
      Paint()
        ..color = stroke
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.6,
    );
    final rail = RRect.fromRectAndRadius(
      Rect.fromLTWH(0, 0, size.width * 0.32, size.height),
      const Radius.circular(2),
    );
    canvas.drawRRect(rail, Paint()..color = stroke);
  }

  @override
  bool shouldRepaint(covariant _FeaturesSwitchPainter oldDelegate) =>
      oldDelegate.stroke != stroke;
}
