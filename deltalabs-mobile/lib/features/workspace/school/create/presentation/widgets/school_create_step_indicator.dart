import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:flutter/material.dart';

/// Modern animated stepper for the create-school wizard.
class SchoolCreateStepIndicator extends StatelessWidget {
  const SchoolCreateStepIndicator({required this.currentIndex, super.key});

  final int currentIndex;

  static const _stepCount = 5;
  static const _iconSlotSize = 40.0;

  static const _shortLabels = ['School', 'Partner', 'Owners', 'Share', 'Docs'];

  static const _icons = [
    Icons.school_outlined,
    Icons.person_outline_rounded,
    Icons.groups_outlined,
    Icons.share_outlined,
    Icons.description_outlined,
  ];

  @override
  Widget build(BuildContext context) {
    return _StepNodeRow(currentIndex: currentIndex);
  }
}

class _StepNodeRow extends StatelessWidget {
  const _StepNodeRow({required this.currentIndex});

  final int currentIndex;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: _buildTrackChildren(
            (index) => _StepCircle(index: index, currentIndex: currentIndex),
            (index) => _ConnectorLine(filled: index < currentIndex),
          ),
        ),
        const SizedBox(height: 6),
        Row(
          children: _buildTrackChildren(
            (index) => _StepLabel(index: index, currentIndex: currentIndex),
            (_) => const SizedBox.shrink(),
          ),
        ),
      ],
    );
  }

  List<Widget> _buildTrackChildren(
    Widget Function(int index) nodeBuilder,
    Widget Function(int index) connectorBuilder,
  ) {
    final children = <Widget>[];
    for (var index = 0; index < SchoolCreateStepIndicator._stepCount; index++) {
      children.add(nodeBuilder(index));
      if (index < SchoolCreateStepIndicator._stepCount - 1) {
        children.add(Expanded(child: connectorBuilder(index)));
      }
    }
    return children;
  }
}

class _ConnectorLine extends StatelessWidget {
  const _ConnectorLine({required this.filled});

  final bool filled;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.center,
      child: TweenAnimationBuilder<double>(
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeOutCubic,
        tween: Tween(begin: 0, end: filled ? 1.0 : 0.0),
        builder: (context, value, _) {
          return SizedBox(
            height: 3,
            child: DecoratedBox(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(999),
                color: AppColors.inputBorder.withValues(alpha: 0.4),
              ),
              child: Align(
                alignment: Alignment.centerLeft,
                child: FractionallySizedBox(
                  widthFactor: value,
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(999),
                      color: AppColors.primaryLight,
                    ),
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

class _StepCircle extends StatelessWidget {
  const _StepCircle({required this.index, required this.currentIndex});

  final int index;
  final int currentIndex;

  bool get _isDone => index < currentIndex;
  bool get _isActive => index == currentIndex;

  @override
  Widget build(BuildContext context) {
    final size = _isActive ? 40.0 : 32.0;

    return SizedBox(
      width: SchoolCreateStepIndicator._iconSlotSize,
      height: SchoolCreateStepIndicator._iconSlotSize,
      child: Center(
        child: TweenAnimationBuilder<double>(
          duration: const Duration(milliseconds: 350),
          curve: Curves.easeOutBack,
          tween: Tween(begin: 0.85, end: _isActive ? 1.0 : 0.92),
          builder: (context, scale, child) {
            return Transform.scale(scale: scale, child: child);
          },
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 350),
            curve: Curves.easeOutCubic,
            width: size,
            height: size,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: _isDone || _isActive ? AppColors.primary : Colors.white,
              border: Border.all(
                color: _isDone || _isActive
                    ? AppColors.primary
                    : AppColors.inputBorder,
                width: _isActive ? 2.5 : 1.5,
              ),
              boxShadow: _isActive
                  ? [
                      BoxShadow(
                        color: AppColors.primary.withValues(alpha: 0.28),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ]
                  : null,
            ),
            child: Icon(
              _isDone ? Icons.check_rounded : SchoolCreateStepIndicator._icons[index],
              size: _isDone ? 20 : (_isActive ? 20 : 16),
              color: _isDone || _isActive ? Colors.white : AppColors.textHint,
            ),
          ),
        ),
      ),
    );
  }
}

class _StepLabel extends StatelessWidget {
  const _StepLabel({required this.index, required this.currentIndex});

  final int index;
  final int currentIndex;

  bool get _isDone => index < currentIndex;
  bool get _isActive => index == currentIndex;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: SchoolCreateStepIndicator._iconSlotSize,
      child: AnimatedDefaultTextStyle(
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOut,
        style: TextStyle(
          fontSize: _isActive ? 11 : 10,
          fontWeight: _isActive ? FontWeight.w700 : FontWeight.w500,
          color: _isActive
              ? AppColors.primary
              : _isDone
                  ? AppColors.primaryLight
                  : AppColors.textHint,
        ),
        child: Text(
          SchoolCreateStepIndicator._shortLabels[index],
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}
