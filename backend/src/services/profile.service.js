const { updateUser, findUserByUsername } = require('../db/persistence');

function stripPassword(user) {
  if (!user) {
    return null;
  }
  const { password, ...publicUser } = user;
  return publicUser;
}

async function updateProfile({ userId, payload }) {
  const updates = {};

  if (payload.username !== undefined) {
    const username = String(payload.username).trim().toLowerCase();
    if (username.length < 3 || username.length > 20 || !/^[a-z0-9_]+$/.test(username)) {
      throw Object.assign(new Error('invalid_username'), { status: 400 });
    }
    const existing = await findUserByUsername(username);
    if (existing && existing.id !== userId) {
      throw Object.assign(new Error('username_exists'), { status: 409 });
    }
    updates.username = username;
  }

  if (payload.name !== undefined) {
    updates.name = String(payload.name).trim();
  }
  if (payload.bio !== undefined) {
    updates.bio = String(payload.bio).trim() || null;
  }
  if (payload.birthDate !== undefined) {
    updates.birthDate = payload.birthDate || null;
  }
  if (payload.avatar !== undefined) {
    updates.avatar = String(payload.avatar).trim() || null;
  }

  if (updates.name !== undefined && !updates.name) {
    throw Object.assign(new Error('missing_fields'), { status: 400 });
  }

  const user = await updateUser(userId, updates);

  if (!user) {
    throw Object.assign(new Error('user_not_found'), { status: 404 });
  }

  return stripPassword(user);
}

module.exports = { updateProfile };
