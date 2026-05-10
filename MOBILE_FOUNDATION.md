# DeltaLabs Mobile Foundation

Enterprise Flutter architecture for a multi-tenant educational ecosystem.

---

## Architecture Overview

**Pattern**: Clean Architecture + Feature-First Modular Structure  
**State Management**: Riverpod 2.x (riverpod_annotation + code generation)  
**Routing**: GoRouter with guarded routes  
**Database**: Drift (SQLite) for offline-first  
**Network**: Dio with auth interceptor + retry interceptor  
**Realtime**: WebSocket (web_socket_channel) with reconnection  
**DI**: GetIt service locator (bootstrapped before widget tree)

---

## Folder Structure

```
lib/
├── main.dart                    # Entry point
├── bootstrap.dart               # App initialization (Firebase, DI, config)
├── firebase_options.dart        # Firebase config (run flutterfire configure)
│
├── app/
│   └── app.dart                 # Root MaterialApp.router
│
├── core/
│   ├── config/
│   │   ├── environment.dart     # dev / staging / production
│   │   └── app_config.dart      # URLs, timeouts, feature flags
│   ├── di/
│   │   └── service_locator.dart # GetIt registrations
│   ├── domain/
│   │   ├── entity.dart          # Base entity
│   │   ├── repository.dart      # Base repository contracts
│   │   └── use_case.dart        # UseCase / NoParamsUseCase / StreamUseCase
│   ├── error/
│   │   ├── exceptions.dart      # Infrastructure exceptions
│   │   ├── failures.dart        # Domain failures (used with Either)
│   │   └── error_handler.dart   # Exception → Failure mapper
│   ├── localization/
│   │   └── app_localizations.dart
│   ├── logging/
│   │   └── app_logger.dart      # Centralized logger (Logger package)
│   ├── network/
│   │   ├── api_client.dart      # Dio wrapper
│   │   ├── interceptors/
│   │   │   ├── auth_interceptor.dart   # Bearer token + refresh
│   │   │   └── retry_interceptor.dart  # Exponential backoff
│   │   └── pagination/
│   │       └── paginated_response.dart # Cursor + offset pagination
│   ├── realtime/
│   │   ├── websocket_manager.dart  # WS lifecycle + reconnection
│   │   └── realtime_event.dart     # Typed event envelope
│   ├── routing/
│   │   ├── app_router.dart      # GoRouter config (Riverpod provider)
│   │   ├── app_routes.dart      # Route path constants
│   │   └── guards/
│   │       └── auth_guard.dart  # Auth redirect guard
│   ├── storage/
│   │   ├── secure_storage.dart  # FlutterSecureStorage wrapper
│   │   └── local_database.dart  # Drift database (sync queue + cache)
│   ├── sync/
│   │   └── sync_engine.dart     # Offline-first operation queue
│   └── theme/
│       ├── app_theme.dart       # Light/dark ThemeData
│       ├── app_colors.dart      # Token-based color system
│       ├── app_typography.dart  # Inter font text styles
│       └── app_spacing.dart     # 4pt grid spacing tokens
│
├── features/
│   ├── auth/                    # ✅ Full Clean Architecture example
│   │   ├── domain/
│   │   │   ├── entities/user.dart
│   │   │   ├── repositories/auth_repository.dart
│   │   │   └── use_cases/sign_in_use_case.dart
│   │   ├── data/
│   │   │   ├── models/user_model.dart
│   │   │   ├── data_sources/auth_remote_data_source.dart
│   │   │   └── repositories/auth_repository_impl.dart
│   │   └── presentation/
│   │       ├── providers/auth_provider.dart
│   │       └── pages/login_page.dart
│   │
│   ├── feed/                    # TikTok-style infinite scroll feed
│   ├── classes/                 # Live classes + recordings
│   ├── exams/                   # Live exams + simulations
│   ├── chat/                    # Realtime messaging
│   ├── library/                 # Online library
│   ├── tutoring/                # 1-on-1 tutoring sessions
│   ├── notifications/           # Push + in-app notifications
│   └── erp/
│       ├── hr/                  # HR management
│       └── finance/             # Finance management
│
└── shared/
    └── widgets/
        ├── loading/shimmer_loader.dart
        ├── error/error_view.dart
        └── network_image/cached_image.dart
```

---

## Feature Module Pattern

Every feature follows this exact structure:

```
feature_name/
├── domain/           # Pure Dart — no Flutter, no packages
│   ├── entities/     # Immutable domain objects (Freezed)
│   ├── repositories/ # Abstract contracts (interfaces)
│   └── use_cases/    # Business logic (UseCase<T, P>)
├── data/             # Infrastructure implementation
│   ├── models/       # DTOs with fromJson/toDomain()
│   ├── data_sources/ # Remote (API) + Local (Drift)
│   └── repositories/ # Concrete repository implementations
└── presentation/     # Flutter UI
    ├── providers/    # Riverpod notifiers + providers
    ├── pages/        # Full-screen pages
    └── widgets/      # Feature-specific widgets
```

---

## Getting Started

### 1. Install dependencies
```bash
cd deltalabs-mobile
flutter pub get
```

### 2. Configure Firebase
```bash
# Install FlutterFire CLI
dart pub global activate flutterfire_cli

# Configure (replace with your Firebase project)
flutterfire configure
```

### 3. Run code generation
```bash
dart run build_runner build --delete-conflicting-outputs
```

### 4. Run the app
```bash
# Development
flutter run --dart-define=ENVIRONMENT=development

# Staging
flutter run --dart-define=ENVIRONMENT=staging

# Production
flutter run --dart-define=ENVIRONMENT=production
```

### 5. Run tests
```bash
flutter test
```

---

## Environment Configuration

Set via `--dart-define=ENVIRONMENT=<value>`:

| Environment | API Base URL | Logging | Crashlytics | Analytics |
|-------------|-------------|---------|-------------|-----------|
| development | api.dev.deltalabs.io | ✅ | ❌ | ❌ |
| staging | api.staging.deltalabs.io | ✅ | ✅ | ❌ |
| production | api.deltalabs.io | ❌ | ✅ | ✅ |

---

## Code Generation

Run after modifying any `@freezed`, `@riverpod`, `@JsonSerializable`, or Drift table:

```bash
dart run build_runner build --delete-conflicting-outputs
```

Watch mode during development:
```bash
dart run build_runner watch --delete-conflicting-outputs
```

---

## Key Engineering Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| State management | Riverpod 2.x | Compile-time safety, code gen, module isolation, async orchestration |
| Error handling | Either (dartz) | Functional, explicit, no exception leakage across layers |
| Local DB | Drift | Type-safe SQL, migrations, reactive streams, Dart-native |
| Routing | GoRouter | Declarative, deep link support, shell routes, guard support |
| DI | GetIt | Fast, simple, no build_runner needed for DI itself |
| HTTP | Dio | Interceptors, cancellation, multipart, mature ecosystem |
| Realtime | WebSocket + RxDart | Full control, reconnection logic, event routing |
| Fonts | Inter (Google Fonts) | Clean, readable, enterprise-appropriate |
