// src/lib/api-client.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface FetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("vetrinel_token");
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("vetrinel_token", token);
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("vetrinel_token");
}

export async function apiClient<T = unknown>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const { body, headers: customHeaders, ...restOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(customHeaders as Record<string, string>),
  };

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...restOptions,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Non-JSON bodies (204, proxy/gateway HTML errors) must not crash with a SyntaxError
  const text = await response.text();
  let data: { error?: string; message?: string } | null = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text.slice(0, 200) };
    }
  }

  if (!response.ok) {
    // Expired/invalid session: drop the token and send the user back to login
    if (response.status === 401 && token && !endpoint.startsWith("/auth/")) {
      clearToken();
      if (typeof window !== "undefined") {
        const locale = window.location.pathname.split("/")[1] || "en";
        window.location.replace(`/${["en", "ta"].includes(locale) ? locale : "en"}/login`);
      }
    }
    throw new ApiError(
      response.status,
      data?.error || data?.message || `Request failed (${response.status})`,
    );
  }

  return data as T;
}

// Convenience methods
export const api = {
  get: <T>(url: string) => apiClient<T>(url, { method: "GET" }),

  post: <T>(url: string, body?: unknown) =>
    apiClient<T>(url, { method: "POST", body }),

  put: <T>(url: string, body?: unknown) =>
    apiClient<T>(url, { method: "PUT", body }),

  patch: <T>(url: string, body?: unknown) =>
    apiClient<T>(url, { method: "PATCH", body }),

  delete: <T>(url: string) => apiClient<T>(url, { method: "DELETE" }),
};
