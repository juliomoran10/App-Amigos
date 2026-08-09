const express = require('express');
const { authenticate, sessionWrapper } = require('../middleware/auth');
const { processSwipe } = require('../services/swipe.service');

const swipesRouter = express.Router();

swipesRouter.use(authenticate);

swipesRouter.post('/', async (req, res) => {
  const { targetUserId, direction } = req.body || {};

  try {
    const result = await processSwipe({
      swiperId: sessionWrapper.getUserId(req),
      targetId: targetUserId,
      direction
    });

    return res.json({ ok: true, ...result });
  } catch (error) {
    return res.status(error.status || 500).json({ ok: false, error: error.message });
  }
});

module.exports = { swipesRouter };
