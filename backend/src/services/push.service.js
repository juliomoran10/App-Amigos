const { Expo } = require('expo-server-sdk');
const { query } = require('../db/pool');

let expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN || undefined });

async function getPushToken(userId) {
  const result = await query('SELECT push_token FROM users WHERE id = $1', [userId]);
  return result.rows[0]?.push_token || null;
}

async function sendPush({ to, title, body, data }) {
  if (!to || !Expo.isExpoPushToken(to)) {
    return null;
  }

  const message = {
    to,
    sound: 'default',
    title,
    body,
    data: data || {}
  };

  try {
    const chunks = expo.chunkPushNotifications([message]);
    const tickets = [];

    for (const chunk of chunks) {
      const result = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...result);
    }

    return tickets;
  } catch (error) {
    console.error('[push] send error:', error.message);
    return null;
  }
}

module.exports = { sendPush, getPushToken };
