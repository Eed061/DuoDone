const TOKEN_KEY = 'dd_token';
const SPACE_KEY = 'dd_space';

const isNativeCapacitor =
  typeof window !== 'undefined' &&
  (window.location.protocol === 'capacitor:' ||
    Boolean((window as any).Capacitor?.isNativePlatform?.()) ||
    (window.location.hostname === 'localhost' && !window.location.port));

export const API_ORIGIN: string = (
  (import.meta as any).env?.VITE_API_ORIGIN || (isNativeCapacitor ? 'https://duo-done.vercel.app' : '')
).replace(/\/+$/, '');

export function resolveMediaUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith('/') && API_ORIGIN) return `${API_ORIGIN}${url}`;
  return url;
}

// Only the session token and active space ID are cached on the client. Everything else lives on the server.
const mem: Record<string, string | null> = {};
export const store = {
  get(k: string): string | null {
    try {
      return window.localStorage.getItem(k) ?? mem[k] ?? null;
    } catch {
      return mem[k] ?? null;
    }
  },
  set(k: string, v: string | null) {
    mem[k] = v;
    try {
      if (v == null) window.localStorage.removeItem(k);
      else window.localStorage.setItem(k, v);
    } catch {
      /* private mode / quota — memory fallback */
    }
  },
};

let token: string | null = store.get(TOKEN_KEY);
export const getToken = () => token;
export const setToken = (t: string | null) => {
  token = t;
  store.set(TOKEN_KEY, t);
};
export const getSavedSpace = () => store.get(SPACE_KEY);
export const saveSpace = (id: string | null) => store.set(SPACE_KEY, id);

export class ApiError extends Error {
  constructor(public status: number, public code: string) {
    super(code);
  }
}

async function request<T>(method: string, path: string, body?: unknown, timeoutMs = 20000): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  let res: Response;
  try {
    const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
    res = await fetch(`${API_ORIGIN}/api${path}`, {
      method,
      headers: {
        ...(body && !isForm ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? (isForm ? (body as FormData) : JSON.stringify(body)) : undefined,
      cache: 'no-store',
      signal: ctrl.signal,
    });
  } catch {
    throw new ApiError(0, 'network_error');
  } finally {
    clearTimeout(timer);
  }
  let data: any = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  if (!res.ok) throw new ApiError(res.status, data?.error || 'server_error');
  return data as T;
}

export const api = {
  get: <T>(p: string) => request<T>('GET', p),
  post: <T>(p: string, b?: unknown) => request<T>('POST', p, b ?? {}),
  patch: <T>(p: string, b: unknown) => request<T>('PATCH', p, b),
  del: <T>(p: string) => request<T>('DELETE', p),
  upload: async (blob: Blob, spaceId?: string) => {
    const fd = new FormData();
    if (spaceId) fd.append('spaceId', spaceId);
    const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
    fd.append('file', blob, `photo.${ext}`);
    const r = await request<{ url: string }>('POST', '/upload', fd, 90000);
    return r.url;
  },
};
