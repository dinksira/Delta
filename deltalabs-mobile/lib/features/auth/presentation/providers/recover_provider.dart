import 'package:deltalabs_mobile/core/di/service_locator.dart';
import 'package:deltalabs_mobile/core/error/error_handler.dart';
import 'package:deltalabs_mobile/core/error/failures.dart';
import 'package:deltalabs_mobile/core/network/api_client.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'recover_provider.g.dart';

// ── Remote data source (inline — simple enough) ───────────────────────────────

class _RecoverDataSource {
  _RecoverDataSource(this._apiClient);
  final ApiClient _apiClient;

  Future<String> requestRecover(String identity) async {
    final res = await _apiClient.post<Map<String, dynamic>>(
      '/auth/recover/request',
      data: {'identity': identity.trim()},
    );
    // Returns recover_id (may be null if account not found — anti-enumeration)
    return res.data?['recover_id'] as String? ?? '';
  }

  Future<String> verifyCode(String recoverId, String code) async {
    final res = await _apiClient.post<Map<String, dynamic>>(
      '/auth/recover/verify',
      data: {'recover_id': recoverId, 'code': code.trim()},
    );
    return res.data?['reset_token'] as String? ?? '';
  }

  Future<void> resetPassword({
    required String recoverId,
    required String resetToken,
    required String newPassword,
  }) async {
    await _apiClient.post<Map<String, dynamic>>(
      '/auth/recover/reset',
      data: {
        'recover_id': recoverId,
        'reset_token': resetToken,
        'new_password': newPassword,
      },
    );
  }
}

// ── State ─────────────────────────────────────────────────────────────────────

class RecoverState {
  const RecoverState({
    this.isLoading = false,
    this.errorMessage,
    this.identityError,
    this.otpError,
    this.passwordError,
    this.confirmPasswordError,
    this.recoverId,
    this.resetToken,
    this.isComplete = false,
  });

  final bool isLoading;
  final String? errorMessage;
  final String? identityError;
  final String? otpError;
  final String? passwordError;
  final String? confirmPasswordError;

  // Persisted across steps
  final String? recoverId;
  final String? resetToken;

  final bool isComplete;

  bool get hasError => errorMessage != null;

  RecoverState copyWith({
    bool? isLoading,
    String? errorMessage,
    String? identityError,
    String? otpError,
    String? passwordError,
    String? confirmPasswordError,
    String? recoverId,
    String? resetToken,
    bool? isComplete,
    bool clearErrors = false,
  }) {
    return RecoverState(
      isLoading: isLoading ?? this.isLoading,
      errorMessage: clearErrors ? null : (errorMessage ?? this.errorMessage),
      identityError: clearErrors ? null : (identityError ?? this.identityError),
      otpError: clearErrors ? null : (otpError ?? this.otpError),
      passwordError: clearErrors ? null : (passwordError ?? this.passwordError),
      confirmPasswordError: clearErrors
          ? null
          : (confirmPasswordError ?? this.confirmPasswordError),
      recoverId: recoverId ?? this.recoverId,
      resetToken: resetToken ?? this.resetToken,
      isComplete: isComplete ?? this.isComplete,
    );
  }
}

// ── Notifier ──────────────────────────────────────────────────────────────────

@riverpod
class RecoverNotifier extends _$RecoverNotifier {
  _RecoverDataSource get _ds =>
      _RecoverDataSource(sl<ApiClient>());

  @override
  RecoverState build() => const RecoverState();

  // ── Step 1: Request recovery ───────────────────────────────────────────────

  Future<bool> requestRecover(String identity) async {
    final err = _validateIdentity(identity);
    if (err != null) {
      state = state.copyWith(identityError: err);
      return false;
    }

    state = state.copyWith(isLoading: true, clearErrors: true);

    try {
      final recoverId = await _ds.requestRecover(identity);
      // Backend always returns 200 (anti-enumeration) — recoverId may be empty
      // if account not found, but we still proceed to OTP screen
      state = state.copyWith(
        isLoading: false,
        recoverId: recoverId.isNotEmpty ? recoverId : null,
      );
      return true;
    } catch (e, st) {
      final failure = ErrorHandler.fromObject(e, st);
      state = state.copyWith(
        isLoading: false,
        errorMessage: _mapFailure(failure),
      );
      return false;
    }
  }

