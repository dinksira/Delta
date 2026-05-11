import 'package:flutter/material.dart';

import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/core/theme/app_text_styles.dart';
import 'package:deltalabs_mobile/shared/widgets/auth/delta_logo.dart';
import 'package:deltalabs_mobile/shared/widgets/auth/social_buttons_row.dart';

/// Shared scaffold for all auth screens.
/// Provides consistent layout: logo → title → content → button → OR → social → bottom link
/// Shows a back button automatically when the screen can be popped.
class AuthScaffold extends StatelessWidget {
  const AuthScaffold({
    super.key,
    required this.title,
    required this.content,
    required this.primaryButton,
    required this.bottomText,
    this.showSocialButtons = true,
  });

  final String title;
  final Widget content;
  final Widget primaryButton;
  final Widget bottomText;
  final bool showSocialButtons;

  @override
  Widget build(BuildContext context) {
    final canPop = Navigator.of(context).canPop();

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 16),

              // Back button — bare arrow, left-aligned, only when stack has a previous screen
              if (canPop)
                GestureDetector(
                  onTap: () => Navigator.of(context).pop(),
                  behavior: HitTestBehavior.opaque,
                  child: const Padding(
                    padding: EdgeInsets.only(right: 16, bottom: 8, top: 4),
                    child: Icon(
                      Icons.arrow_back,
                      size: 24,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ),

              if (!canPop) const SizedBox(height: 12),
              if (canPop) const SizedBox(height: 20),

              // Logo
              const DeltaLogo(),
              const SizedBox(height: 32),

              // Title
              Text(title, style: AppTextStyles.heading1),
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
    return const Row(
      children: [
        Expanded(
          child: Divider(color: AppColors.divider, thickness: 1),
        ),
        Padding(
          padding: EdgeInsets.symmetric(horizontal: 12),
          child: Text('OR', style: AppTextStyles.orDivider),
        ),
        Expanded(
          child: Divider(color: AppColors.divider, thickness: 1),
        ),
      ],
    );
  }
}
