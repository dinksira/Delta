import 'package:deltalabs_mobile/core/di/service_locator.dart';
import 'package:deltalabs_mobile/core/error/error_handler.dart';
import 'package:deltalabs_mobile/core/error/failures.dart';
import 'package:deltalabs_mobile/core/network/api_client.dart';
import 'package:deltalabs_mobile/core/storage/secure_storage.dart';
import 'package:deltalabs_mobile/features/auth/data/data_sources/register_remote_data_source.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'register_provider.g.dart';

// ── State ─────────────────────────────────────────────────────────────────────

class RegisterState {
  const RegisterState({
    this.isLoading = false,
    this.errorMessage,
    this.usernameError,
    this.emailError,
    this.phoneError,
    this.otpError,
    this.dobError,
    this.passwordError,
    this.confirmPasswordError,
    this.flowId,
    this.verificationId,
    this.verificationChannel,
    this.verificationDestination,
    this.resendAvailableInSeconds = 40,
    this.isComplete = false,
  });

  final bool isLoading;
  final String? errorMessage;

  // Field-level errors
  final String? usernameError;
  final String? emailError;
  final String? phoneError;
  final String? otpError;
  final String? dobError;
  final String? passwordError;
  final String? confirmPasswordError;

  // Flow state persisted across steps
  final String? flowId;
  final String? verificationId;
  final String? verificationChannel;
  final String? verificationDestination;
  final int resendAvailableInSeconds;

  final bool isComplete;

  bool get hasError => errorMessage != null;

  RegisterState copyWith({
    bool? isLoading,
    String? errorMessage,
    String? usernameError,
    String? emailError,
    String? phoneError,
    String? otpError,
    String? dobError,
    String? passwordError,
    String? confirmPasswordError,
    String? flowId,
    String? verificationId,
    String? verificationChannel,
    String? verificationDestination,
    int? resendAvailableInSeconds,
    bool? isComplete,
    bool clearErrors = false,
  }) {
    return RegisterState(
      isLoading: isLoading ?? this.isLoading,
      errorMessage: clearErrors ? null : (errorMessage ?? this.errorMessage),
      usernameError: clearErrors ? null : (usernameError ?? this.usernameError),
      emailError: clearErrors ? null : (emailError ?? this.emailError),
      phoneError: clearErrors ? null : (phoneError ?? this.phoneError),
      otpError: clearErrors ? null : (otpError ?? this.otpError),
      dobError: clearErrors ? null : (dobError ?? this.dobError),
      passwordError: clearErrors ? null : (passwordError ?? this.passwordError),
      confirmPasswordError: clearErrors
          ? null
          : (confirmPasswordError ?? this.confirmPasswordError),
      flowId: flowId ?? this.flowId,
      verificationId: verificationId ?? this.verificationId,
      verificationChannel: verificationChannel ?? this.verificationChannel,
      verificationDestination:
          verificationDestination ?? this.verificationDestination,
      resendAvailableInSeconds:
          resendAvailableInSeconds ?? this.resendAvailableInSeconds,
      isComplete: isComplete ?? this.isComplete,
    );
  }
}

// ── Notifier ──────────────────────────────────────────────────────────────────

@riverpod
class RegisterNotifier extends _$RegisterNotifier {
  RegisterRemoteDataSource get _dataSource => RegisterRemoteDataSourceImpl(
        apiClient: sl<ApiClient>(),
      );

  @override
  RegisterState build() => const RegisterState();

  // ── Step 1: Identity ───────────────────────────────────────────────────────

  Future<bool> submitIdentity(String username) async {
    final usernameError = _validateUsername(username);
    if (usernameError != null) {
      state = state.copyWith(usernameError: usernameError);
      return false;
    }

    state = state.copyWith(isLoading: true, clearErrors: true);

    try {
      final result = await _dataSource.stepIdentity(username.trim());
      state = state.copyWith(
        isLoading: false,
        flowId: result.flowId,
      );
      return true;
    } catch (e, st) {
      final failure = ErrorHandler.fromObject(e, st);
      state = state.copyWith(
        isLoading: false,
        errorMessage: _mapFailureToMessage(failure, field: 'username'),
      );
      return false;
    }
  }

  // ── Step 2: Contact ────────────────────────────────────────────────────────

