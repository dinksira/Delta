import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/routing/app_routes.dart';
import '../../../../shared/widgets/auth/auth_scaffold.dart';
import '../../../../shared/widgets/auth/auth_text_field.dart';
import '../../../../shared/widgets/auth/auth_bottom_text.dart';
import '../../../../shared/widgets/auth/primary_button.dart';

/// Reset Password — new password + confirm, "Recover" button.
class ResetPasswordPage extends HookWidget {
  const ResetPasswordPage({super.key});

  @override
  Widget build(BuildContext context) {
    final passwordCtrl = useTextEditingController();
    final confirmCtrl = useTextEditingController();

    return AuthScaffold(
      title: 'Recover your Account',
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
        label: 'Recover',
        onPressed: () => context.go(AppRoutes.login),
      ),
      bottomText: AuthBottomText(
        normalText: 'New to the firm?',
        linkText: 'Open an Account',
        onLinkTap: () => context.push(AppRoutes.registerStep1),
      ),
    );
  }
}
