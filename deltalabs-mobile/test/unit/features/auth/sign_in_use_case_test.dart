// import 'package:dartz/dartz.dart';
// import 'package:deltalabs_mobile/core/error/failures.dart';
// import 'package:deltalabs_mobile/features/auth/domain/repositories/auth_repository.dart';
// import 'package:deltalabs_mobile/features/auth/domain/use_cases/sign_in_use_case.dart';
// import 'package:flutter_test/flutter_test.dart';
// import 'package:mocktail/mocktail.dart';

// class MockAuthRepository extends Mock implements AuthRepository {}

// void main() {
//   late SignInUseCase useCase;
//   late MockAuthRepository mockRepository;

//   setUp(() {
//     mockRepository = MockAuthRepository();
//     useCase = SignInUseCase(repository: mockRepository);
//   });

//   const tParams = SignInParams(
//     email: 'test@deltalabs.io',
//     password: 'password123',
//     tenantId: 'school-001',
//   );

//   final tTokens = AuthTokens(
//     accessToken: 'access_token',
//     refreshToken: 'refresh_token',
//     expiresAt: DateTime.now().add(const Duration(hours: 1)),
//   );

//   group('SignInUseCase', () {
//     test('should return AuthTokens on successful sign in', () async {
//       // Arrange
//       when(
//         () => mockRepository.signIn(
//           email: any(named: 'email'),
//           password: any(named: 'password'),
//           tenantId: any(named: 'tenantId'),
//         ),
//       ).thenAnswer((_) async => Right(tTokens));

//       // Act
//       final result = await useCase(tParams);

//       // Assert
//       expect(result, Right(tTokens));
//       verify(
//         () => mockRepository.signIn(
//           email: tParams.email,
//           password: tParams.password,
//           tenantId: tParams.tenantId,
//         ),
//       ).called(1);
//     });

//     test('should return UnauthorizedFailure on invalid credentials', () async {
//       // Arrange
//       when(
//         () => mockRepository.signIn(
//           email: any(named: 'email'),
//           password: any(named: 'password'),
//           tenantId: any(named: 'tenantId'),
//         ),
//       ).thenAnswer((_) async => const Left(UnauthorizedFailure()));

//       // Act
//       final result = await useCase(tParams);

//       // Assert
//       expect(result, const Left(UnauthorizedFailure()));
//     });
//   });
// }
