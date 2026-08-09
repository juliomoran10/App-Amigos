const { query } = require('./pool');

async function isTokenRevoked(token) {
  const result = await query('SELECT 1 FROM revoked_tokens WHERE token = $1 LIMIT 1', [token]);
  return result.rowCount > 0;
}

async function revokeToken(token) {
  await query(
    `INSERT INTO revoked_tokens (token)
     VALUES ($1)
     ON CONFLICT (token) DO NOTHING`,
    [token]
  );
}

module.exports = {
  isTokenRevoked,
  revokeToken
};
