import 'package:deltalabs_mobile/core/network/api_client.dart';
import 'package:deltalabs_mobile/features/auth/domain/repositories/auth_repository.dart';

// ── Data Models ───────────────────────────────────────────────────────────────

/// State returned by each signup flow step.
class SignupFlowState {
  const SignupFlowState({
    required this.flowId,
    required this.currentStep,
    required this.completedSteps,
    this.username,
  });

  final String flowId;
  final String currentStep;
  final List<String> completedSteps;
  final String? username;

  factory SignupFlowState.fromJson(Map<String, dynamic> json) {
    return SignupFlowState(
      flowId: json['flow_id'] as String,
      currentStep: json['current_step'] as String,
      completedSteps: (json['completed_steps'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      username: json['username'] as String?,
    );
  }
}

/// Response from sending a verification code.
class VerificationSent {
  const VerificationSent({
    required this.verificationId,
    required this.channel,
    required this.destinationMasked,
    required this.expiresInSeconds,
    required this.resendAvailableInSeconds,
    required this.status,
    this.debugCode,
  });

  final String verificationId;
  final String channel;
  final String destinationMasked;
  final int expiresInSeconds;
  final int resendAvailableInSeconds;
  final String status;
  final String? debugCode;

  factory VerificationSent.fromJson(Map<String, dynamic> json) {
    return VerificationSent(
      verificationId: json['verification_id'] as String,
      channel: json['channel'] as String,
      destinationMasked: json['destination_masked'] as String,
      expiresInSeconds: json['expires_in_seconds'] as int,
      resendAvailableInSeconds: json['resend_available_in_seconds'] as int,
      status: json['status'] as String,
      debugCode: json['debug_code'] as String?,
    );
  }
}

/// Response from verifying a code.
class VerificationResult {
  const VerificationResult({
    required this.verificationId,
    required this.verified,
    required this.status,
  });

  final String verificationId;
  final bool verified;
  final String status;

  factory VerificationResult.fromJson(Map<String, dynamic> json) {
    return VerificationResult(
      verificationId: json['verification_id'] as String,
      verified: json['verified'] as bool,
      status: json['status'] as String,
    );
  }
}

// ── Abstract Interface ────────────────────────────────────────────────────────

abstract class RegisterRemoteDataSource {
  /// POST /auth/signup/step/identity — { username }
  Future<SignupFlowState> stepIdentity(String username);

  /// POST /auth/signup/step/contact — { flow_id, email?, phone_e164? }
  Future<SignupFlowState> stepContact({
    required String flowId,
    String? email,
    String? phoneE164,
  });

  /// POST /auth/verification/send — { channel, destination, purpose: "signup" }
  Future<VerificationSent> sendVerification({
    required String channel,
    required String destination,
  });

  /// POST /auth/verification/verify — { verification_id, code }
  Future<VerificationResult> verifyCode({
    required String verificationId,
    required String code,
  });

  /// POST /auth/signup/step/verification — { flow_id, verification_id }
  Future<SignupFlowState> stepVerification({
    required String flowId,
    required String verificationId,
  });

  /// POST /auth/signup/step/dob — { flow_id, date_of_birth }
  Future<SignupFlowState> stepDob({
    required String flowId,
    required String dateOfBirth,
  });

  /// POST /auth/signup/complete — { flow_id, password }
  Future<AuthSession> complete({
    required String flowId,
    required String password,
  });
}

// ── Implementation ────────────────────────────────────────────────────────────

class RegisterRemoteDataSourceImpl implements RegisterRemoteDataSource {
  RegisterRemoteDataSourceImpl({required this.apiClient});

  final ApiClient apiClient;

  @override
  Future<SignupFlowState> stepIdentity(String username) async {
    final response = await apiClient.post<Map<String, dynamic>>(
      '/auth/signup/step/identity',
      data: {'username': username},
    );
    return SignupFlowState.fromJson(response.data!);
  }

  @override
  Future<SignupFlowState> stepContact({
    required String flowId,
    String? email,
    String? phoneE164,
  }) async {
    final body = <String, dynamic>{'flow_id': flowId};
    if (email != null && email.isNotEmpty) body['email'] = email;
    if (phoneE164 != null && phoneE164.isNotEmpty) body['phone_e164'] = phoneE164;

    final response = await apiClient.post<Map<String, dynamic>>(
      '/auth/signup/step/contact',
      data: body,
    );
    return SignupFlowState.fromJson(response.data!);
  }

  @override
  Future<VerificationSent> sendVerification({
    required String channel,
    required String destination,
  }) async {
    final response = await apiClient.post<Map<String, dynamic>>(
      '/auth/verification/send',
      data: {
        'channel': channel,
        'destination': destination,
        'purpose': 'signup',
      },
    );
    return VerificationSent.fromJson(response.data!);
  }

  @override
  Future<VerificationResult> verifyCode({
    required String verificationId,
    required String code,
  }) async {
    final response = await apiClient.post<Map<String, dynamic>>(
      '/auth/verification/verify',
      data: {
        'verification_id': verificationId,
        'code': code,
      },
    );
    return VerificationResult.fromJson(response.data!);
  }

  @override
  Future<SignupFlowState> stepVerification({
    required String flowId,
    required String verificationId,
  }) async {
    final response = await apiClient.post<Map<String, dynamic>>(
      '/auth/signup/step/verification',
      data: {
        'flow_id': flowId,
        'verification_id': verificationId,
      },
    );
    return SignupFlowState.fromJson(response.data!);
  }

  @override
  Future<SignupFlowState> stepDob({
    required String flowId,
    required String dateOfBirth,
  }) async {
    final response = await apiClient.post<Map<String, dynamic>>(
      '/auth/signup/step/dob',
      data: {
        'flow_id': flowId,
        'date_of_birth': dateOfBirth,
      },
    );
    return SignupFlowState.fromJson(response.data!);
  }

  @override
  Future<AuthSession> complete({
    required String flowId,
    required String password,
  }) async {
    final response = await apiClient.post<Map<String, dynamic>>(
      '/auth/signup/complete',
      data: {
        'flow_id': flowId,
        'password': password,
      },
    );

    final data = response.data!;
    final session = data['session'] as Map<String, dynamic>;
    final user = data['user'] as Map<String, dynamic>;

    return AuthSession(
      accessToken: data['access_token'] as String,
      sessionId: session['session_id'] as String,
      userId: session['user_id'] as String,
      expiresAt: DateTime.parse(session['expires_at'] as String),
      user: AuthUser(
        userId: user['user_id'] as String,
        username: user['username'] as String,
        email: user['email'] as String?,
        phoneE164: user['phone_e164'] as String?,
        isVerified: user['is_verified'] as bool? ?? false,
      ),
    );
  }
}
