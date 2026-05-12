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

/// Forgot Password — enter identity (username/email/phone) to receive a code.
class ForgotPasswordPage extends HookConsumerWidget {
  const ForgotPasswordPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final identityCtrl = useTextEditingController();
    final recoverState = ref.watch(recoverProvider);
    final notifier = ref.read(recoverProvider.notifier);

    Future<void> onSubmit() async {
      final success = await notifier.requestRecover(identityCtrl.text);
      if (success && context.mounted) {
        context.push(AppRoutes.forgotOtp);
      }
    }

    return AuthScaffold(
      title: 'Recover',
      content: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Info text
          // const Text(
          //   'Enter your username, email or phone number and we\'ll send you a recovery code.',
          //   style: TextStyle(fontSize: 14, color: AppColors.textSecondary, height: 1.5),
          // ),
          // const SizedBox(height: 20),

          AuthTextField(
            label: 'Username / Email / Phone',
            hint: 'Enter your identity',
            controller: identityCtrl,
            keyboardType: TextInputType.text,
            textInputAction: TextInputAction.done,
            errorText: recoverState.identityError,
            onChanged: (_) {
              if (recoverState.identityError != null) notifier.clearErrors();
            },
            onSubmitted: (_) => onSubmit(),
          ),

          if (recoverState.hasError) ...[
            const SizedBox(height: 12),
            _ErrorBanner(message: recoverState.errorMessage!),
          ],
        ],
      ),
      primaryButton: PrimaryButton(
        label: 'Send Recovery Code',
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

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.message});
  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
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
              message,
              style: const TextStyle(
                fontSize: 13,
                color: AppColors.error,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
