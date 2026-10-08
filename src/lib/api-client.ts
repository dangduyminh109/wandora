let refreshing: Promise<Response> | undefined;
export function refreshSession() {
  refreshing ??= fetch('/api/auth/refresh', { method: 'POST' }).finally(() => { refreshing = undefined; });
  return refreshing;
}
export async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const send = () => fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...options?.headers } });
  let response = await send();
  if (response.status === 401 && !url.startsWith('/api/auth/')) {
    if ((await refreshSession()).ok) response = await send();
  }
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? 'Không thể hoàn tất yêu cầu.');
  return body as T;
}
