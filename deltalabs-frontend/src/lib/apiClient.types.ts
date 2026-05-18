/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** Normalized API failure for consistent error handling across modules. */
export interface ApiErrorPayload {
  readonly status: number;
  readonly code?: string;
  readonly requestId?: string;
  readonly details?: unknown;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly requestId?: string;
  readonly details?: unknown;

  constructor(message: string, payload: ApiErrorPayload) {
    super(message);
    this.name = "ApiError";
    this.status = payload.status;
    this.code = payload.code;
    this.requestId = payload.requestId;
    this.details = payload.details;
  }
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiRequestInit extends RequestInit {
  /** JSON-serializable body for non-GET requests. */
  readonly json?: unknown;
  /** Query parameters appended to the URL. */
  readonly searchParams?: Record<string, string | number | boolean | undefined | null>;
}
/** ################################ /COMPONENT ############################# */
