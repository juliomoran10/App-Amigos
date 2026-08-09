const {
  isUserInConversation,
  createMessage,
  touchConversation,
  markConversationRead,
  getPeerPushInfo
} = require('../db/chats');
const { sendPush } = require('../services/push.service');

function registerChatHandlers(io, socket) {
  const userId = socket.userId;
  if (!userId) {
    return;
  }

  socket.on('join_conversation', async ({ conversationId } = {}, callback) => {
    if (!conversationId) {
      return socket.emit('error', { message: 'conversationId es requerido' });
    }

    const allowed = await isUserInConversation({ conversationId, userId });
    if (!allowed) {
      return socket.emit('error', { message: 'No tienes acceso a esta conversación' });
    }

    await socket.join(conversationId);
    if (typeof callback === 'function') {
      callback({ ok: true });
    }
  });

  socket.on('leave_conversation', ({ conversationId } = {}) => {
    if (conversationId) {
      socket.leave(conversationId);
    }
  });

  socket.on('typing', async ({ conversationId, isTyping } = {}, callback) => {
    if (!conversationId) {
      return;
    }

    const allowed = await isUserInConversation({ conversationId, userId });
    if (!allowed) {
      return;
    }

    socket.to(conversationId).emit('typing_indicator', {
      conversationId,
      userId,
      isTyping: Boolean(isTyping)
    });

    if (typeof callback === 'function') {
      callback({ ok: true });
    }
  });

  socket.on('mark_read', async ({ conversationId } = {}, callback) => {
    if (!conversationId) {
      return socket.emit('error', { message: 'conversationId es requerido' });
    }

    const allowed = await isUserInConversation({ conversationId, userId });
    if (!allowed) {
      return socket.emit('error', { message: 'No tienes acceso a esta conversación' });
    }

    await markConversationRead({ conversationId, userId });

    socket.to(conversationId).emit('messages_read', {
      conversationId,
      readerId: userId
    });

    if (typeof callback === 'function') {
      callback({ ok: true });
    }
  });

  socket.on('send_message', async (data = {}, callback) => {
    const { conversationId, text, imageUrl } = data;

    if (!conversationId) {
      return socket.emit('error', { message: 'conversationId es requerido' });
    }

    if (!text && !imageUrl) {
      return socket.emit('error', { message: 'El mensaje no puede estar vacío' });
    }

    const allowed = await isUserInConversation({ conversationId, userId });
    if (!allowed) {
      return socket.emit('error', { message: 'No tienes acceso a esta conversación' });
    }

    try {
      const message = await createMessage({
        conversationId,
        senderId: userId,
        text,
        imageUrl
      });

      await touchConversation(conversationId);

      io.to(conversationId).emit('receive_message', message);

      const peer = await getPeerPushInfo({ conversationId, userId });
      if (peer && peer.pushToken) {
        sendPush({
          to: peer.pushToken,
          title: peer.name || 'Nuevo mensaje',
          body: imageUrl ? 'Te envió una imagen 📷' : text,
          data: {
            type: 'message',
            conversationId,
            peerName: peer.name
          }
        });
      }

      if (typeof callback === 'function') {
        callback({ ok: true, message });
      }
    } catch (error) {
      console.error('Error guardando mensaje:', error);
      socket.emit('error', { message: 'Error al procesar el mensaje' });
    }
  });
}

module.exports = { registerChatHandlers };
