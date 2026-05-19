import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import 'package:deltalabs_mobile/core/routing/app_routes.dart';
import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/core/theme/app_text_styles.dart';
import 'package:deltalabs_mobile/features/auth/presentation/providers/auth_provider.dart';
import 'package:deltalabs_mobile/shared/widgets/auth/auth_bottom_text.dart';
import 'package:deltalabs_mobile/shared/widgets/auth/auth_scaffold.dart';
import 'package:deltalabs_mobile/shared/widgets/auth/auth_text_field.dart';
import 'package:deltalabs_mobile/shared/widgets/auth/primary_button.dart';

/// Login screen — identity (username/email/phone) + password.
class LoginPage extends HookConsumerWidget {
  const LoginPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final identityCtrl = useTextEditingController();
    final passwordCtrl = useTextEditingController();

    // loginProvider is the generated name for LoginNotifier
    final loginState = ref.watch(loginProvider);
    final notifier = ref.read(loginProvider.notifier);

    // Navigate to home on success
    ref.listen<LoginState>(loginProvider, (_, next) {
      if (next.isSuccess) {
        ref.read(authProvider.notifier).onLoginSuccess();
        context.go(AppRoutes.feed);
      }
    });

    return AuthScaffold(
      title: 'Log in',
      content: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Server / network error banner
          if (loginState.hasError) ...[
            _ErrorBanner(message: loginState.errorMessage!),
            const SizedBox(height: 16),
          ],

          AuthTextField(
            label: 'Username / Email / Phone',
            hint: 'Enter your identity',
            controller: identityCtrl,
            keyboardType: TextInputType.text,
            textInputAction: TextInputAction.next,
            errorText: loginState.identityError,
            onChanged: (_) {
              if (loginState.identityError != null) notifier.clearErrors();
            },
          ),
          const SizedBox(height: 16),
          AuthTextField(
            label: 'Password',
            hint: '••••••••',
            controller: passwordCtrl,
            obscureText: true,
            textInputAction: TextInputAction.done,
            errorText: loginState.passwordError,
            onChanged: (_) {
              if (loginState.passwordError != null) notifier.clearErrors();
            },
            onSubmitted: (_) => _submit(notifier, identityCtrl, passwordCtrl),
          ),
          const SizedBox(height: 8),
          Align(
            alignment: Alignment.centerRight,
            child: GestureDetector(
              onTap: () => context.push(AppRoutes.forgotPassword),
              child: const Text('Forgot Access?', style: AppTextStyles.linkText),
            ),
          ),
        ],
      ),
      primaryButton: PrimaryButton(
        label: 'Log in',
        isLoading: loginState.isLoading,
        onPressed: loginState.isLoading
            ? null
            : () => _submit(notifier, identityCtrl, passwordCtrl),
      ),
      bottomText: AuthBottomText(
        normalText: 'New to the firm?',
        linkText: 'Open an Account',
        onLinkTap: () => context.push(AppRoutes.registerStep1),
      ),
    );
  }

  void _submit(
    LoginNotifier notifier,
    TextEditingController identityCtrl,
    TextEditingController passwordCtrl,
  ) {
    notifier.signIn(
      identity: identityCtrl.text,
      password: passwordCtrl.text,
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
