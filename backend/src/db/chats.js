const { query } = require('./pool');
const { mapMessage } = require('./mappers');

async function isUserInConversation({ conversationId, userId }) {
  const result = await query(
    `SELECT c.id
     FROM conversations c
     JOIN matches m ON m.id = c.match_id
     WHERE c.id = $1 AND (m.user1_id = $2 OR m.user2_id = $2)
     LIMIT 1`,
    [conversationId, userId]
  );
  return result.rowCount > 0;
}

async function getConversationsForUser(userId, search = '') {
  const result = await query(
    `SELECT c.id, c.updated_at,
            m.user1_id, m.user2_id,
            peer.id AS peer_id, peer.display_name AS peer_name, peer.avatar AS peer_avatar,
            lm.id AS last_message_id, lm.text AS last_message_text,
            lm.image_url AS last_message_image, lm.created_at AS last_message_at,
            lm.sender_id AS last_message_sender, lm.is_read AS last_message_read
     FROM conversations c
     JOIN matches m ON m.id = c.match_id
     JOIN users peer ON peer.id = CASE WHEN m.user1_id = $1 THEN m.user2_id ELSE m.user1_id END
     LEFT JOIN LATERAL (
       SELECT id, text, image_url, created_at, sender_id, is_read
       FROM messages
       WHERE conversation_id = c.id
       ORDER BY created_at DESC
       LIMIT 1
     ) lm ON true
     WHERE (m.user1_id = $1 OR m.user2_id = $1)
       AND peer.deleted_at IS NULL
       AND ($2 = '' OR LOWER(peer.display_name) LIKE '%' || LOWER($2) || '%')
     ORDER BY c.updated_at DESC`,
    [userId, String(search || '').trim()]
  );
  return result.rows;
}

async function getMessagesForConversation({ conversationId, page = 1, limit = 30 }) {
  const offset = (page - 1) * limit;

  const countResult = await query(
    'SELECT COUNT(*)::int AS total FROM messages WHERE conversation_id = $1',
    [conversationId]
  );
  const total = countResult.rows[0].total;

  const result = await query(
    `SELECT * FROM messages
     WHERE conversation_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [conversationId, limit, offset]
  );

  const messages = result.rows.map(mapMessage);
  const hasMore = offset + messages.length < total;

  return { messages, pagination: { page, total, hasMore } };
}

async function getPeerForConversation({ conversationId, userId }) {
  const result = await query(
    `SELECT u.id, u.username, u.display_name, u.avatar
     FROM conversations c
     JOIN matches m ON m.id = c.match_id
     JOIN users u ON u.id = CASE WHEN m.user1_id = $1 THEN m.user2_id ELSE m.user1_id END
     WHERE c.id = $2 AND u.deleted_at IS NULL
     LIMIT 1`,
    [userId, conversationId]
  );
  return result.rows[0] || null;
}

async function getPeerPushInfo({ conversationId, userId }) {
  const result = await query(
    `SELECT u.id, u.display_name AS name, u.push_token AS pushToken
     FROM conversations c
     JOIN matches m ON m.id = c.match_id
     JOIN users u ON u.id = CASE WHEN m.user1_id = $1 THEN m.user2_id ELSE m.user1_id END
     WHERE c.id = $2 AND u.deleted_at IS NULL
     LIMIT 1`,
    [userId, conversationId]
  );
  return result.rows[0] || null;
}

async function createMessage({ conversationId, senderId, text, imageUrl }) {
  const result = await query(
    `INSERT INTO messages (conversation_id, sender_id, text, image_url)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [conversationId, senderId, text || null, imageUrl || null]
  );
  return mapMessage(result.rows[0]);
}

async function touchConversation(conversationId) {
  await query('UPDATE conversations SET updated_at = NOW() WHERE id = $1', [conversationId]);
}

async function markConversationRead({ conversationId, userId }) {
  await query(
    `UPDATE messages SET is_read = TRUE
     WHERE conversation_id = $1 AND sender_id <> $2 AND is_read = FALSE`,
    [conversationId, userId]
  );
}

module.exports = {
  isUserInConversation,
  getConversationsForUser,
  getMessagesForConversation,
  getPeerForConversation,
  getPeerPushInfo,
  createMessage,
  touchConversation,
  markConversationRead
};
