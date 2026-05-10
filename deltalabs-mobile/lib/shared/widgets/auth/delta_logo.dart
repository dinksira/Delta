import 'dart:math' as math;
import 'package:flutter/material.dart';

/// DeltaLabs 3D cube logo — recreated with CustomPainter.
/// Matches the isometric cube shown in all auth screens.
class DeltaLogo extends StatelessWidget {
  const DeltaLogo({super.key, this.size = 64});

  final double size;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _CubePainter(),
      ),
    );
  }
}

class _CubePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // Isometric cube — 3 visible faces
    // Top face (light grey/white)
    final topPath = Path()
      ..moveTo(w * 0.5, h * 0.08)
      ..lineTo(w * 0.92, h * 0.30)
      ..lineTo(w * 0.5, h * 0.52)
      ..lineTo(w * 0.08, h * 0.30)
      ..close();

    // Left face (medium grey)
    final leftPath = Path()
      ..moveTo(w * 0.08, h * 0.30)
      ..lineTo(w * 0.5, h * 0.52)
      ..lineTo(w * 0.5, h * 0.92)
      ..lineTo(w * 0.08, h * 0.70)
      ..close();

    // Right face (dark — near black with teal tint)
    final rightPath = Path()
      ..moveTo(w * 0.5, h * 0.52)
      ..lineTo(w * 0.92, h * 0.30)
      ..lineTo(w * 0.92, h * 0.70)
      ..lineTo(w * 0.5, h * 0.92)
      ..close();

    // Top face gradient (light blue-grey to white)
    final topPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [
          const Color(0xFFD0DCE8),
          const Color(0xFFEEF3F8),
        ],
      ).createShader(Rect.fromLTWH(0, 0, w, h));

    // Left face gradient (mid grey)
    final leftPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          const Color(0xFFB0C4D4),
          const Color(0xFF8AAABB),
        ],
      ).createShader(Rect.fromLTWH(0, 0, w, h));

    // Right face (dark teal-black)
    final rightPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topRight,
        end: Alignment.bottomLeft,
        colors: [
          const Color(0xFF1A2A35),
          const Color(0xFF0D1A22),
        ],
      ).createShader(Rect.fromLTWH(0, 0, w, h));

    canvas.drawPath(topPath, topPaint);
    canvas.drawPath(leftPath, leftPaint);
    canvas.drawPath(rightPath, rightPaint);

    // Small teal accent rectangle on right face (the "screen" detail)
    final accentRect = RRect.fromRectAndRadius(
      Rect.fromLTWH(w * 0.56, h * 0.58, w * 0.20, h * 0.12),
      const Radius.circular(2),
    );
    canvas.drawRRect(
      accentRect,
      Paint()..color = const Color(0xFF1A6B8A),
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
