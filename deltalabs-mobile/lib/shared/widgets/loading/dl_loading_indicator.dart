import 'dart:math' as math;

import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/shared/widgets/auth/delta_logo.dart';
import 'package:flutter/material.dart';

/// Branded DeltaLabs loading indicator — use instead of [CircularProgressIndicator].
class DlLoadingIndicator extends StatefulWidget {
  const DlLoadingIndicator({
    super.key,
    this.size = DlLoadingSize.medium,
    this.onDark = true,
    this.showLogo = true,
  });

  final DlLoadingSize size;
  final bool onDark;
  final bool showLogo;

  @override
  State<DlLoadingIndicator> createState() => _DlLoadingIndicatorState();
}

enum DlLoadingSize {
  small(36),
  medium(52),
  large(72);

  const DlLoadingSize(this.pixels);
  final double pixels;
}

class _DlLoadingIndicatorState extends State<DlLoadingIndicator>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final px = widget.size.pixels;
    final ringColor = widget.onDark ? Colors.white : AppColors.primary;
    final trackColor = widget.onDark
        ? Colors.white.withValues(alpha: 0.2)
        : const Color(0xFFD4E0E8);
    final stroke = widget.onDark ? 2.5 : 3.0;

    return SizedBox(
      width: px,
      height: px,
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          return CustomPaint(
            painter: _DlRingPainter(
              progress: _controller.value,
              ringColor: ringColor,
              trackColor: trackColor,
              stroke: stroke,
            ),
            child: child,
          );
        },
        child: widget.showLogo
            ? Center(
                child: Opacity(
                  opacity: 0.85 + 0.15 * math.sin(_controller.value * math.pi * 2),
                  child: DeltaLogo(size: px * 0.42),
                ),
              )
            : null,
      ),
    );
  }
}

class _DlRingPainter extends CustomPainter {
  _DlRingPainter({
    required this.progress,
    required this.ringColor,
    required this.trackColor,
    this.stroke = 2.5,
  });

  final double progress;
  final Color ringColor;
  final Color trackColor;
  final double stroke;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.shortestSide / 2 - stroke;

    final track = Paint()
      ..color = trackColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.round;

    canvas.drawCircle(center, radius, track);

    final sweep = math.pi * 1.5;
    final start = progress * math.pi * 2;

    final arc = Paint()
      ..color = ringColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.round;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      start,
      sweep,
      false,
      arc,
    );
  }

  @override
  bool shouldRepaint(covariant _DlRingPainter oldDelegate) =>
      oldDelegate.progress != progress ||
      oldDelegate.ringColor != ringColor ||
      oldDelegate.stroke != stroke;
}

/// Thin inline loading line — use for save/action progress across the app.
class DlLinearLoadingBar extends StatefulWidget {
  const DlLinearLoadingBar({super.key});

  @override
  State<DlLinearLoadingBar> createState() => _DlLinearLoadingBarState();
}

class _DlLinearLoadingBarState extends State<DlLinearLoadingBar>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1100),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 3,
      width: double.infinity,
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, _) {
          return CustomPaint(
            painter: _DlLinearLoadingBarPainter(progress: _controller.value),
            child: const SizedBox.expand(),
          );
        },
      ),
    );
  }
}

class _DlLinearLoadingBarPainter extends CustomPainter {
  _DlLinearLoadingBarPainter({required this.progress});

  final double progress;

  @override
  void paint(Canvas canvas, Size size) {
    final track = Paint()..color = AppColors.primary.withValues(alpha: 0.14);
    canvas.drawRect(Offset.zero & size, track);

    final segmentWidth = size.width * 0.38;
    final travel = size.width + segmentWidth;
    final left = travel * progress - segmentWidth;

    final bar = Paint()..color = AppColors.primary;
    canvas.drawRect(
      Rect.fromLTWH(left, 0, segmentWidth, size.height),
      bar,
    );
  }

  @override
  bool shouldRepaint(covariant _DlLinearLoadingBarPainter oldDelegate) =>
      oldDelegate.progress != progress;
}

/// Full-screen centered loader on black (feed / video).
class DlLoadingOverlay extends StatelessWidget {
  const DlLoadingOverlay({
    super.key,
    this.size = DlLoadingSize.medium,
    this.message,
  });

  final DlLoadingSize size;
  final String? message;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: Colors.black,
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            DlLoadingIndicator(size: size, onDark: true),
            if (message != null) ...[
              const SizedBox(height: 16),
              Text(
                message!,
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.65),
                  fontSize: 14,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
