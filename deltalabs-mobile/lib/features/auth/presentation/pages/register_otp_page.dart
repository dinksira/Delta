import 'dart:async';

import 'package:deltalabs_mobile/core/routing/app_routes.dart';
import 'package:deltalabs_mobile/core/theme/app_text_styles.dart';
import 'package:deltalabs_mobile/features/auth/presentation/providers/register_provider.dart';
import 'package:deltalabs_mobile/shared/widgets/auth/auth_bottom_text.dart';
import 'package:deltalabs_mobile/shared/widgets/auth/auth_scaffold.dart';
import 'package:deltalabs_mobile/shared/widgets/auth/auth_text_field.dart';
import 'package:deltalabs_mobile/shared/widgets/auth/primary_button.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

/// Register OTP screen — verification code + countdown timer → "Date of Birth".
class RegisterOtpPage extends HookConsumerWidget {
  const RegisterOtpPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final codeCtrl = useTextEditingController();

    final registerState = ref.watch(registerProvider);
    final notifier = ref.read(registerProvider.notifier);

    // Countdown timer — initialise from the resend delay returned by the backend
    final seconds = useState(registerState.resendAvailableInSeconds);
    final canResend = useState(false);

    // Reset and start the timer whenever the page is (re)entered
    useEffect(() {
      seconds.value = registerState.resendAvailableInSeconds > 0
          ? registerState.resendAvailableInSeconds
          : 40;
      canResend.value = false;

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

    Future<void> onSubmit() async {
      final success = await notifier.verifyCode(codeCtrl.text);
      if (success && context.mounted) {
        context.push(AppRoutes.registerDob);
      }
    }

    Future<void> onResend() async {
      final channel = registerState.verificationChannel;
      final destination = registerState.verificationDestination;

      if (channel == null || destination == null) return;

      final success = await notifier.sendVerification(
        channel: channel,
        destination: destination,
      );

      if (success) {
        // Reset the countdown using the new resend delay
        final newDelay = ref.read(registerProvider).resendAvailableInSeconds;
        seconds.value = newDelay > 0 ? newDelay : 40;
        canResend.value = false;

        // Restart the timer
        Timer.periodic(const Duration(seconds: 1), (t) {
          if (seconds.value > 0) {
            seconds.value--;
          } else {
            canResend.value = true;
            t.cancel();
          }
        });
      }
    }

    return AuthScaffold(
      title: 'Verify',
      content: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (registerState.verificationDestination != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Text(
                'We sent a code to ${registerState.verificationDestination}',
                style: AppTextStyles.body,
              ),
            ),
          AuthTextField(
            label: 'Verification Code',
            hint: 'Enter Code ...',
            controller: codeCtrl,
            keyboardType: TextInputType.number,
            textInputAction: TextInputAction.done,
            onSubmitted: (_) => onSubmit(),
            errorText: registerState.otpError,
          ),
          const SizedBox(height: 10),
          canResend.value
              ? GestureDetector(
                  onTap: registerState.isLoading ? null : onResend,
                  child: const Text(
                    'Resend verification code',
                    style: AppTextStyles.linkText,
                  ),
                )
              : Text(
                  'Resend verification in ${seconds.value}sec',
                  style: AppTextStyles.resendTimer,
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
        label: 'Continue',
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
