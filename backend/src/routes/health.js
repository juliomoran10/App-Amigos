const express = require('express');

const healthRouter = express.Router();

healthRouter.get('/', (req, res) => {
  res.json({
    ok: true,
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = { healthRouter };
