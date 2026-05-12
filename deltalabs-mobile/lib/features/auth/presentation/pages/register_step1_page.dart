import 'package:deltalabs_mobile/core/routing/app_routes.dart';
import 'package:deltalabs_mobile/features/auth/presentation/providers/register_provider.dart';
import 'package:deltalabs_mobile/shared/widgets/auth/auth_bottom_text.dart';
import 'package:deltalabs_mobile/shared/widgets/auth/auth_scaffold.dart';
import 'package:deltalabs_mobile/shared/widgets/auth/auth_text_field.dart';
import 'package:deltalabs_mobile/shared/widgets/auth/primary_button.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

/// Register Step 1 — username only (backend only accepts username at this step).
class RegisterStep1Page extends HookConsumerWidget {
  const RegisterStep1Page({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final usernameCtrl = useTextEditingController();

    final registerState = ref.watch(registerProvider);
    final notifier = ref.read(registerProvider.notifier);

    // Clear errors when user starts typing
    useEffect(() {
      void listener() {
        if (registerState.usernameError != null || registerState.errorMessage != null) {
          notifier.clearErrors();
        }
      }

      usernameCtrl.addListener(listener);
      return () => usernameCtrl.removeListener(listener);
    }, [registerState.usernameError, registerState.errorMessage]);

    Future<void> onSubmit() async {
      final success = await notifier.submitIdentity(usernameCtrl.text);
      if (success && context.mounted) {
        context.push(AppRoutes.registerStep2);
      }
    }

    return AuthScaffold(
      title: 'Register',
      content: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AuthTextField(
            label: 'User Name',
            hint: 'Enter username',
            controller: usernameCtrl,
            textInputAction: TextInputAction.done,
            onSubmitted: (_) => onSubmit(),
            errorText: registerState.usernameError,
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
        label: 'Next',
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
