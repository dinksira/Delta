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

/// Register Step 2 — phone number + email, then send verification code.
class RegisterStep2Page extends HookConsumerWidget {
  const RegisterStep2Page({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final phoneCtrl = useTextEditingController();
    final emailCtrl = useTextEditingController();

    final registerState = ref.watch(registerProvider);
    final notifier = ref.read(registerProvider.notifier);

    Future<void> onSubmit() async {
      final phone = phoneCtrl.text.trim();
      final email = emailCtrl.text.trim();

      // At least one contact method is required
      if (phone.isEmpty && email.isEmpty) {
        notifier.setContactError('Please enter your email address or phone number.');
        return;
      }

      // Step 1: submit contact info to the flow
      final contactSuccess = await notifier.submitContact(email, phone);
      if (!contactSuccess) return;

      // Step 2: send verification code
      // Prefer EMAIL over SMS — email delivery is real, SMS is not yet wired
      final String channel;
      final String destination;
      if (email.isNotEmpty) {
        channel = 'email';
        destination = email;
      } else {
        channel = 'sms';
        destination = phone;
      }

      final verifySuccess = await notifier.sendVerification(
        channel: channel,
        destination: destination,
      );

      if (verifySuccess && context.mounted) {
        context.push(AppRoutes.registerOtp);
      }
    }

    return AuthScaffold(
      title: 'Register',
      content: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AuthTextField(
            label: 'Phone Number',
            hint: '+1234567890',
            controller: phoneCtrl,
            keyboardType: TextInputType.phone,
            textInputAction: TextInputAction.next,
            errorText: registerState.phoneError,
          ),
          const SizedBox(height: 16),
          AuthTextField(
            label: 'Email Address',
            hint: 'you@example.com',
            controller: emailCtrl,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.done,
            onSubmitted: (_) => onSubmit(),
            errorText: registerState.emailError,
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
        label: 'Send Verification',
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
