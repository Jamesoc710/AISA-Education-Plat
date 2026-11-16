/** Where a signed-in person lands when no destination was requested. */
export const DEFAULT_SIGNED_IN_PATH = "/home";

const AUTH_PATHS = ["/login", "/signup", "/forgot-password"];

/**
 * A `?next=` value is user-controlled, so only same-site paths are followed.
 * "//host" and "/\host" are treated as absolute URLs by browsers, and
 * "/@host" becomes one when appended to an origin without a slash.
 */
export function safeNextPath(
  value: string | null | undefined,
  fallback: string = DEFAULT_SIGNED_IN_PATH,
): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  if (/[\\\u0000-\u001f]/.test(value)) return fallback;
  // Sending someone back to an auth screen after they signed in is a loop.
  const pathname = value.split(/[?#]/)[0];
  if (AUTH_PATHS.includes(pathname) || pathname.startsWith("/auth/")) return fallback;
  return value;
}
