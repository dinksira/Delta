import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/routing/app_routes.dart';
import '../../../../shared/widgets/auth/auth_scaffold.dart';
import '../../../../shared/widgets/auth/auth_text_field.dart';
import '../../../../shared/widgets/auth/auth_bottom_text.dart';
import '../../../../shared/widgets/auth/primary_button.dart';

/// Register Step 1 — first name, last name, username.
class RegisterStep1Page extends HookWidget {
  const RegisterStep1Page({super.key});

  @override
  Widget build(BuildContext context) {
    final firstNameCtrl = useTextEditingController();
    final lastNameCtrl = useTextEditingController();
    final usernameCtrl = useTextEditingController();

    return AuthScaffold(
      title: 'Create you Account',
      subtitle: 'Explore about our app',
      content: Column(
        children: [
          AuthTextField(
            label: 'First Name',
            hint: 'first name',
            controller: firstNameCtrl,
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: 16),
          AuthTextField(
            label: 'Last Name',
            hint: 'last name',
            controller: lastNameCtrl,
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: 16),
          AuthTextField(
            label: 'User Name',
            hint: 'Enter username',
            controller: usernameCtrl,
            textInputAction: TextInputAction.done,
          ),
        ],
      ),
      primaryButton: PrimaryButton(
        label: 'Next',
        onPressed: () => context.push(AppRoutes.registerStep2),
      ),
      bottomText: AuthBottomText(
        normalText: 'Already Have Account?',
        linkText: 'Login',
        onLinkTap: () => context.go(AppRoutes.login),
      ),
    );
  }
}
