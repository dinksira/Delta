import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';

import 'package:deltalabs_mobile/core/routing/app_routes.dart';
import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/core/theme/app_text_styles.dart';
import 'package:deltalabs_mobile/shared/widgets/auth/auth_scaffold.dart';
import 'package:deltalabs_mobile/shared/widgets/auth/auth_text_field.dart';
import 'package:deltalabs_mobile/shared/widgets/auth/auth_bottom_text.dart';
import 'package:deltalabs_mobile/shared/widgets/auth/primary_button.dart';

/// Forgot Password — phone input + SMS/Email radio selector.
class ForgotPasswordPage extends HookWidget {
  const ForgotPasswordPage({super.key});

  @override
  Widget build(BuildContext context) {
    final phoneCtrl = useTextEditingController();
    final method = useState<_RecoveryMethod>(_RecoveryMethod.sms);

    return AuthScaffold(
      title: 'Recover you account',
      content: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AuthTextField(
            label: 'Phone',
            hint: '+251 ...',
            controller: phoneCtrl,
            keyboardType: TextInputType.phone,
            textInputAction: TextInputAction.done,
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              _RadioOption(
                label: 'SMS',
                value: _RecoveryMethod.sms,
                groupValue: method.value,
                onChanged: (v) => method.value = v!,
              ),
              const SizedBox(width: 24),
              _RadioOption(
                label: 'Email',
                value: _RecoveryMethod.email,
                groupValue: method.value,
                onChanged: (v) => method.value = v!,
              ),
            ],
          ),
        ],
      ),
      primaryButton: PrimaryButton(
        label: 'Recover',
        onPressed: () => context.push(AppRoutes.forgotOtp),
      ),
      bottomText: AuthBottomText(
        normalText: 'New to the firm?',
        linkText: 'Open an Account',
        onLinkTap: () => context.push(AppRoutes.registerStep1),
      ),
    );
  }
}

enum _RecoveryMethod { sms, email }

class _RadioOption extends StatelessWidget {
  const _RadioOption({
    required this.label,
    required this.value,
    required this.groupValue,
    required this.onChanged,
  });

  final String label;
  final _RecoveryMethod value;
  final _RecoveryMethod groupValue;
  final ValueChanged<_RecoveryMethod?> onChanged;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          width: 20,
          height: 20,
          child: Radio<_RecoveryMethod>(
            value: value,
            groupValue: groupValue,
            onChanged: onChanged,
            activeColor: AppColors.primary,
            materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
          ),
        ),
        const SizedBox(width: 6),
        Text(label, style: AppTextStyles.body),
      ],
    );
  }
}
