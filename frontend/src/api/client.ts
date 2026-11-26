import type { ApiErrorResponse } from "../types/api";

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const API_BASE_URL = (
  configuredApiUrl ?? (import.meta.env.DEV ? "http://localhost:3000" : "")
).replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  details?: ApiErrorResponse["errors"];

  constructor(status: number, response: ApiErrorResponse) {
    super(response.message);
    this.name = "ApiError";
    this.status = status;
    this.details = response.errors;
  }
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof value.message === "string"
  );
}

type ApiRequestOptions = RequestInit & { token?: string };

async function apiRequest<T>(
  path: string,
  { token, ...options }: ApiRequestOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const errorResponse = isApiErrorResponse(payload)
      ? payload
      : { message: "No se pudo completar la solicitud" };

    throw new ApiError(response.status, errorResponse);
  }

  return payload as T;
}

export function apiGet<T>(
  path: string,
  options?: ApiRequestOptions,
): Promise<T> {
  return apiRequest<T>(path, options);
}

export function apiPost<TResponse, TBody>(
  path: string,
  body: TBody,
  token?: string,
): Promise<TResponse> {
  return apiRequest<TResponse>(path, {
    method: "POST",
    token,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

export function apiPut<TResponse, TBody>(
  path: string,
  body: TBody,
  token: string,
): Promise<TResponse> {
  return apiRequest<TResponse>(path, {
    method: "PUT",
    token,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

export function apiPatch<TResponse, TBody>(
  path: string,
  body: TBody,
  token: string,
): Promise<TResponse> {
  return apiRequest<TResponse>(path, {
    method: "PATCH",
    token,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

export function apiDelete<TResponse>(
  path: string,
  token: string,
): Promise<TResponse> {
  return apiRequest<TResponse>(path, { method: "DELETE", token });
}

export async function apiDownload(path: string, token: string): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Accept: "application/pdf", Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    const errorResponse = isApiErrorResponse(payload)
      ? payload
      : { message: "No se pudo descargar el archivo" };

    throw new ApiError(response.status, errorResponse);
  }

  return response.blob();
}
