const express = require('express');
const { authenticate, sessionWrapper } = require('../middleware/auth');
const { updateProfile } = require('../services/profile.service');
const { getFeedProfiles } = require('../services/swipe.service');
const { updateUser } = require('../db/persistence');

const usersRouter = express.Router();

usersRouter.use(authenticate);

usersRouter.get('/me', (req, res) => {
  return res.json({
    ok: true,
    user: sessionWrapper.getSession(req).user
  });
});

usersRouter.put('/me', async (req, res) => {
  const { name, username, bio, birthDate, avatar } = req.body || {};

  try {
    const user = await updateProfile({
      userId: sessionWrapper.getUserId(req),
      payload: { name, username, bio, birthDate, avatar }
    });

    return res.json({ ok: true, user });
  } catch (error) {
    return res.status(error.status || 400).json({ ok: false, error: error.message });
  }
});

usersRouter.put('/me/push-token', async (req, res) => {
  const token = String(req.body?.token || '').trim();

  if (!token) {
    return res.status(400).json({ ok: false, error: 'push_token_required' });
  }

  try {
    await updateUser(sessionWrapper.getUserId(req), { pushToken: token });
    return res.json({ ok: true });
  } catch (error) {
    console.error('Error saving push token:', error);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
});

usersRouter.get('/feed', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);

  try {
    const profiles = await getFeedProfiles(sessionWrapper.getUserId(req), limit);
    return res.json({ ok: true, profiles });
  } catch (error) {
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
});

module.exports = { usersRouter };
