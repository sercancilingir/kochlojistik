/** Base URL for all API calls — uses EXPO_PUBLIC_DOMAIN injected at build time. */
export function getBaseUrl(): string {
  const domain = process.env['EXPO_PUBLIC_DOMAIN'];
  if (domain) return `https://${domain}`;
  return '';
}

// In-memory token for the active session. Loaded from AsyncStorage on app
// launch and cleared on logout. Set via setAuthToken() from AuthContext.
let _authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  _authToken = token;
}

export function getAuthToken(): string | null {
  return _authToken;
}

/** Fetch with Bearer token header (+ cookie fallback for web/session). */
export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string>),
  };
  if (_authToken) {
    headers['Authorization'] = `Bearer ${_authToken}`;
  }
  return fetch(`${getBaseUrl()}${path}`, {
    credentials: 'include',
    ...options,
    headers,
  });
}

/** Fetch a siber bridge view by name. Returns { columns, rows }. */
export async function fetchSiberView(
  viewName: string,
  limit = 500,
): Promise<{ columns: string[]; rows: Record<string, unknown>[] }> {
  const res = await apiFetch(`/api/siber/view/${encodeURIComponent(viewName)}?limit=${limit}`);
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<{ columns: string[]; rows: Record<string, unknown>[] }>;
}
