function mapUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    username: row.username,
    email: row.email,
    password: row.password,
    name: row.display_name,
    displayName: row.display_name,
    bio: row.bio,
    birthDate: row.birth_date,
    avatar: row.avatar,
    avatarUrl: row.avatar,
    verified: row.verified,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapMessage(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    text: row.text,
    imageUrl: row.image_url,
    isRead: row.is_read,
    createdAt: row.created_at
  };
}

module.exports = { mapUser, mapMessage };
