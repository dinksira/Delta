import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';

import 'package:deltalabs_mobile/core/routing/app_routes.dart';
import 'package:deltalabs_mobile/shared/widgets/auth/auth_scaffold.dart';
import 'package:deltalabs_mobile/shared/widgets/auth/auth_text_field.dart';
import 'package:deltalabs_mobile/shared/widgets/auth/auth_bottom_text.dart';
import 'package:deltalabs_mobile/shared/widgets/auth/primary_button.dart';

/// Register Step 2 — phone number + email, send verification.
class RegisterStep2Page extends HookWidget {
  const RegisterStep2Page({super.key});

  @override
  Widget build(BuildContext context) {
    final phoneCtrl = useTextEditingController();
    final emailCtrl = useTextEditingController();

    return AuthScaffold(
      title: 'Create you Account',
      content: Column(
        children: [
          AuthTextField(
            label: 'Phone Number',
            hint: 'Phone',
            controller: phoneCtrl,
            keyboardType: TextInputType.phone,
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: 16),
          AuthTextField(
            label: 'Email Address',
            hint: 'Email',
            controller: emailCtrl,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.done,
          ),
        ],
      ),
      primaryButton: PrimaryButton(
        label: 'Send Verification',
        onPressed: () => context.push(AppRoutes.registerOtp),
      ),
      bottomText: AuthBottomText(
        normalText: 'Already Have Account?',
        linkText: 'Login',
        onLinkTap: () => context.go(AppRoutes.login),
      ),
    );
  }
}
