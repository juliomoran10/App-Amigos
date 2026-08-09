const express = require('express');
const { authenticate, sessionWrapper } = require('../middleware/auth');
const {
  getConversations,
  getMessages,
  markConversationRead
} = require('../services/chat.service');

const chatsRouter = express.Router();

chatsRouter.use(authenticate);

chatsRouter.get('/conversations', async (req, res) => {
  try {
    const conversations = await getConversations(
      sessionWrapper.getUserId(req),
      req.query.search || ''
    );
    return res.json({ ok: true, conversations });
  } catch (error) {
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
});

chatsRouter.get('/conversations/:id/messages', async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 30, 100);

  try {
    const data = await getMessages(
      sessionWrapper.getUserId(req),
      req.params.id,
      page,
      limit
    );
    return res.json({ ok: true, ...data });
  } catch (error) {
    return res.status(error.status || 500).json({ ok: false, error: error.message });
  }
});

chatsRouter.post('/conversations/:id/read', async (req, res) => {
  try {
    await markConversationRead({
      conversationId: req.params.id,
      userId: sessionWrapper.getUserId(req)
    });
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
});

module.exports = { chatsRouter };
