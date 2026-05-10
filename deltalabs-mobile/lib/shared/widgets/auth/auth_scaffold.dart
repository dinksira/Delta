import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import 'delta_logo.dart';
import 'social_buttons_row.dart';
import 'auth_bottom_text.dart';

/// Shared scaffold for all auth screens.
/// Provides consistent layout: logo → title → subtitle → content → button → OR → social → bottom link
class AuthScaffold extends StatelessWidget {
  const AuthScaffold({
    super.key,
    required this.title,
    required this.subtitle,
    required this.content,
    required this.primaryButton,
    required this.bottomText,
    this.showSocialButtons = true,
  });

  final String title;
  final String subtitle;
  final Widget content;
  final Widget primaryButton;
  final Widget bottomText;
  final bool showSocialButtons;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 32),

              // Logo
              const DeltaLogo(size: 64),
              const SizedBox(height: 24),

              // Title
              Text(title, style: AppTextStyles.heading1),
              const SizedBox(height: 6),

              // Subtitle
              Text(subtitle, style: AppTextStyles.subtitle),
              const SizedBox(height: 36),

              // Screen-specific content (fields, pickers, etc.)
              content,
              const SizedBox(height: 28),

              // Primary action button
              primaryButton,
              const SizedBox(height: 24),

              // OR divider
              if (showSocialButtons) ...[
                const _OrDivider(),
                const SizedBox(height: 20),
                const SocialButtonsRow(),
                const SizedBox(height: 24),
              ],

              // Bottom link text
              Center(child: bottomText),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}

class _OrDivider extends StatelessWidget {
  const _OrDivider();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Expanded(
          child: Divider(color: AppColors.divider, thickness: 1),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Text('OR', style: AppTextStyles.orDivider),
        ),
        const Expanded(
          child: Divider(color: AppColors.divider, thickness: 1),
        ),
      ],
    );
  }
}
