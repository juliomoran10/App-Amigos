const {
  isUserInConversation,
  getConversationsForUser,
  getMessagesForConversation,
  getPeerForConversation,
  createMessage,
  touchConversation,
  markConversationRead
} = require('../db/chats');

async function getConversations(userId, search = '') {
  const rows = await getConversationsForUser(userId, search);

  return rows.map((row) => ({
    id: row.id,
    updatedAt: row.updated_at,
    peer: {
      id: row.peer_id,
      name: row.peer_name,
      avatarUrl: row.peer_avatar
    },
    lastMessage: row.last_message_id
      ? {
          id: row.last_message_id,
          text: row.last_message_text,
          imageUrl: row.last_message_image,
          createdAt: row.last_message_at,
          senderId: row.last_message_sender,
          isRead: row.last_message_read
        }
      : null
  }));
}

async function getMessages(userId, conversationId, page, limit) {
  const allowed = await isUserInConversation({ conversationId, userId });
  if (!allowed) {
    throw Object.assign(new Error('not_in_conversation'), { status: 403 });
  }

  return getMessagesForConversation({ conversationId, page, limit });
}

module.exports = {
  isUserInConversation,
  getConversations,
  getMessages,
  getPeerForConversation,
  createMessage,
  touchConversation,
  markConversationRead
};
