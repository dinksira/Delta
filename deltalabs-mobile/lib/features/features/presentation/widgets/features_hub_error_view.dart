import 'package:deltalabs_mobile/core/error/failures.dart';
import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:flutter/material.dart';

/// Branded empty/error state for the Features hub (not the default Material error UI).
class FeaturesHubErrorView extends StatelessWidget {
  const FeaturesHubErrorView({
    required this.onRetry,
    this.error,
    this.isRetrying = false,
    super.key,
  });

  final VoidCallback onRetry;
  final Object? error;
  final bool isRetrying;

  static String _message(Object? error) {
    if (error is Failure) return error.message;
    final raw = error?.toString() ?? '';
    if (raw.contains('Feature not found')) {
      return 'Your layout could not be synced. Pull to refresh or tap Try again.';
    }
    if (raw.isNotEmpty) return raw;
    return 'We could not reach your features. Check your connection and try again.';
  }

  @override
  Widget build(BuildContext context) {
    final detail = _message(error);

    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 28),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 88,
              height: 88,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.08),
                shape: BoxShape.circle,
              ),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  Icon(
                    Icons.grid_view_rounded,
                    size: 36,
                    color: AppColors.primary.withValues(alpha: 0.35),
                  ),
                  Positioned(
                    right: 22,
                    bottom: 22,
                    child: Container(
                      width: 28,
                      height: 28,
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Icons.cloud_off_rounded,
                        size: 18,
                        color: AppColors.primary.withValues(alpha: 0.7),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'Features unavailable',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: AppColors.primary,
                fontSize: 20,
                fontWeight: FontWeight.w700,
                height: 1.2,
              ),
            ),
            const SizedBox(height: 10),
            Text(
              detail,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 14,
                height: 1.45,
              ),
            ),
            const SizedBox(height: 28),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: isRetrying ? null : onRetry,
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                child: isRetrying
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Text(
                        'Try again',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
