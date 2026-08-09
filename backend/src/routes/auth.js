const express = require('express');
const { Session } = require('../session/session');
const { SessionWrapper } = require('../session/sessionWrapper');
const { Mailer } = require('../mailer/mailer');
const { generateRecoveryToken, verifyToken } = require('../utils/jwt');
const { authenticate, sessionWrapper } = require('../middleware/auth');
const {
  validateForgotPassword,
  validateResetPassword
} = require('../utils/validation');

const authRouter = express.Router();
const session = new Session();
const mailer = new Mailer();

function resolveResetBaseUrl() {
  return process.env.MOBILE_APP_URL || 'friendmatch://';
}

function mapRegisterError(error) {
  if (error.message === 'username_exists' || error.message === 'email_exists') {
    return { status: 409, error: error.message };
  }

  if (
    error.message === 'missing_fields' ||
    error.message === 'invalid_email' ||
    error.message === 'invalid_password' ||
    error.message === 'invalid_username'
  ) {
    return { status: 400, error: error.message };
  }

  return { status: 400, error: 'registration_error' };
}

authRouter.post('/register', async (req, res) => {
  try {
    const user = await session.register(req.body);

    return res.status(201).json({
      ok: true,
      user,
      message: 'User registered successfully.'
    });
  } catch (error) {
    const mapped = mapRegisterError(error);
    return res.status(mapped.status).json({
      ok: false,
      error: mapped.error
    });
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const user = await session.login(req.body);

    if (!user) {
      return res.status(401).json({
        ok: false,
        error: 'invalid_credentials'
      });
    }

    const sessionData = sessionWrapper.createSession(user);
    sessionWrapper.setSession(req, sessionData);

    return res.json({
      ok: true,
      session: sessionData
    });
  } catch (error) {
    console.error('Error in login:', error);
    return res.status(500).json({
      ok: false,
      error: 'server_error'
    });
  }
});

authRouter.get('/me', authenticate, (req, res) => {
  return res.json({
    ok: true,
    user: sessionWrapper.getSession(req).user
  });
});

authRouter.post('/logout', authenticate, async (req, res) => {
  const result = await sessionWrapper.destroySession(req);

  if (!result.ok) {
    return res.status(result.statusCode).json({
      ok: false,
      error: result.error
    });
  }

  return res.json({
    ok: true,
    message: result.message
  });
});

authRouter.post('/forgot-password', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const validation = validateForgotPassword({ email });

  if (!validation.ok) {
    return res.status(400).json({
      ok: false,
      error: validation.error
    });
  }

  try {
    await sessionWrapper.destroySession(req);

    const user = await session.getUserByEmail(email);

    if (user) {
      const token = generateRecoveryToken(user);
      await mailer.sendRecoveryEmail({
        email: user.email,
        token,
        resetBaseUrl: resolveResetBaseUrl(),
        username: user.username
      });
    }

    return res.json({
      ok: true,
      message: 'If the email exists, a recovery link has been sent.'
    });
  } catch (error) {
    console.error('Error in forgot-password:', error);
    return res.status(500).json({
      ok: false,
      error: 'server_error'
    });
  }
});

authRouter.post('/reset-password', async (req, res) => {
  const { token, password, newPassword, confirmPassword, code } = req.body || {};
  const recoveryToken = token || code;
  const nextPassword = newPassword || password;

  const validation = validateResetPassword({
    token: recoveryToken,
    newPassword: nextPassword,
    confirmPassword
  });

  if (!validation.ok) {
    return res.status(400).json({
      ok: false,
      error: validation.error
    });
  }

  await sessionWrapper.destroySession(req);

  const payload = verifyToken(recoveryToken);
  if (!payload || payload.type !== 'recovery' || !payload.id) {
    return res.status(400).json({
      ok: false,
      error: 'invalid_or_expired_token'
    });
  }

  try {
    const user = await session.updatePasswordById({
      userId: payload.id,
      password: nextPassword
    });

    if (!user) {
      return res.status(404).json({
        ok: false,
        error: 'user_not_found'
      });
    }

    return res.json({
      ok: true,
      message: 'Password updated',
      user
    });
  } catch (error) {
    if (error.message === 'invalid_password' || error.message === 'passwords_do_not_match') {
      return res.status(400).json({
        ok: false,
        error: error.message
      });
    }

    console.error('Error in reset-password:', error);
    return res.status(500).json({
      ok: false,
      error: 'server_error'
    });
  }
});

module.exports = { authRouter };
