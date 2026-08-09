import { request } from './apiClient';
import { API_BASE_URL } from '../config/api';
import { saveToken, clearToken } from './sessionStorage';
import { File } from 'expo-file-system';

export function loginApi({ email, password }) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: email, password })
  });
}

export async function loginAndSaveSession({ email, password }) {
  const result = await loginApi({ email, password });
  await saveToken(result.session?.token);
  return result;
}

export function registerApi({ username, email, password, name, birthDate, bio, avatar }) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password, name, birthDate, bio, avatar })
  });
}

export async function uploadRegisterImageApi(uri) {
  const formData = new FormData();
  formData.append('image', new File(uri));

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/upload/register`, {
      method: 'POST',
      body: formData
    });
  } catch (err) {
    const error = new Error('network_error');
    error.payload = {
      error: 'network_error',
      message: err?.message || 'No se pudo conectar con el servidor.'
    };
    throw error;
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload?.error || 'upload_failed');
    error.payload = {
      error: payload?.error || 'upload_failed',
      message: payload?.message
    };
    error.status = response.status;
    throw error;
  }

  return payload;
}

export function forgotPasswordApi({ email }) {
  return request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
}

export function resetPasswordApi({ code, newPassword }) {
  return request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ code, newPassword })
  });
}

export function meApi() {
  return request('/auth/me', { auth: true });
}

export async function logoutApi() {
  try {
    await request('/auth/logout', { method: 'POST', auth: true });
  } finally {
    await clearToken();
  }
}

export { clearToken } from './sessionStorage';
