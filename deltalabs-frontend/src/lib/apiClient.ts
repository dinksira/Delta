/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { getPublicApiBaseUrl } from "@/lib/config";
import { ApiError, type ApiRequestInit, type HttpMethod } from "@/lib/apiClient.types";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
export { ApiError, type ApiRequestInit, type HttpMethod } from "@/lib/apiClient.types";

type AccessTokenGetter = () => string | null | undefined;

let accessTokenGetter: AccessTokenGetter | undefined;

/**
 * Register how the client resolves bearer tokens (e.g. from `Auth_Context`).
 * Call once when auth state is available; safe to replace on logout/login.
 */
export function setApiAccessTokenGetter(getter: AccessTokenGetter | undefined): void {
  accessTokenGetter = getter;
}

function generateRequestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function buildUrl(path: string, searchParams?: ApiRequestInit["searchParams"]): string {
  const base = getPublicApiBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (!base) {
    if (!searchParams) {
      return normalizedPath;
    }

    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value === undefined || value === null) {
        continue;
      }
      params.set(key, String(value));
    }
    const qs = params.toString();
    return qs ? `${normalizedPath}?${qs}` : normalizedPath;
  }

  const url = new URL(`${base}${normalizedPath}`);
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value === undefined || value === null) {
        continue;
      }
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

function extractMessageFromBody(body: unknown, fallback: string): string {
  if (body === null || body === undefined) {
    return fallback;
  }
  if (typeof body === "string" && body.trim().length > 0) {
    const lowered = body.trim().toLowerCase();
    if (lowered.startsWith("<!doctype html") || lowered.startsWith("<html")) {
      return "Received HTML instead of JSON. Check NEXT_PUBLIC_API_BASE_URL and ensure it points to the backend API server.";
    }
    return body;
  }
  if (typeof body === "object" && "message" in body) {
    const msg = (body as { message: unknown }).message;
    if (typeof msg === "string" && msg.length > 0) {
      return msg;
    }
  }
  if (typeof body === "object" && "error" in body) {
    const err = (body as { error: unknown }).error;
    if (typeof err === "string" && err.length > 0) {
      return err;
    }
  }
  if (typeof body === "object" && "detail" in body) {
    const detail = (body as { detail: unknown }).detail;
    if (typeof detail === "string" && detail.trim().length > 0) {
      if (detail === "Not Found" && fallback.startsWith("Request failed with status 404")) {
        return "That API path was not found. If you just added backend routes, restart the API server (uvicorn) so it picks them up.";
      }
      return detail;
    }
    if (detail !== null && typeof detail === "object" && "message" in detail) {
      const msg = (detail as { message: unknown }).message;
      if (typeof msg === "string" && msg.length > 0) {
        return msg;
      }
    }
  }
  return fallback;
}

function extractCodeFromBody(body: unknown): string | undefined {
  if (body !== null && typeof body === "object") {
    if ("code" in body) {
      const code = (body as { code: unknown }).code;
      if (typeof code === "string") {
        return code;
      }
    }
    if ("detail" in body) {
      const detail = (body as { detail: unknown }).detail;
      if (detail !== null && typeof detail === "object" && "code" in detail) {
        const nested = (detail as { code: unknown }).code;
        if (typeof nested === "string") {
          return nested;
        }
      }
    }
  }
  return undefined;
}

async function parseBody(res: Response): Promise<unknown> {
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const text = await res.text();
    if (text.length === 0) {
      return undefined;
    }
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  }
  return res.text();
}

function toApiError(status: number, body: unknown, requestId: string | undefined): ApiError {
  const fallback = `Request failed with status ${status}`;
  return new ApiError(extractMessageFromBody(body, fallback), {
    status,
    code: extractCodeFromBody(body),
    requestId,
    details: body,
  });
}

async function request<T>(method: HttpMethod, path: string, init: ApiRequestInit = {}): Promise<T> {
  const { json, searchParams, headers: initHeaders, ...rest } = init;
  const url = buildUrl(path, searchParams);
  const requestId = generateRequestId();

  const headers = new Headers(initHeaders);
  if (!headers.has("X-Request-Id")) {
    headers.set("X-Request-Id", requestId);
  }

  const token = accessTokenGetter?.();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let body: BodyInit | undefined;
  if (json !== undefined) {
    headers.set("Content-Type", headers.get("Content-Type") ?? "application/json");
    body = JSON.stringify(json);
  }

  const res = await fetch(url, {
    ...rest,
    method,
    headers,
    body,
  });

  const responseRequestId = res.headers.get("x-request-id") ?? requestId;
  const parsed = await parseBody(res);

  if (!res.ok) {
    throw toApiError(res.status, parsed, responseRequestId);
  }

  return parsed as T;
}

/** Typed HTTP helpers; all paths are relative to `NEXT_PUBLIC_API_BASE_URL` when set. */
export const apiClient = {
  get: <T>(path: string, init?: Omit<ApiRequestInit, "json">) => request<T>("GET", path, init),
  post: <T>(path: string, init?: ApiRequestInit) => request<T>("POST", path, init),
  put: <T>(path: string, init?: ApiRequestInit) => request<T>("PUT", path, init),
  patch: <T>(path: string, init?: ApiRequestInit) => request<T>("PATCH", path, init),
  delete: <T>(path: string, init?: ApiRequestInit) => request<T>("DELETE", path, init),
  rawRequest: request,
} as const;
/** ################################ /COMPONENT ############################# */
