import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/routing/app_routes.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../shared/widgets/auth/auth_scaffold.dart';
import '../../../../shared/widgets/auth/auth_text_field.dart';
import '../../../../shared/widgets/auth/auth_bottom_text.dart';
import '../../../../shared/widgets/auth/primary_button.dart';

/// Forgot Password OTP screen — verification code + countdown → "Send code".
class ForgotOtpPage extends HookWidget {
  const ForgotOtpPage({super.key});

  @override
  Widget build(BuildContext context) {
    final codeCtrl = useTextEditingController();
    final seconds = useState(40);
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

    return AuthScaffold(
      title: 'Insert Verification Code',
      subtitle: 'Learn more and do more',
      content: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AuthTextField(
            label: 'Verification Code',
            hint: 'Enter Code ...',
            controller: codeCtrl,
            keyboardType: TextInputType.number,
            textInputAction: TextInputAction.done,
          ),
          const SizedBox(height: 10),
          canResend.value
              ? GestureDetector(
                  onTap: () {
                    seconds.value = 40;
                    canResend.value = false;
                  },
                  child: const Text(
                    'Resend verification code',
                    style: AppTextStyles.linkText,
                  ),
                )
              : Text(
                  'Resend verification in ${seconds.value}sec',
                  style: AppTextStyles.resendTimer,
                ),
        ],
      ),
      primaryButton: PrimaryButton(
        label: 'Send code',
        onPressed: () => context.push(AppRoutes.resetPassword),
      ),
      bottomText: AuthBottomText(
        normalText: 'New to the firm?',
        linkText: 'Open an Account',
        onLinkTap: () => context.push(AppRoutes.registerStep1),
      ),
    );
  }
}
