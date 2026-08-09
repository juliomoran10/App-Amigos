import { request } from './apiClient';
import { API_BASE_URL } from '../config/api';
import { getToken } from './sessionStorage';
import { File } from 'expo-file-system';

export function fetchConversationsApi(search = '') {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return request(`/chats/conversations${query}`, { auth: true });
}

export function fetchMessagesApi(conversationId, page = 1, limit = 30) {
  return request(`/chats/conversations/${conversationId}/messages?page=${page}&limit=${limit}`, {
    auth: true
  });
}

export function markConversationReadApi(conversationId) {
  return request(`/chats/conversations/${conversationId}/read`, {
    method: 'POST',
    auth: true
  });
}

export async function uploadImageApi(uri) {
  const token = await getToken();

  const formData = new FormData();
  formData.append('image', new File(uri));

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
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
