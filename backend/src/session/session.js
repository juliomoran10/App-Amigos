const bcrypt = require('bcrypt');
const { randomUUID } = require('crypto');
const {
  findUserByUsername,
  findUserByEmail,
  findUserById,
  createUser,
  updateUser
} = require('../db/persistence');
const { validateRegister, validateLogin } = require('../utils/validation');

const SALT_ROUNDS = 10;

function slugFromEmail(email) {
  return String(email)
    .split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .slice(0, 20);
}

function stripPassword(user) {
  if (!user) {
    return null;
  }

  const { password, ...publicUser } = user;
  return publicUser;
}

class Session {
  async register({ username, email, password, name, birthDate, bio, avatar }) {
    const validation = validateRegister({ username, email, password, name });
    if (!validation.ok) {
      throw new Error(validation.error);
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedUsername = String(username || '').trim() || slugFromEmail(normalizedEmail);

    if (await findUserByUsername(normalizedUsername)) {
      throw new Error('username_exists');
    }

    if (await findUserByEmail(normalizedEmail)) {
      throw new Error('email_exists');
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await createUser({
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword,
      name: String(name || '').trim(),
      birthDate: birthDate || null,
      avatar: avatar || null,
      bio: String(bio || '').trim() || null,
      verified: true
    });

    return stripPassword(user);
  }

  async login({ username, password }) {
    const validation = validateLogin({ username, password });
    if (!validation.ok) {
      return null;
    }

    const identifier = String(username).trim();
    const user =
      (await findUserByUsername(identifier)) || (await findUserByEmail(identifier));

    if (!user) {
      return null;
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return null;
    }

    return stripPassword(user);
  }

  async getUserById(id) {
    const user = await findUserById(id);
    return stripPassword(user);
  }

  async getUserByEmail(email) {
    const user = await findUserByEmail(email);
    return stripPassword(user);
  }

  async updatePasswordById({ userId, password }) {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await updateUser(userId, { password: hashedPassword });
    return stripPassword(user);
  }

  buildSession(user, token) {
    return {
      id: randomUUID(),
      token,
      user,
      createdAt: new Date().toISOString()
    };
  }
}

module.exports = { Session };
