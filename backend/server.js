require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');
const { createApp } = require('./src/app');
const { initDatabase } = require('./src/db/migrate');
const { setupSocketAuth } = require('./src/sockets/socket.auth');
const { registerChatHandlers } = require('./src/sockets/chat.socket');

const port = process.env.PORT || 3000;

async function startServer() {
  await initDatabase();

  const app = createApp();
  const httpServer = http.createServer(app);

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST']
    }
  });

  setupSocketAuth(io);
  io.on('connection', (socket) => {
    registerChatHandlers(io, socket);
  });

  httpServer.listen(port, () => {
    console.log(`FriendMatch backend running on http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});
