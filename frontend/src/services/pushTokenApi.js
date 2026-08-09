import { request } from './apiClient';

export function savePushTokenApi(token) {
  return request('/users/me/push-token', {
    method: 'PUT',
    auth: true,
    body: JSON.stringify({ token })
  });
}
