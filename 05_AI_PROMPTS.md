# 🤖 Instrucciones y Guía de Contexto para Asistente de IA

Esta guía está preparada para ser entregada a asistentes de programación por IA (como Cursor, Windsurf, GitHub Copilot, Claude o ChatGPT). Proporciona las reglas de comportamiento, estructura del código y los prompts secuenciales para construir la aplicación paso a paso.

---

## 1. Reglas de Sistema para la IA (System Rules / `.cursorrules`)

```markdown
# FriendMatch App - Reglas de Código para IA

## Stack Tecnológico
- Frontend: Expo (React Native) + TypeScript, React Navigation, Zustand, TanStack Query, Socket.io-client.
- Backend: Node.js + Express + TypeScript, Prisma ORM, PostgreSQL, Socket.io, Cloudinary/Multer.

## Principios de Desarrollo
1. **Tipado Estricto:** Siempre usa interfaces y tipos explícitos en TypeScript. No utilices `any` a menos que sea estrictamente necesario.
2. **Manejo de Errores:** En el Backend, responde siempre con formatos JSON estandarizados `{ message: string, error?: any }`. En el Frontend, captura errores de red e informa al usuario con alert/toast.
3. **Seguridad:** Pasa tokens JWT en la cabecera `Authorization: Bearer <TOKEN>` para REST y en `socket.handshake.auth.token` para WebSockets.
4. **Navegación en Expo:** Usa `@react-navigation/native-stack` para flujos principales y `@react-navigation/bottom-tabs` para las pestañas de la app.
5. **Rendimiento:** Utiliza `react-native-reanimated` v3 y `react-native-gesture-handler` para mantener los gestos de swipe a 60 FPS.
```

---

## 2. Prompts Secuenciales para Generar el Código Paso a Paso

Copia y pega estos prompts en tu herramienta de IA en el orden indicado:

### Paso 1: Configuración del Backend y Prisma
```text
Por favor, genera la estructura del Backend en Node.js + Express + TypeScript basándote en la documentación de `BACKEND.md` y `DATABASE.md`.
Crea:
1. `prisma/schema.prisma` con los modelos User, Swipe, Match, Conversation, Message.
2. La configuración del servidor en `src/app.ts` y `src/server.ts`.
3. El middleware de autenticación JWT `src/middlewares/auth.middleware.ts`.
4. Las rutas y controladores de autenticación (`/auth/register` y `/auth/login`).
```

### Paso 2: Motor de Swipes y Creación de Matches
```text
Ahora implementa el módulo de Swipes en el backend:
1. Crea el servicio `src/services/swipe.service.ts` con la función `processSwipe` en una transacción atómica de Prisma. Si dos usuarios se dan LIKE recíproco, debe crear automáticamente un Match y una Conversation.
2. Crea el endpoint `GET /api/v1/users/feed` que retorne usuarios excluyendo a aquellos a quienes ya se les dio swipe.
3. Crea el controlador y las rutas en `src/routes/swipe.routes.ts`.
```

### Paso 3: WebSockets y Servidor de Chat
```text
Implementa el módulo de mensajería en tiempo real con Socket.io en el Backend basándote en `WEBSOCKETS.md`:
1. Configura el handshake con autenticación JWT en `src/sockets/socket.auth.ts`.
2. Implementa los eventos `join_conversation`, `leave_conversation` y `send_message` en `src/sockets/chat.socket.ts`.
3. Asegúrate de guardar los mensajes en PostgreSQL antes de hacer `io.to(conversationId).emit('receive_message', msg)`.
4. Implementa el endpoint de subida de imágenes `POST /api/v1/upload/chat-image` usando Cloudinary o S3.
```

### Paso 4: Setup de Expo Frontend y Navegación
```text
Vamos a construir el Frontend en Expo basándonos en `FRONTEND.md`:
1. Crea la estructura de carpetas en `src/`.
2. Configura los navegadores en `src/navigation/`: `AuthStack` (Login, Register) y `MainTabNavigator` (Feed Swipe, Conversaciones, Perfil).
3. Configura el store global con Zustand `src/store/authStore.ts` para persistir el token de sesión.
```

### Paso 5: Pantalla de Swipe con Gestos
```text
Crea la pantalla de Swipe en `src/screens/swipe/SwipeScreen.tsx`:
1. Utiliza `react-native-reanimated` y `react-native-gesture-handler` para renderizar las tarjetas con gestos izquierda/derecha.
2. Integra la API `POST /api/v1/swipes` cuando el usuario desliza la tarjeta.
3. Muestra un modal de "¡Es un Match!" cuando la respuesta devuelva `isMatch: true`.
```

### Paso 6: Lista de Chats con Buscador y Chat Detail
```text
Implementa el chat en Expo:
1. En `src/screens/chat/ConversationsScreen.tsx`, crea un `SearchBar` que filtre las conversaciones enviando la query `?search=` a la API.
2. En `src/screens/chat/ChatDetailScreen.tsx`, conecta el hook de WebSocket `useSocket` para recibir mensajes en tiempo real.
3. Implementa el botón de enviar imagen usando `expo-image-picker`, subiéndola primero vía REST y luego emitiendo la URL por WebSocket.
```
