const { Session } = require('./session');
const { generateSessionToken, verifyToken } = require('../utils/jwt');
const { isTokenRevoked, revokeToken } = require('../db/sessions');

class SessionWrapper {
  constructor() {
    if (SessionWrapper.instance) {
      return SessionWrapper.instance;
    }

    this.session = new Session();
    SessionWrapper.instance = this;
  }

  extractToken(req) {
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7).trim();
    }

    return req.body?.token || req.query?.token || null;
  }

  createSession(user) {
    const token = generateSessionToken(user);
    return this.session.buildSession(user, token);
  }

  setSession(req, data = {}) {
    if (!req.sessionData) {
      req.sessionData = {};
    }

    req.sessionData = { ...req.sessionData, ...data };
    return req.sessionData;
  }

  sessionExists(req) {
    return Boolean(req.sessionData && Object.keys(req.sessionData).length > 0);
  }

  getSession(req) {
    return req.sessionData || null;
  }

  authenticate(req) {
    return Boolean(req.sessionData?.user);
  }

  getUserId(req) {
    return (
      req.sessionData?.user?.id ||
      req.sessionData?.user?.user_id ||
      null
    );
  }

  async resolveSession(req) {
    const token = this.extractToken(req);
    if (!token) {
      return null;
    }

    if (await isTokenRevoked(token)) {
      return null;
    }

    const payload = verifyToken(token);
    if (!payload || payload.type !== 'session' || !payload.id) {
      return null;
    }

    const user = await this.session.getUserById(payload.id);
    if (!user) {
      return null;
    }

    return this.setSession(req, {
      token,
      user,
      payload
    });
  }

  async destroySession(req) {
    if (!this.sessionExists(req)) {
      return {
        ok: false,
        statusCode: 401,
        error: 'session_required'
      };
    }

    const token = req.sessionData?.token || this.extractToken(req);
    if (token) {
      await revokeToken(token);
    }

    req.sessionData = null;

    return {
      ok: true,
      statusCode: 200,
      message: 'session_closed_success'
    };
  }
}

module.exports = { SessionWrapper };
