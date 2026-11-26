import type { SessionUser } from "../types/auth";
import { apiGet, apiPost } from "./client";

interface Credentials {
  email: string;
  password: string;
}

interface Registration extends Credentials {
  nombre: string;
}

export async function register(details: Registration): Promise<string> {
  const response = await apiPost<{ data: { email: string } }, Registration>(
    "/api/auth/register",
    details,
  );
  return response.data.email;
}

export async function login(credentials: Credentials): Promise<string> {
  const response = await apiPost<{ token: string }, Credentials>(
    "/api/auth/login",
    credentials,
  );
  return response.token;
}

export async function getCurrentSession(
  token: string,
  signal?: AbortSignal,
): Promise<SessionUser> {
  const response = await apiGet<{ data: SessionUser }>("/api/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal,
  });
  return response.data;
}
