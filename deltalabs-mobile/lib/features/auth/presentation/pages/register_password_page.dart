import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/routing/app_routes.dart';
import '../../../../shared/widgets/auth/auth_scaffold.dart';
import '../../../../shared/widgets/auth/auth_text_field.dart';
import '../../../../shared/widgets/auth/auth_bottom_text.dart';
import '../../../../shared/widgets/auth/primary_button.dart';

/// Register Step — Create password (new + confirm). "Complete Signup".
class RegisterPasswordPage extends HookWidget {
  const RegisterPasswordPage({super.key});

  @override
  Widget build(BuildContext context) {
    final passwordCtrl = useTextEditingController();
    final confirmCtrl = useTextEditingController();

    return AuthScaffold(
      title: 'Create your Account',
      subtitle: 'Explore about our app',
      content: Column(
        children: [
          AuthTextField(
            label: 'New Password',
            hint: '••••••••',
            controller: passwordCtrl,
            obscureText: true,
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: 16),
          AuthTextField(
            label: 'Confirm Password',
            hint: '••••••••',
            controller: confirmCtrl,
            obscureText: true,
            textInputAction: TextInputAction.done,
          ),
        ],
      ),
      primaryButton: PrimaryButton(
        label: 'Complete Signup',
        onPressed: () {
          // TODO: complete registration, navigate to home
          context.go(AppRoutes.home);
        },
      ),
      bottomText: AuthBottomText(
        normalText: 'Already Have Account?',
        linkText: 'Login',
        onLinkTap: () => context.go(AppRoutes.login),
      ),
    );
  }
}
