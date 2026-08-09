# ⚡ Especificación de WebSockets - Socket.io

## 1. Visión General
El módulo de chat en tiempo real utiliza **Socket.io** para la comunicación bidireccional entre el cliente de Expo y el servidor Node.js. 

### Características clave:
* **Autenticación en Handshake:** Validación mediante JWT en la conexión inicial.
* **Unión a Salas (`Rooms`):** Cada `Conversation` funciona como una sala independiente identificada por su `conversationId`.
* **Persistencia Atómica:** Todos los mensajes se guardan en PostgreSQL antes de transmitirse a la sala.

---

## 2. Autenticación y Conexión

### Handshake desde el Cliente (Expo React Native)
```typescript
import { io } from 'socket.io-client';

const socket = io('https://tu-backend-api.com', {
  auth: {
    token: 'BEARER_JWT_TOKEN_AQUI',
  },
  transports: ['websocket'],
  autoConnect: true,
});
```

### Middleware de Validación en Servidor (`socket.auth.ts`)
```typescript
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export function setupSocketAuth(io: Server) {
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('Authentication error: Token required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });
}
```

---

## 3. Protocolo de Eventos

### 3.1 Eventos Enviados por el Cliente (`Client -> Server`)

#### Evento: `join_conversation`
* **Descripción:** Solicita al servidor unirse a la sala del chat específico.
* **Payload:**
```json
{
  "conversationId": "conv-uuid-8888"
}
```

#### Evento: `leave_conversation`
* **Descripción:** Abandona la sala del chat actual.
* **Payload:**
```json
{
  "conversationId": "conv-uuid-8888"
}
```

#### Evento: `send_message`
* **Descripción:** Envía un nuevo mensaje (texto e/o imagen) a una conversación.
* **Payload:**
```json
{
  "conversationId": "conv-uuid-8888",
  "text": "Hola, mira esta foto!", // Opcional si se envía imagen
  "imageUrl": "https://res.cloudinary.com/.../img.jpg" // Opcional si se envía texto
}
```

---

### 3.2 Eventos Emitidos por el Servidor (`Server -> Client`)

#### Evento: `receive_message`
* **Descripción:** Transmitido a todos los participantes en la sala cuando se crea un nuevo mensaje.
* **Payload:**
```json
{
  "id": "msg-uuid-1010",
  "conversationId": "conv-uuid-8888",
  "senderId": "user-uuid-123",
  "text": "Hola, mira esta foto!",
  "imageUrl": "https://res.cloudinary.com/.../img.jpg",
  "createdAt": "2026-08-08T18:45:00.000Z"
}
```

#### Evento: `error`
* **Descripción:** Emitido en caso de error en la transmisión o autorización.
* **Payload:**
```json
{
  "message": "No perteneces a esta conversación"
}
```

---

## 4. Implementación del Event Handler en el Backend (`chat.socket.ts`)

```typescript
import { Server } from 'socket.io';
import { AuthenticatedSocket } from './socket.auth';
import { prisma } from '../config/prisma';

export function registerChatHandlers(io: Server, socket: AuthenticatedSocket) {
  const userId = socket.userId;
  if (!userId) return;

  // Unirse a la sala de la conversación
  socket.on('join_conversation', async ({ conversationId }: { conversationId: string }) => {
    // Validar que el usuario sea parte del match de esta conversación
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        match: {
          OR: [{ user1Id: userId }, { user2Id: userId }],
        },
      },
    });

    if (conversation) {
      socket.join(conversationId);
      console.log(`Usuario ${userId} se unió a la sala ${conversationId}`);
    } else {
      socket.emit('error', { message: 'No tienes acceso a esta conversación' });
    }
  });

  // Salir de la sala
  socket.on('leave_conversation', ({ conversationId }: { conversationId: string }) => {
    socket.leave(conversationId);
  });

  // Procesar y transmitir mensaje
  socket.on('send_message', async (data: { conversationId: string; text?: string; imageUrl?: string }) => {
    const { conversationId, text, imageUrl } = data;

    if (!text && !imageUrl) {
      return socket.emit('error', { message: 'El mensaje no puede estar vacío' });
    }

    try {
      // 1. Guardar mensaje en Base de Datos
      const message = await prisma.message.create({
        data: {
          conversationId,
          senderId: userId,
          text: text || null,
          imageUrl: imageUrl || null,
        },
      });

      // 2. Actualizar updatedAt de la conversación para ordenamiento
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      // 3. Emitir mensaje a todos los usuarios conectados en esa sala
      io.to(conversationId).emit('receive_message', message);
    } catch (error) {
      console.error('Error guardando mensaje:', error);
      socket.emit('error', { message: 'Error al procesar el mensaje' });
    }
  });
}
```
