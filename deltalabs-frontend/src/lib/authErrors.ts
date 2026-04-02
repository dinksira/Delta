import { ApiError } from "@/lib/apiClient";

/** Maps thrown errors to user-visible auth copy. */
export function authErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}
