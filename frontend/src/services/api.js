const DEFAULT_API = 'http://localhost:5000/api';

function normalizeApiBase(value) {
  const raw = String(value || DEFAULT_API).trim().replace(/\/+$/, '');
  return raw.endsWith('/api') ? raw : `${raw}/api`;
}

const API = normalizeApiBase(import.meta.env.VITE_API_URL);
export const server = String(import.meta.env.VITE_SERVER_URL || API.replace(/\/api$/, '')).replace(/\/+$/, '');

export async function api(path, opts = {}) {
  const cleanPath = `/${String(path || '').replace(/^\/+/, '')}`;
  const isForm = opts.body instanceof FormData;
  const token = localStorage.getItem('token');

  const headers = {
    ...(isForm ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(opts.headers || {}),
  };

  let response;
  try {
    response = await fetch(`${API}${cleanPath}`, {
      ...opts,
      headers,
      body: isForm
        ? opts.body
        : opts.body !== undefined
          ? JSON.stringify(opts.body)
          : undefined,
    });
  } catch {
    throw new Error('Serverga ulanib bo‘lmadi. Backend ishlayotganini tekshiring.');
  }

  const data = await response.json().catch(() => ({
    success: false,
    message: 'Server javobi noto‘g‘ri formatda.',
  }));

  if (!response.ok) {
    const error = new Error(data.message || `HTTP ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}
