const path = require('path');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { healthRouter } = require('./routes/health');
const { authRouter } = require('./routes/auth');
const { usersRouter } = require('./routes/users');
const { swipesRouter } = require('./routes/swipes');
const { chatsRouter } = require('./routes/chats');
const { uploadRouter } = require('./routes/upload');

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '2mb' }));

  // Archivos subidos localmente (cuando no se usa Cloudinary)
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

  app.get('/', (req, res) => {
    res.json({
      name: 'FriendMatch API',
      status: 'ok'
    });
  });

  app.use('/health', healthRouter);
  app.use('/auth', authRouter);
  app.use('/users', usersRouter);
  app.use('/swipes', swipesRouter);
  app.use('/chats', chatsRouter);
  app.use('/upload', uploadRouter);

  // Rutas no encontradas
  app.use((req, res) => {
    res.status(404).json({ ok: false, error: 'not_found', message: 'Ruta no encontrada' });
  });

  // Manejador de errores: siempre responde JSON (nunca HTML) para que el
  // cliente pueda mostrar el error real en lugar del mensaje genérico.
  app.use((error, req, res, next) => {
    console.error('[error]', error);

    if (error && error.type === 'entity.parse.failed') {
      return res.status(400).json({
        ok: false,
        error: 'invalid_request',
        message: 'La solicitud no es válida'
      });
    }

    if (error instanceof multer.MulterError) {
      const message =
        error.code === 'LIMIT_FILE_SIZE'
          ? 'La imagen supera el tamaño máximo permitido'
          : `Error al subir la imagen: ${error.message}`;
      return res.status(400).json({ ok: false, error: 'upload_error', message });
    }

    if (error && error.message === 'Solo se permiten imágenes') {
      return res.status(400).json({
        ok: false,
        error: 'image_only',
        message: error.message
      });
    }

    const status =
      typeof error.status === 'number' && error.status >= 400 ? error.status : 500;
    return res.status(status).json({
      ok: false,
      error: 'server_error',
      message: error.message || 'Error interno del servidor'
    });
  });

  return app;
}

module.exports = { createApp };
