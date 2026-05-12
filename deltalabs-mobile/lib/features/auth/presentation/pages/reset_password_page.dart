import 'package:deltalabs_mobile/core/routing/app_routes.dart';
import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/auth/presentation/providers/recover_provider.dart';
import 'package:deltalabs_mobile/shared/widgets/auth/auth_bottom_text.dart';
import 'package:deltalabs_mobile/shared/widgets/auth/auth_scaffold.dart';
import 'package:deltalabs_mobile/shared/widgets/auth/auth_text_field.dart';
import 'package:deltalabs_mobile/shared/widgets/auth/primary_button.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

/// Reset Password — set a new password after OTP verification.
class ResetPasswordPage extends HookConsumerWidget {
  const ResetPasswordPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final passwordCtrl = useTextEditingController();
    final confirmCtrl = useTextEditingController();
    final recoverState = ref.watch(recoverProvider);
    final notifier = ref.read(recoverProvider.notifier);

    // Navigate to login on success
    ref.listen<RecoverState>(recoverProvider, (_, next) {
      if (next.isComplete && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Password reset successfully. Please log in.'),
            behavior: SnackBarBehavior.floating,
            backgroundColor: Color(0xFF1A3C4D),
          ),
        );
        context.go(AppRoutes.login);
      }
    });

    Future<void> onSubmit() async {
      await notifier.resetPassword(passwordCtrl.text, confirmCtrl.text);
    }

    return AuthScaffold(
      title: 'Recover',
      content: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AuthTextField(
            label: 'New Password',
            hint: '••••••••',
            controller: passwordCtrl,
            obscureText: true,
            textInputAction: TextInputAction.next,
            errorText: recoverState.passwordError,
            onChanged: (_) {
              if (recoverState.passwordError != null) notifier.clearErrors();
            },
          ),
          const SizedBox(height: 16),
          AuthTextField(
            label: 'Confirm Password',
            hint: '••••••••',
            controller: confirmCtrl,
            obscureText: true,
            textInputAction: TextInputAction.done,
            errorText: recoverState.confirmPasswordError,
            onChanged: (_) {
              if (recoverState.confirmPasswordError != null) notifier.clearErrors();
            },
            onSubmitted: (_) => onSubmit(),
          ),

          if (recoverState.hasError) ...[
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: AppColors.error.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.error.withValues(alpha: 0.3)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error_outline_rounded, color: AppColors.error, size: 18),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      recoverState.errorMessage!,
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.error,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
      primaryButton: PrimaryButton(
        label: 'Reset Password',
        isLoading: recoverState.isLoading,
        onPressed: recoverState.isLoading ? null : onSubmit,
      ),
      bottomText: AuthBottomText(
        normalText: 'Remember your password?',
        linkText: 'Log in',
        onLinkTap: () => context.go(AppRoutes.login),
      ),
      showSocialButtons: false,
    );
  }
}