  // ── Step 2: Verify OTP ────────────────────────────────────────────────────

  Future<bool> verifyCode(String code) async {
    final err = _validateOtp(code);
    if (err != null) {
      state = state.copyWith(otpError: err);
      return false;
    }

    if (state.recoverId == null) {
      state = state.copyWith(
        errorMessage: 'Recovery session expired. Please start over.',
      );
      return false;
    }

    state = state.copyWith(isLoading: true, clearErrors: true);

    try {
      final resetToken = await _ds.verifyCode(state.recoverId!, code);
      if (resetToken.isEmpty) {
        state = state.copyWith(
          isLoading: false,
          otpError: 'Invalid or expired code. Please try again.',
        );
        return false;
      }
      state = state.copyWith(isLoading: false, resetToken: resetToken);
      return true;
    } catch (e, st) {
      final failure = ErrorHandler.fromObject(e, st);
      state = state.copyWith(
        isLoading: false,
        errorMessage: _mapFailure(failure, field: 'otp'),
      );
      return false;
    }
  }

  // ── Step 3: Reset password ────────────────────────────────────────────────

  Future<bool> resetPassword(String password, String confirm) async {
    final pwErr = _validatePassword(password);
    final cfErr = _validateConfirm(password, confirm);

    if (pwErr != null || cfErr != null) {
      state = state.copyWith(passwordError: pwErr, confirmPasswordError: cfErr);
      return false;
    }

    if (state.recoverId == null || state.resetToken == null) {
      state = state.copyWith(
        errorMessage: 'Recovery session expired. Please start over.',
      );
      return false;
    }

    state = state.copyWith(isLoading: true, clearErrors: true);

    try {
      await _ds.resetPassword(
        recoverId: state.recoverId!,
        resetToken: state.resetToken!,
        newPassword: password,
      );
      state = state.copyWith(isLoading: false, isComplete: true);
      return true;
    } catch (e, st) {
      final failure = ErrorHandler.fromObject(e, st);
      state = state.copyWith(
        isLoading: false,
        errorMessage: _mapFailure(failure),
      );
      return false;
    }
  }

  void clearErrors() => state = state.copyWith(clearErrors: true);

  // ── Validation ────────────────────────────────────────────────────────────

  String? _validateIdentity(String v) {
    if (v.trim().isEmpty) return 'Please enter your username, email or phone.';
    if (v.trim().length < 3) return 'Must be at least 3 characters.';
    return null;
  }

  String? _validateOtp(String v) {
    if (v.trim().isEmpty) return 'Please enter the verification code.';
    if (v.trim().length < 4) return 'Code is too short.';
    return null;
  }

  String? _validatePassword(String v) {
    if (v.isEmpty) return 'Please enter a new password.';
    if (v.length < 10) return 'Password must be at least 10 characters.';
    if (!v.contains(RegExp(r'[A-Z]'))) return 'Must contain an uppercase letter.';
    if (!v.contains(RegExp(r'[a-z]'))) return 'Must contain a lowercase letter.';
    if (!v.contains(RegExp(r'[0-9]'))) return 'Must contain a digit.';
    if (!v.contains(RegExp(r'[!@#\$%^&*()_+\-=\[\]{}|;:,./<>?]'))) {
      return 'Must contain a special character.';
    }
    return null;
  }

  String? _validateConfirm(String pw, String confirm) {
    if (confirm.isEmpty) return 'Please confirm your password.';
    if (pw != confirm) return 'Passwords do not match.';
    return null;
  }

  // ── Error mapping ─────────────────────────────────────────────────────────

  String _mapFailure(Failure failure, {String? field}) {
    if (failure is NoInternetFailure) {
      return 'No internet connection. Please check your network.';
    }
    if (failure is TimeoutFailure) {
      return 'Connection timed out. Please try again.';
    }
    if (failure is ValidationFailure) {
      final msg = failure.message.toLowerCase();
      if (msg.contains('invalid') || msg.contains('code')) {
        return 'Invalid or expired code. Please try again.';
      }
      if (msg.contains('exhausted')) {
        return 'Too many attempts. Please request a new code.';
      }
      return failure.message;
    }
    if (failure is ServerFailure) {
      return 'Server error. Please try again later.';
    }
    return 'Something went wrong. Please try again.';
  }
}
