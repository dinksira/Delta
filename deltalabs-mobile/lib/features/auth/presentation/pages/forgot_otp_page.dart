import 'dart:async';

import 'package:deltalabs_mobile/core/routing/app_routes.dart';
import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/core/theme/app_text_styles.dart';
import 'package:deltalabs_mobile/features/auth/presentation/providers/recover_provider.dart';
import 'package:deltalabs_mobile/shared/widgets/auth/auth_bottom_text.dart';
import 'package:deltalabs_mobile/shared/widgets/auth/auth_scaffold.dart';
import 'package:deltalabs_mobile/shared/widgets/auth/auth_text_field.dart';
import 'package:deltalabs_mobile/shared/widgets/auth/primary_button.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

/// Forgot Password OTP — enter the code received by email/SMS.
class ForgotOtpPage extends HookConsumerWidget {
  const ForgotOtpPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final codeCtrl = useTextEditingController();
    final recoverState = ref.watch(recoverProvider);
    final notifier = ref.read(recoverProvider.notifier);

    final seconds = useState(60);
    final canResend = useState(false);

    useEffect(() {
      final timer = Timer.periodic(const Duration(seconds: 1), (t) {
        if (seconds.value > 0) {
          seconds.value--;
        } else {
          canResend.value = true;
          t.cancel();
        }
      });
      return timer.cancel;
    }, const []);

    Future<void> onSubmit() async {
      final success = await notifier.verifyCode(codeCtrl.text);
      if (success && context.mounted) {
        context.push(AppRoutes.resetPassword);
      }
    }

    Future<void> onResend() async {
      // Re-request recovery — user needs to go back and re-enter identity
      // or we can just show a message
      seconds.value = 60;
      canResend.value = false;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Go back and request a new code.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }

    return AuthScaffold(
      title: 'Verify',
      content: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Enter the 6-digit code we sent to your email or phone.',
            style: TextStyle(fontSize: 14, color: AppColors.textSecondary, height: 1.5),
          ),
          const SizedBox(height: 20),

          AuthTextField(
            label: 'Recovery Code',
            hint: '000000',
            controller: codeCtrl,
            keyboardType: TextInputType.number,
            textInputAction: TextInputAction.done,
            errorText: recoverState.otpError,
            onChanged: (_) {
              if (recoverState.otpError != null) notifier.clearErrors();
            },
            onSubmitted: (_) => onSubmit(),
          ),
          const SizedBox(height: 10),

          canResend.value
              ? GestureDetector(
                  onTap: recoverState.isLoading ? null : onResend,
                  child: const Text(
                    'Resend code',
                    style: AppTextStyles.linkText,
                  ),
                )
              : Text(
                  'Resend available in ${seconds.value}s',
                  style: AppTextStyles.resendTimer,
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
        label: 'Verify Code',
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
