const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET || 'friendmatch_dev_secret';

function setupSocketAuth(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('Authentication error: Token required'));
    }

    try {
      const decoded = jwt.verify(token, secret);
      if (!decoded || decoded.type !== 'session' || !decoded.id) {
        return next(new Error('Authentication error: Invalid token'));
      }

      socket.userId = decoded.id;
      return next();
    } catch {
      return next(new Error('Authentication error: Invalid token'));
    }
  });
}

module.exports = { setupSocketAuth };
