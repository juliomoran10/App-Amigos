import { API_BASE_URL } from '../config/api';
import { getToken, clearToken } from './sessionStorage';
import { emitSessionExpired } from './sessionEvents';

export async function request(path, options = {}) {
  const headers = {
    ...(options.headers || {})
  };

  if (options.body != null) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.auth) {
    const token = await getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers
    });
  } catch {
    const error = new Error('network_error');
    error.payload = { error: 'network_error' };
    throw error;
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && options.auth) {
      await clearToken();
      emitSessionExpired();
    }

    const error = new Error(payload?.error || 'request_failed');
    error.payload = payload;
    error.status = response.status;
    throw error;
  }

  return payload;
}
