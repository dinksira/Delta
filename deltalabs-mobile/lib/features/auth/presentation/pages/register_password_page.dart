import 'package:deltalabs_mobile/core/routing/app_routes.dart';
import 'package:deltalabs_mobile/features/auth/presentation/providers/auth_provider.dart';
import 'package:deltalabs_mobile/features/auth/presentation/providers/register_provider.dart';
import 'package:deltalabs_mobile/shared/widgets/auth/auth_bottom_text.dart';
import 'package:deltalabs_mobile/shared/widgets/auth/auth_scaffold.dart';
import 'package:deltalabs_mobile/shared/widgets/auth/auth_text_field.dart';
import 'package:deltalabs_mobile/shared/widgets/auth/primary_button.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

/// Register Step — Create password (new + confirm). "Complete Signup".
class RegisterPasswordPage extends HookConsumerWidget {
  const RegisterPasswordPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final passwordCtrl = useTextEditingController();
    final confirmCtrl = useTextEditingController();

    final registerState = ref.watch(registerProvider);
    final notifier = ref.read(registerProvider.notifier);

    Future<void> onSubmit() async {
      final token = await notifier.complete(
        passwordCtrl.text,
        confirmCtrl.text,
      );

      if (token != null && context.mounted) {
        // Refresh the auth session so the app recognises the new user
        await ref.read(authProvider.notifier).onLoginSuccess();
        if (context.mounted) {
          context.go(AppRoutes.feed);
        }
      }
    }

    return AuthScaffold(
      title: 'Register',
      content: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AuthTextField(
            label: 'New Password',
            hint: '••••••••',
            controller: passwordCtrl,
            obscureText: true,
            textInputAction: TextInputAction.next,
            errorText: registerState.passwordError,
          ),
          const SizedBox(height: 16),
          AuthTextField(
            label: 'Confirm Password',
            hint: '••••••••',
            controller: confirmCtrl,
            obscureText: true,
            textInputAction: TextInputAction.done,
            onSubmitted: (_) => onSubmit(),
            errorText: registerState.confirmPasswordError,
          ),
          if (registerState.errorMessage != null) ...[
            const SizedBox(height: 12),
            Text(
              registerState.errorMessage!,
              style: const TextStyle(color: Colors.red, fontSize: 13),
            ),
          ],
        ],
      ),
      primaryButton: PrimaryButton(
        label: 'Complete Signup',
        isLoading: registerState.isLoading,
        onPressed: registerState.isLoading ? null : onSubmit,
      ),
      bottomText: AuthBottomText(
        normalText: 'Already Have Account?',
        linkText: 'Login',
        onLinkTap: () => context.go(AppRoutes.login),
      ),
    );
  }
}
