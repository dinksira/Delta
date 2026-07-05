import 'package:deltalabs_mobile/core/di/service_locator.dart';
import 'package:deltalabs_mobile/core/error/failures.dart';
import 'package:deltalabs_mobile/core/network/api_client.dart';
import 'package:deltalabs_mobile/core/storage/secure_storage.dart';
import 'package:deltalabs_mobile/features/auth/data/data_sources/auth_remote_data_source.dart';
import 'package:deltalabs_mobile/features/auth/data/repositories/auth_repository_impl.dart';
import 'package:deltalabs_mobile/features/auth/domain/repositories/auth_repository.dart';
import 'package:deltalabs_mobile/features/auth/domain/use_cases/sign_in_use_case.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'auth_provider.g.dart';

// ── Repository ────────────────────────────────────────────────────────────────

@riverpod
AuthRepository authRepository(Ref ref) {
  return AuthRepositoryImpl(
    remoteDataSource: AuthRemoteDataSourceImpl(apiClient: sl<ApiClient>()),
    secureStorage: sl<SecureStorage>(),
  );
}

// ── Use Cases ─────────────────────────────────────────────────────────────────

@riverpod
SignInUseCase signInUseCase(Ref ref) {
  return SignInUseCase(repository: ref.watch(authRepositoryProvider));
}

// ── Login Form State ──────────────────────────────────────────────────────────

/// Holds the UI state for the login screen.
class LoginState {
  const LoginState({
    this.isLoading = false,
    this.errorMessage,
    this.identityError,
    this.passwordError,
    this.isSuccess = false,
  });

  final bool isLoading;
  final String? errorMessage;   // server / network error shown as a banner
  final String? identityError;  // inline field error
  final String? passwordError;  // inline field error
  final bool isSuccess;

  bool get hasError => errorMessage != null;

  LoginState copyWith({
    bool? isLoading,
    String? errorMessage,
    String? identityError,
    String? passwordError,
    bool? isSuccess,
    bool clearError = false,
  }) {
    return LoginState(
      isLoading: isLoading ?? this.isLoading,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      identityError: clearError ? null : (identityError ?? this.identityError),
      passwordError: clearError ? null : (passwordError ?? this.passwordError),
      isSuccess: isSuccess ?? this.isSuccess,
    );
  }
}

@riverpod
class LoginNotifier extends _$LoginNotifier {
  @override
  LoginState build() => const LoginState();

  /// Validates fields and calls the sign-in use case.
  Future<void> signIn({
    required String identity,
    required String password,
  }) async {
    // ── Client-side validation ────────────────────────────────────────────────
    final identityError = _validateIdentity(identity);
    final passwordError = _validatePassword(password);

    if (identityError != null || passwordError != null) {
      state = LoginState(
        identityError: identityError,
        passwordError: passwordError,
      );
      return;
    }

    state = const LoginState(isLoading: true);

    final useCase = ref.read(signInUseCaseProvider);
    final result = await useCase(
      SignInParams(identity: identity.trim(), password: password),
    );

    result.fold(
      (failure) {
        state = LoginState(errorMessage: _mapFailureToMessage(failure));
      },
      (_) {
        state = const LoginState(isSuccess: true);
      },
    );
  }

  void clearErrors() {
    state = state.copyWith(clearError: true);
  }

  // ── Validation helpers ────────────────────────────────────────────────────

  String? _validateIdentity(String value) {
    if (value.trim().isEmpty) return 'Please enter your username, email or phone';
    if (value.trim().length < 3) return 'Must be at least 3 characters';
    return null;
  }

  String? _validatePassword(String value) {
    if (value.isEmpty) return 'Please enter your password';
    if (value.length < 6) return 'Password is too short';
    return null;
  }

  // ── Error message mapping ─────────────────────────────────────────────────

  String _mapFailureToMessage(Failure failure) {
    if (failure is ValidationFailure) {
      // Backend returns code: "invalid_credentials" for wrong identity/password
      if (failure.code == '400') {
        return 'Incorrect username or password';
      }
      return failure.message;
    }
    if (failure is UnauthorizedFailure) {
      return 'Incorrect username or password';
    }
    if (failure is NoInternetFailure) {
      return 'No internet connection. Please check your network.';
    }
    if (failure is TimeoutFailure) {
      return 'Connection timed out. Please try again.';
    }
    if (failure is ServerFailure) {
      if (failure.statusCode == 503) {
        return failure.message.isNotEmpty
            ? failure.message
            : 'API server is unavailable. Check that the backend is running.';
      }
      return 'Server error. Please try again later.';
    }
    return 'Something went wrong. Please try again.';
  }
}

// ── Session State ─────────────────────────────────────────────────────────────

@Riverpod(keepAlive: true)
class AuthNotifier extends _$AuthNotifier {
  @override
  AsyncValue<AuthUser?> build() {
    // Kick off background session check — but don't block on it
    _checkSession();
    // Start as loading — router won't redirect until this resolves
    return const AsyncValue.loading();
  }

  Future<void> _checkSession() async {
    final repo = ref.read(authRepositoryProvider);

    // Step 1: check local token — instant, no network
    final isAuth = await repo.isAuthenticated();
    if (!ref.mounted) return;

    if (!isAuth) {
      // No token → go to login immediately
      state = const AsyncValue.data(null);
      return;
    }

    // Step 2: token exists locally → go to home immediately (optimistic)
    // Then verify with server in background — if expired, redirect to login
    // This prevents black screen when Render is cold-starting (30-60s delay)
    final result = await repo.getCurrentUser();
    if (!ref.mounted) return;

    state = result.fold(
      (_) => const AsyncValue.data(null), // token invalid → login
      (user) => AsyncValue.data(user),    // token valid → stay on home
    );
  }

  Future<void> signOut() async {
    state = const AsyncValue.loading();
    final repo = ref.read(authRepositoryProvider);
    // Always clear local state regardless of server response
    await repo.signOut();
    if (ref.mounted) state = const AsyncValue.data(null);
  }

  Future<void> onLoginSuccess() async {
    await _checkSession();
  }
}

// ── Convenience selector ──────────────────────────────────────────────────────

@riverpod
bool isAuthenticated(Ref ref) {
  return ref.watch(authProvider).when(
    data: (user) => user != null,
    loading: () => false,
    error: (_, __) => false,
  );
}
