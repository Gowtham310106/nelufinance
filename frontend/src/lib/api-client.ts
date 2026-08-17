// src/lib/api-client.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface FetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getToken(): string | null {
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
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(response.status, data.error || data.message || "Something went wrong");
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

  delete: <T>(url: string) => apiClient<T>(url, { method: "DELETE" }),
};
