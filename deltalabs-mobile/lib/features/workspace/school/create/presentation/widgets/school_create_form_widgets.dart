import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:flutter/material.dart';

class SchoolCreateLabeledField extends StatelessWidget {
  const SchoolCreateLabeledField({
    required this.label,
    required this.child,
    this.error,
    super.key,
  });

  final String label;
  final Widget child;
  final String? error;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontWeight: FontWeight.w600,
            color: AppColors.primary,
            fontSize: 14,
          ),
        ),
        const SizedBox(height: 6),
        child,
        if (error != null) ...[
          const SizedBox(height: 4),
          Text(error!, style: const TextStyle(color: AppColors.error, fontSize: 12)),
        ],
      ],
    );
  }
}

InputDecoration schoolCreateInputDecoration({String? hint}) {
  return InputDecoration(
    hintText: hint,
    hintStyle: const TextStyle(color: AppColors.textHint),
    filled: true,
    fillColor: Colors.white,
    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(10),
      borderSide: BorderSide(color: AppColors.inputBorder.withValues(alpha: 0.8)),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(10),
      borderSide: BorderSide(color: AppColors.inputBorder.withValues(alpha: 0.8)),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(10),
      borderSide: const BorderSide(color: AppColors.inputBorderFocused, width: 1.5),
    ),
  );
}

/// Text field synced to Riverpod state without resetting the cursor every rebuild.
class SchoolCreateBoundField extends StatefulWidget {
  const SchoolCreateBoundField({
    required this.value,
    required this.onChanged,
    this.decoration,
    this.keyboardType,
    this.maxLines = 1,
    super.key,
  });

  final String value;
  final ValueChanged<String> onChanged;
  final InputDecoration? decoration;
  final TextInputType? keyboardType;
  final int maxLines;

  @override
  State<SchoolCreateBoundField> createState() => _SchoolCreateBoundFieldState();
}

class _SchoolCreateBoundFieldState extends State<SchoolCreateBoundField> {
  late final TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.value);
  }

  @override
  void didUpdateWidget(SchoolCreateBoundField oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.value != _controller.text) {
      _controller.value = TextEditingValue(
        text: widget.value,
        selection: TextSelection.collapsed(offset: widget.value.length),
      );
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: _controller,
      keyboardType: widget.keyboardType,
      maxLines: widget.maxLines,
      decoration: widget.decoration ?? schoolCreateInputDecoration(),
      onChanged: widget.onChanged,
    );
  }
}

class SchoolCreateFooter extends StatelessWidget {
  const SchoolCreateFooter({
    required this.stepIndex,
    required this.canContinue,
    required this.isLastStep,
    required this.submitting,
    required this.onBack,
    required this.onContinue,
    required this.onSubmit,
    this.continueHint,
    this.submitLabel = 'Done',
    super.key,
  });

  final int stepIndex;
  final bool canContinue;
  final bool isLastStep;
  final bool submitting;
  final VoidCallback onBack;
  final VoidCallback onContinue;
  final VoidCallback onSubmit;
  final String? continueHint;
  final String submitLabel;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (continueHint != null) ...[
          Text(
            continueHint!,
            style: const TextStyle(color: AppColors.error, fontSize: 13),
          ),
          const SizedBox(height: 8),
        ],
        Row(
          children: [
            if (stepIndex > 0)
              OutlinedButton(
                onPressed: submitting ? null : onBack,
                child: const Text('Back'),
              ),
            const Spacer(),
            FilledButton(
              onPressed: submitting
                  ? null
                  : isLastStep
                      ? onSubmit
                      : (canContinue ? onContinue : null),
              style: FilledButton.styleFrom(backgroundColor: AppColors.primary),
              child: submitting
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : Text(isLastStep ? submitLabel : 'Save and Continue'),
            ),
          ],
        ),
      ],
    );
  }
}
