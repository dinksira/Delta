import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../../core/di/service_locator.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/storage/secure_storage.dart';
import '../../data/data_sources/auth_remote_data_source.dart';
import '../../data/repositories/auth_repository_impl.dart';
import '../../domain/entities/user.dart';
import '../../domain/repositories/auth_repository.dart';
import '../../domain/use_cases/sign_in_use_case.dart';

part 'auth_provider.g.dart';

// ── Repository Provider ───────────────────────────────────────────────────────

@riverpod
AuthRepository authRepository(Ref ref) {
  return AuthRepositoryImpl(
    remoteDataSource: AuthRemoteDataSourceImpl(
      apiClient: sl<ApiClient>(),
    ),
    secureStorage: sl<SecureStorage>(),
  );
}

// ── Use Case Providers ────────────────────────────────────────────────────────

@riverpod
SignInUseCase signInUseCase(Ref ref) {
  return SignInUseCase(repository: ref.watch(authRepositoryProvider));
}

// ── Auth State ────────────────────────────────────────────────────────────────

@riverpod
class AuthNotifier extends _$AuthNotifier {
  @override
  AsyncValue<User?> build() {
    // Initialize by checking stored session
    _checkSession();
    return const AsyncValue.loading();
  }

  Future<void> _checkSession() async {
    final repo = ref.read(authRepositoryProvider);
    final isAuth = await repo.isAuthenticated();

    if (!isAuth) {
      state = const AsyncValue.data(null);
      return;
    }

    final result = await repo.getCurrentUser();
    state = result.fold(
      (failure) => const AsyncValue.data(null),
      (user) => AsyncValue.data(user),
    );
  }

  Future<void> signIn({
    required String email,
    required String password,
    required String tenantId,
  }) async {
    state = const AsyncValue.loading();

    final useCase = ref.read(signInUseCaseProvider);
    final result = await useCase(
      SignInParams(email: email, password: password, tenantId: tenantId),
    );

    result.fold(
      (failure) => state = AsyncValue.error(failure, StackTrace.current),
      (_) => _checkSession(),
    );
  }

  Future<void> signOut() async {
    final repo = ref.read(authRepositoryProvider);
    await repo.signOut();
    state = const AsyncValue.data(null);
  }
}

// ── Convenience Selectors ─────────────────────────────────────────────────────

@riverpod
bool isAuthenticated(Ref ref) {
  final state = ref.watch(authProvider);
  return state.when(
    data: (user) => user != null,
    loading: () => false,
    error: (_, __) => false,
  );
}
