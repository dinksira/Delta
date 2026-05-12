/// Defines the runtime environment of the application.
enum Environment {
  development,
  staging,
  production;

  /// Reads the environment from the --dart-define=ENVIRONMENT=xxx flag.
  /// Defaults to development if not set.
  static Environment get current {
    const env = String.fromEnvironment('ENVIRONMENT', defaultValue: 'development');
    return Environment.values.firstWhere(
      (e) => e.name == env,
      orElse: () => Environment.development,
    );
  }

  bool get isDevelopment => this == Environment.development;
  bool get isStaging => this == Environment.staging;
  bool get isProduction => this == Environment.production;
}