  Future<bool> submitContact(String email, String phone) async {
    final emailError = _validateEmail(email);
    final phoneError = _validatePhone(phone);

    if (emailError != null || phoneError != null) {
      state = state.copyWith(emailError: emailError, phoneError: phoneError);
      return false;
    }

    if (state.flowId == null) {
      state = state.copyWith(errorMessage: 'Registration session expired. Please start over.');
      return false;
    }

    state = state.copyWith(isLoading: true, clearErrors: true);

    try {
      await _dataSource.stepContact(
        flowId: state.flowId!,
        email: email.trim().isNotEmpty ? email.trim() : null,
        phoneE164: phone.trim().isNotEmpty ? phone.trim() : null,
      );
      state = state.copyWith(isLoading: false);
      return true;
    } catch (e, st) {
      final failure = ErrorHandler.fromObject(e, st);
      state = state.copyWith(
        isLoading: false,
        errorMessage: _mapFailureToMessage(failure),
      );
      return false;
    }
  }

  // ── Send Verification ──────────────────────────────────────────────────────

  Future<bool> sendVerification({
    required String channel,
    required String destination,
  }) async {
    state = state.copyWith(isLoading: true, clearErrors: true);

    try {
      final result = await _dataSource.sendVerification(
        channel: channel,
        destination: destination,
      );
      state = state.copyWith(
        isLoading: false,
        verificationId: result.verificationId,
        verificationChannel: result.channel,
        verificationDestination: result.destinationMasked,
        resendAvailableInSeconds: result.resendAvailableInSeconds,
      );
      return true;
    } catch (e, st) {
      final failure = ErrorHandler.fromObject(e, st);
      state = state.copyWith(
        isLoading: false,
        errorMessage: _mapFailureToMessage(failure),
      );
      return false;
    }
  }

  // ── OTP Verify ────────────────────────────────────────────────────────────

  Future<bool> verifyCode(String code) async {
    final otpError = _validateOtp(code);
    if (otpError != null) {
      state = state.copyWith(otpError: otpError);
      return false;
    }

    if (state.verificationId == null) {
      state = state.copyWith(errorMessage: 'Verification session expired. Please resend the code.');
      return false;
    }

    if (state.flowId == null) {
      state = state.copyWith(errorMessage: 'Registration session expired. Please start over.');
      return false;
    }

    state = state.copyWith(isLoading: true, clearErrors: true);

    try {
      final result = await _dataSource.verifyCode(
        verificationId: state.verificationId!,
        code: code.trim(),
      );

      if (!result.verified) {
        state = state.copyWith(
          isLoading: false,
          otpError: 'Invalid verification code. Please try again.',
        );
        return false;
      }

      // Confirm the verification step with the signup flow
      await _dataSource.stepVerification(
        flowId: state.flowId!,
        verificationId: state.verificationId!,
      );

      state = state.copyWith(isLoading: false);
      return true;
    } catch (e, st) {
      final failure = ErrorHandler.fromObject(e, st);
      state = state.copyWith(
        isLoading: false,
        errorMessage: _mapFailureToMessage(failure, field: 'otp'),
      );
      return false;
    }
  }

  // ── Step DOB ──────────────────────────────────────────────────────────────

  Future<bool> submitDob(String dateOfBirth) async {
    if (dateOfBirth.isEmpty) {
      state = state.copyWith(dobError: 'Please select your date of birth.');
      return false;
    }

    if (state.flowId == null) {
      state = state.copyWith(errorMessage: 'Registration session expired. Please start over.');
      return false;
    }

    state = state.copyWith(isLoading: true, clearErrors: true);

    try {
      await _dataSource.stepDob(
        flowId: state.flowId!,
        dateOfBirth: dateOfBirth,
      );
      state = state.copyWith(isLoading: false);
      return true;
    } catch (e, st) {
      final failure = ErrorHandler.fromObject(e, st);
      state = state.copyWith(
        isLoading: false,
        errorMessage: _mapFailureToMessage(failure),
      );
      return false;
    }
  }

  // ── Complete ──────────────────────────────────────────────────────────────

