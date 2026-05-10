import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/routing/app_routes.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../shared/widgets/auth/auth_scaffold.dart';
import '../../../../shared/widgets/auth/auth_bottom_text.dart';
import '../../../../shared/widgets/auth/primary_button.dart';

/// Register Step — Date of Birth with Day / Month / Year dropdowns.
class RegisterDobPage extends HookWidget {
  const RegisterDobPage({super.key});

  @override
  Widget build(BuildContext context) {
    final selectedDay = useState<int?>(null);
    final selectedMonth = useState<int?>(null);
    final selectedYear = useState<int?>(null);

    final days = List.generate(31, (i) => i + 1);
    final months = List.generate(12, (i) => i + 1);
    final currentYear = DateTime.now().year;
    final years = List.generate(100, (i) => currentYear - i);

    return AuthScaffold(
      title: 'Enter you Date of birth',
      subtitle:
          'Your age information will be updated\non your profile page and this will displayed\npublicly on your dashboard',
      content: Row(
        children: [
          Expanded(
            child: _DobDropdown(
              hint: 'Day',
              value: selectedDay.value,
              items: days.map((d) => DropdownMenuItem(value: d, child: Text('$d'))).toList(),
              onChanged: (v) => selectedDay.value = v,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: _DobDropdown(
              hint: 'Month',
              value: selectedMonth.value,
              items: months
                  .map((m) => DropdownMenuItem(value: m, child: Text(_monthName(m))))
                  .toList(),
              onChanged: (v) => selectedMonth.value = v,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: _DobDropdown(
              hint: 'Year',
              value: selectedYear.value,
              items: years.map((y) => DropdownMenuItem(value: y, child: Text('$y'))).toList(),
              onChanged: (v) => selectedYear.value = v,
            ),
          ),
        ],
      ),
      primaryButton: PrimaryButton(
        label: 'Continue',
        onPressed: () => context.push(AppRoutes.registerPassword),
      ),
      bottomText: AuthBottomText(
        normalText: 'Already Have Account?',
        linkText: 'Login',
        onLinkTap: () => context.go(AppRoutes.login),
      ),
    );
  }

  String _monthName(int month) {
    const names = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return names[month - 1];
  }
}

class _DobDropdown<T> extends StatelessWidget {
  const _DobDropdown({
    required this.hint,
    required this.value,
    required this.items,
    required this.onChanged,
  });

  final String hint;
  final T? value;
  final List<DropdownMenuItem<T>> items;
  final ValueChanged<T?> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 52,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: const Color(0xFFF0F0F0),
        borderRadius: BorderRadius.circular(12),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<T>(
          value: value,
          hint: Text(hint, style: AppTextStyles.body),
          icon: const Icon(Icons.keyboard_arrow_down_rounded,
              color: AppColors.textSecondary, size: 20),
          isExpanded: true,
          style: AppTextStyles.body,
          items: items,
          onChanged: onChanged,
          dropdownColor: Colors.white,
          borderRadius: BorderRadius.circular(12),
        ),
      ),
    );
  }
}
