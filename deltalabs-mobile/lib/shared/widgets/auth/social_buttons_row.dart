import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../../../core/theme/app_colors.dart';

/// Row of 4 social login buttons: Google, Facebook, Apple, Phone.
class SocialButtonsRow extends StatelessWidget {
  const SocialButtonsRow({super.key, this.onGoogle, this.onFacebook, this.onApple, this.onPhone});

  final VoidCallback? onGoogle;
  final VoidCallback? onFacebook;
  final VoidCallback? onApple;
  final VoidCallback? onPhone;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        _SocialButton(
          onTap: onGoogle,
          child: _GoogleIcon(),
        ),
        const SizedBox(width: 12),
        _SocialButton(
          onTap: onFacebook,
          child: _FacebookIcon(),
        ),
        const SizedBox(width: 12),
        _SocialButton(
          onTap: onApple,
          child: const Icon(Icons.apple, size: 22, color: Colors.black),
        ),
        const SizedBox(width: 12),
        _SocialButton(
          onTap: onPhone,
          child: const Icon(Icons.phone_android_outlined, size: 20, color: Colors.black54),
        ),
      ],
    );
  }
}

class _SocialButton extends StatelessWidget {
  const _SocialButton({required this.child, this.onTap});

  final Widget child;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 60,
        height: 52,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.socialBorder, width: 1.2),
        ),
        child: Center(child: child),
      ),
    );
  }
}

// ── Inline icon widgets (no asset files needed) ───────────────────────────────

class _GoogleIcon extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 22,
      height: 22,
      child: CustomPaint(painter: _GooglePainter()),
    );
  }
}

class _GooglePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;

    // Simplified Google 'G' using colored arcs
    final colors = [
      const Color(0xFF4285F4), // blue
      const Color(0xFF34A853), // green
      const Color(0xFFFBBC05), // yellow
      const Color(0xFFEA4335), // red
    ];

    for (var i = 0; i < 4; i++) {
      final paint = Paint()
        ..color = colors[i]
        ..style = PaintingStyle.stroke
        ..strokeWidth = 3.5
        ..strokeCap = StrokeCap.round;

      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius - 1.5),
        (i * 90 - 45) * (3.14159 / 180),
        80 * (3.14159 / 180),
        false,
        paint,
      );
    }

    // White cutout center
    canvas.drawCircle(
      center,
      radius - 5,
      Paint()..color = Colors.white,
    );

    // Blue horizontal bar (the G crossbar)
    canvas.drawRect(
      Rect.fromLTWH(size.width * 0.5, size.height * 0.38, size.width * 0.45, size.height * 0.24),
      Paint()..color = const Color(0xFF4285F4),
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _FacebookIcon extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 22,
      height: 22,
      decoration: const BoxDecoration(
        color: Color(0xFF1877F2),
        shape: BoxShape.circle,
      ),
      child: const Center(
        child: Text(
          'f',
          style: TextStyle(
            color: Colors.white,
            fontSize: 14,
            fontWeight: FontWeight.w700,
            height: 1,
          ),
        ),
      ),
    );
  }
}
