# 🚀 Documentación del Backend - Node.js + Express + Socket.io

## 1. Arquitectura y Estructura del Proyecto

El backend utiliza una arquitectura modular limpia orientada a servicios, desacoplada en controladores, servicios y controladores de eventos WebSocket.

```text
backend/
├── src/
│   ├── config/
│   │   ├── cloudinary.ts      # Configuración para storage de imágenes
│   │   ├── env.ts             # Validación de variables de entorno
│   │   └── prisma.ts          # Instancia global de Prisma Client
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── swipe.controller.ts
│   │   ├── chat.controller.ts
│   │   └── upload.controller.ts
│   ├── middlewares/
│   │   ├── auth.middleware.ts  # Verificación JWT
│   │   ├── error.middleware.ts # Handler de errores global
│   │   └── upload.middleware.ts# Multer para procesamiento de archivos
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── swipe.routes.ts
│   │   ├── chat.routes.ts
│   │   └── index.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── swipe.service.ts
│   │   └── chat.service.ts
│   ├── sockets/
│   │   ├── socket.auth.ts     # Handshake JWT para Socket.io
│   │   └── chat.socket.ts     # Eventos de chat en vivo
│   ├── utils/
│   │   └── jwt.ts
│   ├── app.ts                 # Configuración de Express app
│   └── server.ts              # Inicialización HTTP y WebSocket Server
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── .env.example
├── package.json
└── tsconfig.json
```

---

## 2. Variables de Entorno (`.env.example`)

```env
PORT=4000
DATABASE_URL="postgresql://user:password@localhost:5432/friendmatch?schema=public"
JWT_SECRET="super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Cloudinary / S3 Configuration
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

---

## 3. Especificación Completa de la API REST

### 3.1 Módulo de Autenticación (`/api/v1/auth`)

#### `POST /api/v1/auth/register`
* **Descripción:** Registro de nuevo usuario.
* **Headers:** `Content-Type: application/json`
* **Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "Password123!",
  "name": "Ana López",
  "birthDate": "1998-05-15"
}
```
* **Respuesta Exitosa (201 Created):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6Ik...",
  "user": {
    "id": "uuid-1234",
    "email": "usuario@ejemplo.com",
    "name": "Ana López",
    "avatarUrl": null,
    "bio": null
  }
}
```

#### `POST /api/v1/auth/login`
* **Descripción:** Inicio de sesión.
* **Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "Password123!"
}
```
* **Respuesta Exitosa (200 OK):** Mismo formato que `/register`.

---

### 3.2 Módulo de Perfil de Usuario (`/api/v1/users`)

#### `GET /api/v1/users/me`
* **Headers:** `Authorization: Bearer <TOKEN>`
* **Respuesta Exitosa (200 OK):**
```json
{
  "id": "uuid-1234",
  "email": "usuario@ejemplo.com",
  "name": "Ana López",
  "bio": "Me encanta viajar y la cocina.",
  "avatarUrl": "https://res.cloudinary.com/demo/image/upload/v1/avatar.jpg",
  "birthDate": "1998-05-15T00:00:00.000Z"
}
```

#### `PUT /api/v1/users/me`
* **Headers:** `Authorization: Bearer <TOKEN>`, `Content-Type: multipart/form-data`
* **Body (Form-Data):**
  * `name`: string (opcional)
  * `bio`: string (opcional)
  * `avatar`: file (opcional, imagen multipart)
* **Respuesta Exitosa (200 OK):** Objeto `User` actualizado.

---

### 3.3 Módulo de Swipes (`/api/v1/swipes`)

#### `GET /api/v1/users/feed`
* **Headers:** `Authorization: Bearer <TOKEN>`
* **Query Params:** `limit` (default: 20)
* **Respuesta Exitosa (200 OK):**
```json
[
  {
    "id": "uuid-5678",
    "name": "Carlos Mendoza",
    "bio": "Desarrollador y gamer",
    "avatarUrl": "https://...",
    "birthDate": "1995-10-20T00:00:00.000Z"
  }
]
```

#### `POST /api/v1/swipes`
* **Headers:** `Authorization: Bearer <TOKEN>`
* **Body:**
```json
{
  "targetUserId": "uuid-5678",
  "direction": "LIKE" // O "DISLIKE"
}
```
* **Respuesta Exitosa (200 OK):**
```json
{
  "isMatch": true,
  "matchId": "match-uuid-9999",
  "conversationId": "conv-uuid-8888"
}
```

---

### 3.4 Módulo de Chats y Mensajes (`/api/v1/chats`)

#### `GET /api/v1/chats/conversations`
* **Headers:** `Authorization: Bearer <TOKEN>`
* **Query Params:** `search` (opcional, para filtrar conversaciones por nombre del usuario del match).
* **Ejemplo:** `/api/v1/chats/conversations?search=Carlos`
* **Respuesta Exitosa (200 OK):**
```json
[
  {
    "id": "conv-uuid-8888",
    "updatedAt": "2026-08-08T18:30:00.000Z",
    "peer": {
      "id": "uuid-5678",
      "name": "Carlos Mendoza",
      "avatarUrl": "https://..."
    },
    "lastMessage": {
      "id": "msg-001",
      "text": "¡Hola! ¿Cómo estás?",
      "imageUrl": null,
      "createdAt": "2026-08-08T18:30:00.000Z",
      "senderId": "uuid-5678"
    }
  }
]
```

#### `GET /api/v1/chats/conversations/:id/messages`
* **Headers:** `Authorization: Bearer <TOKEN>`
* **Query Params:** `page` (default: 1), `limit` (default: 30)
* **Respuesta Exitosa (200 OK):**
```json
{
  "messages": [
    {
      "id": "msg-002",
      "conversationId": "conv-uuid-8888",
      "senderId": "uuid-1234",
      "text": "¡Hola! Todo bien, ¿y tú?",
      "imageUrl": null,
      "createdAt": "2026-08-08T18:31:00.000Z"
    },
    {
      "id": "msg-003",
      "conversationId": "conv-uuid-8888",
      "senderId": "uuid-1234",
      "text": null,
      "imageUrl": "https://res.cloudinary.com/demo/image/upload/v1/chat_img.jpg",
      "createdAt": "2026-08-08T18:32:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "total": 2,
    "hasMore": false
  }
}
```

#### `POST /api/v1/upload/chat-image`
* **Headers:** `Authorization: Bearer <TOKEN>`, `Content-Type: multipart/form-data`
* **Body:** `image` (file)
* **Respuesta Exitosa (200 OK):**
```json
{
  "imageUrl": "https://res.cloudinary.com/demo/image/upload/v12345/chat_uploads/abc.jpg"
}
```

---

## 4. Middleware de Autenticación (`auth.middleware.ts`)

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: { id: string; email: string };
}

export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Acceso no autorizado: Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { id: string; email: string };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};
```
