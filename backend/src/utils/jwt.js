const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET || 'friendmatch_dev_secret';
const sessionExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
const resetExpiresIn = process.env.JWT_RESET_EXPIRES_IN || '5m';
const confirmExpiresIn = process.env.JWT_CONFIRM_EXPIRES_IN || '24h';

function signToken(payload, expiresIn) {
  return jwt.sign(payload, secret, { expiresIn });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
}

function generateSessionToken(user) {
  return signToken(
    {
      type: 'session',
      id: user.id,
      username: user.username,
      email: user.email,
      verified: user.verified
    },
    sessionExpiresIn
  );
}

function generateRecoveryToken(user) {
  return signToken(
    {
      type: 'recovery',
      id: user.id,
      username: user.username,
      email: user.email
    },
    resetExpiresIn
  );
}

function generateConfirmToken(user) {
  return signToken(
    {
      type: 'confirm',
      id: user.id,
      email: user.email
    },
    confirmExpiresIn
  );
}

module.exports = {
  generateSessionToken,
  generateRecoveryToken,
  generateConfirmToken,
  verifyToken
};
