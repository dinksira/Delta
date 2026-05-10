import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/routing/app_routes.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../shared/widgets/auth/auth_scaffold.dart';
import '../../../../shared/widgets/auth/auth_text_field.dart';
import '../../../../shared/widgets/auth/auth_bottom_text.dart';
import '../../../../shared/widgets/auth/primary_button.dart';

/// Login screen — phone + password, forgot access link.
class LoginPage extends HookWidget {
  const LoginPage({super.key});

  @override
  Widget build(BuildContext context) {
    final phoneCtrl = useTextEditingController();
    final passwordCtrl = useTextEditingController();

    return AuthScaffold(
      title: 'Log in to your account',
      subtitle: 'Explore about our app',
      content: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AuthTextField(
            label: 'Phone',
            hint: '+251 ...',
            controller: phoneCtrl,
            keyboardType: TextInputType.phone,
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: 16),
          AuthTextField(
            label: 'Password',
            hint: '••••••••',
            controller: passwordCtrl,
            obscureText: true,
            textInputAction: TextInputAction.done,
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
        label: 'Login',
        onPressed: () {
          // TODO: wire auth provider
        },
      ),
      bottomText: AuthBottomText(
        normalText: 'New to the firm?',
        linkText: 'Open an Account',
        onLinkTap: () => context.push(AppRoutes.registerStep1),
      ),
    );
  }
}
