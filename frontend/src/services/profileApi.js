import { request } from './apiClient';

export function getProfileApi() {
  return request('/users/me', { auth: true });
}

export function updateProfileApi(payload) {
  return request('/users/me', {
    method: 'PUT',
    auth: true,
    body: JSON.stringify(payload)
  });
}
