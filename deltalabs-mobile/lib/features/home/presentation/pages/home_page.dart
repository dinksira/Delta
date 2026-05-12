import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/core/theme/app_text_styles.dart';
import 'package:deltalabs_mobile/features/auth/presentation/providers/auth_provider.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

/// Home screen placeholder — will be replaced with the real home once built.
/// Contains a professional logout flow with confirmation dialog.
class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState.when(
      data: (u) => u,
      loading: () => null,
      error: (_, __) => null,
    );
    final isSigningOut = authState.isLoading;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        title: const Text('DeltaLabs', style: AppTextStyles.heading2),
        actions: [
          // Logout button — disabled while signing out
          isSigningOut
              ? const Padding(
                  padding: EdgeInsets.all(16),
                  child: SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: AppColors.primary,
                    ),
                  ),
                )
              : IconButton(
                  icon: const Icon(Icons.logout_rounded, color: AppColors.textPrimary),
                  tooltip: 'Log out',
                  onPressed: () => _confirmLogout(context, ref),
                ),
        ],
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.home_rounded, size: 64, color: AppColors.primary),
            const SizedBox(height: 16),
            Text(
              'Welcome${user != null ? ', ${user.username}' : ''}',
              style: AppTextStyles.heading1,
            ),
            const SizedBox(height: 8),
            const Text(
              'Home screen — coming soon',
              style: AppTextStyles.body,
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _confirmLogout(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Log out', style: AppTextStyles.heading2),
        content: const Text(
          'Are you sure you want to log out?',
          style: AppTextStyles.body,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel', style: AppTextStyles.linkText),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: Text(
              'Log out',
              style: AppTextStyles.linkText.copyWith(color: AppColors.error),
            ),
          ),
        ],
      ),
    );

    if (confirmed == true && context.mounted) {
      // Sign out — router will automatically redirect to login
      // when authProvider state becomes null
      await ref.read(authProvider.notifier).signOut();
    }
  }
}