  Future<String?> complete(String password, String confirmPassword) async {
    final passwordError = _validatePassword(password);
    final confirmError = _validateConfirmPassword(password, confirmPassword);

    if (passwordError != null || confirmError != null) {
      state = state.copyWith(
        passwordError: passwordError,
        confirmPasswordError: confirmError,
      );
      return null;
    }

    if (state.flowId == null) {
      state = state.copyWith(errorMessage: 'Registration session expired. Please start over.');
      return null;
    }

    state = state.copyWith(isLoading: true, clearErrors: true);

    try {
      final session = await _dataSource.complete(
        flowId: state.flowId!,
        password: password,
      );

      // Persist the access token
      await sl<SecureStorage>().saveAccessToken(session.accessToken);
      await sl<SecureStorage>().saveUserId(session.user.userId);

      state = state.copyWith(isLoading: false, isComplete: true);
      return session.accessToken;
    } catch (e, st) {
      final failure = ErrorHandler.fromObject(e, st);
      state = state.copyWith(
        isLoading: false,
        errorMessage: _mapFailureToMessage(failure),
      );
      return null;
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  void clearErrors() {
    state = state.copyWith(clearErrors: true);
  }

  void setContactError(String message) {
    state = state.copyWith(errorMessage: message);
  }

  // ── Validation ────────────────────────────────────────────────────────────

  String? _validateUsername(String value) {
    final trimmed = value.trim();
    if (trimmed.isEmpty) return 'Please enter a username.';
    if (trimmed.length < 3) return 'Username must be at least 3 characters.';
    if (trimmed.length > 30) return 'Username must be 30 characters or fewer.';
    final validChars = RegExp(r'^[a-zA-Z0-9_.-]+$');
    if (!validChars.hasMatch(trimmed)) {
      return 'Username can only contain letters, numbers, underscores, dots, and hyphens.';
    }
    return null;
  }

  String? _validateEmail(String value) {
    final trimmed = value.trim();
    if (trimmed.isEmpty) return null; // email is optional if phone is provided
    final emailRegex = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
    if (!emailRegex.hasMatch(trimmed)) return 'Please enter a valid email address.';
    return null;
  }

  String? _validatePhone(String value) {
    final trimmed = value.trim();
    if (trimmed.isEmpty) return null; // phone is optional if email is provided
    // E.164 format: +[country code][number], 8–15 digits total
    final phoneRegex = RegExp(r'^\+[1-9]\d{7,14}$');
    if (!phoneRegex.hasMatch(trimmed)) {
      return 'Please enter a valid phone number in international format (e.g. +1234567890).';
    }
    return null;
  }

  String? _validateOtp(String value) {
    final trimmed = value.trim();
    if (trimmed.isEmpty) return 'Please enter the verification code.';
    if (trimmed.length < 4) return 'Verification code is too short.';
    return null;
  }

  String? _validatePassword(String value) {
    if (value.isEmpty) return 'Please enter a password.';
    if (value.length < 10) return 'Password must be at least 10 characters.';
    if (!value.contains(RegExp(r'[A-Z]'))) {
      return 'Password must contain at least one uppercase letter.';
    }
    if (!value.contains(RegExp(r'[a-z]'))) {
      return 'Password must contain at least one lowercase letter.';
    }
    if (!value.contains(RegExp(r'[0-9]'))) {
      return 'Password must contain at least one digit.';
    }
    if (!value.contains(RegExp(r'[!@#\$%^&*()_+\-=\[\]{}|;:,./<>?]'))) {
      return 'Password must contain at least one special character.';
    }
    return null;
  }

  String? _validateConfirmPassword(String password, String confirm) {
    if (confirm.isEmpty) return 'Please confirm your password.';
    if (password != confirm) return 'Passwords do not match.';
    return null;
  }

  // ── Error Mapping ─────────────────────────────────────────────────────────

  String _mapFailureToMessage(Failure failure, {String? field}) {
    if (failure is NoInternetFailure) {
      return 'No internet connection. Please check your network.';
    }
    if (failure is TimeoutFailure) {
      return 'Connection timed out. Please try again.';
    }
    if (failure is ConflictFailure) {
      return 'Already exists, try a different value.';
    }
    if (failure is ValidationFailure) {
      // Map backend error codes to user-friendly messages
      final msg = failure.message.toLowerCase();
      if (msg.contains('identity_already_exists') ||
          failure.code == 'identity_already_exists') {
        return 'This username is already taken.';
      }
      return failure.message;
    }
    if (failure is ServerFailure) {
      // Check for backend error codes in the message
      final msg = failure.message.toLowerCase();
      if (msg.contains('identity_already_exists')) {
        return 'This username is already taken.';
      }
      if (msg.contains('conflict')) {
        return 'Already exists, try a different value.';
      }
      return 'Server error. Please try again later.';
    }
    if (failure is UnauthorizedFailure) {
      return 'Session expired. Please start over.';
    }
    return 'Something went wrong. Please try again.';
  }
}
