const { query } = require('./pool');
const { mapUser } = require('./mappers');

async function getAllUsers() {
  const result = await query('SELECT * FROM users WHERE deleted_at IS NULL ORDER BY created_at ASC');
  return result.rows.map(mapUser);
}

async function findUserByUsername(username) {
  const normalized = String(username || '').trim().toLowerCase();
  const result = await query('SELECT * FROM users WHERE LOWER(username) = $1 AND deleted_at IS NULL LIMIT 1', [normalized]);
  return mapUser(result.rows[0]);
}

async function findUserByEmail(email) {
  const normalized = String(email || '').trim().toLowerCase();
  const result = await query('SELECT * FROM users WHERE LOWER(email) = $1 AND deleted_at IS NULL LIMIT 1', [normalized]);
  return mapUser(result.rows[0]);
}

async function findUserById(id) {
  const result = await query('SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL LIMIT 1', [id]);
  return mapUser(result.rows[0]);
}

async function createUser(userData) {
  const result = await query(
    `INSERT INTO users (username, email, password, display_name, avatar, bio, birth_date, verified)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      userData.username,
      userData.email,
      userData.password,
      userData.name || userData.username,
      userData.avatar || null,
      userData.bio || null,
      userData.birthDate || null,
      userData.verified ?? true
    ]
  );

  return mapUser(result.rows[0]);
}

async function updateUser(id, updates) {
  const fields = [];
  const values = [];
  let index = 1;

  const mapping = {
    username: 'username',
    email: 'email',
    password: 'password',
    name: 'display_name',
    bio: 'bio',
    birthDate: 'birth_date',
    avatar: 'avatar',
    pushToken: 'push_token',
    verified: 'verified'
  };

  for (const [key, column] of Object.entries(mapping)) {
    if (updates[key] !== undefined) {
      fields.push(`${column} = $${index}`);
      values.push(updates[key]);
      index += 1;
    }
  }

  if (!fields.length) {
    return findUserById(id);
  }

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`,
    values
  );

  return mapUser(result.rows[0]);
}

async function deleteUser(id) {
  const result = await query('UPDATE users SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL', [id]);
  return result.rowCount > 0;
}

module.exports = {
  getAllUsers,
  findUserByUsername,
  findUserByEmail,
  findUserById,
  createUser,
  updateUser,
  deleteUser
};
