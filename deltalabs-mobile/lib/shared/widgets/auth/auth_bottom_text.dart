import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';

import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/core/theme/app_text_styles.dart';

/// Bottom "Already have account? Login" style text with tappable link.
class AuthBottomText extends StatelessWidget {
  const AuthBottomText({
    super.key,
    required this.normalText,
    required this.linkText,
    required this.onLinkTap,
  });

  final String normalText;
  final String linkText;
  final VoidCallback onLinkTap;

  @override
  Widget build(BuildContext context) {
    return RichText(
      text: TextSpan(
        text: normalText,
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w400,
          color: AppColors.textSecondary,
        ),
        children: [
          TextSpan(
            text: ' $linkText',
            style: AppTextStyles.linkText,
            recognizer: TapGestureRecognizer()..onTap = onLinkTap,
          ),
        ],
      ),
    );
  }
}
