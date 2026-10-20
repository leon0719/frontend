import { useAuthStore } from "@/shared/auth";
import { env } from "@/shared/config";

export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;
  constructor(status: number, message: string, payload: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

type Method = "GET" | "POST" | "PUT" | "DELETE";

function resolveUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${env.apiBaseUrl}${path}`;
}

// Bearer token 只能送往 API 自家 origin(apiBaseUrl,未設定時為目前頁面 origin),
// 送往其他 host 會把使用者憑證洩漏給第三方。
function isApiOrigin(url: string): boolean {
  const apiOrigin = env.apiBaseUrl
    ? new URL(env.apiBaseUrl, location.origin).origin
    : location.origin;
  return new URL(url, location.origin).origin === apiOrigin;
}

// 支援兩種錯誤格式:頂層 { message } 與團隊後端的 BaseResponse { data, error: { code, message } }
function errorMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const p = payload as { message?: unknown; error?: { message?: unknown } | null };
  const message = p.error?.message ?? p.message;
  return message === undefined ? undefined : String(message);
}

async function parseBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function request<T>(
  method: Method,
  path: string,
  body?: unknown,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers);
  // 只在真的有 body 時標 JSON;bodyless GET/DELETE 帶 Content-Type 會多觸發 CORS preflight
  if (body !== undefined || init?.body != null) headers.set("Content-Type", "application/json");
  const url = resolveUrl(path);
  const trusted = isApiOrigin(url);
  const token = useAuthStore.getState().token;
  if (token && trusted) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(url, {
    ...init,
    method,
    headers,
    body: body === undefined ? init?.body : JSON.stringify(body),
  });

  const payload = await parseBody(res);
  if (!res.ok) {
    if (res.status === 401 && trusted) useAuthStore.getState().clear();
    const message = errorMessage(payload) ?? `${method} ${path} failed with ${res.status}`;
    throw new ApiError(res.status, message, payload);
  }
  return payload as T;
}

export function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  return request<T>("GET", path, undefined, init);
}
export function apiPost<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
  return request<T>("POST", path, body, init);
}
export function apiPut<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
  return request<T>("PUT", path, body, init);
}
export function apiDelete<T>(path: string, init?: RequestInit): Promise<T> {
  return request<T>("DELETE", path, undefined, init);
}
