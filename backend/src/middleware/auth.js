const { SessionWrapper } = require('../session/sessionWrapper');

const sessionWrapper = new SessionWrapper();

async function authenticate(req, res, next) {
  const sessionData = await sessionWrapper.resolveSession(req);

  if (!sessionData || !sessionWrapper.authenticate(req)) {
    return res.status(401).json({
      ok: false,
      error: 'unauthorized'
    });
  }

  return next();
}

module.exports = { authenticate, sessionWrapper };
