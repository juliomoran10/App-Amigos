import { request } from './apiClient';

export function fetchFeedApi(limit = 20) {
  return request(`/users/feed?limit=${limit}`, { auth: true });
}

export function postSwipeApi({ targetUserId, direction }) {
  return request('/swipes', {
    method: 'POST',
    auth: true,
    body: JSON.stringify({ targetUserId, direction })
  });
}
