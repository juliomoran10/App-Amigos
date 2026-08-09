# 🗄️ Documentación de Base de Datos - FriendMatch App

## 1. Visión General
La base de datos utiliza **PostgreSQL** administrado mediante **Prisma ORM**. La arquitectura de datos está diseñada para soportar operaciones de alta concurrencia como swipes en tiempo real, creación atómica de matches y mensajería instantánea.

---

## 2. Diagrama Entidad-Relación (ERD)

```text
+-------------------+        +-------------------+        +-------------------+
|       User        |        |       Swipe       |        |       Match       |
+-------------------+        +-------------------+        +-------------------+
| id (PK)           |<-------| swiperId (FK)     |   +--->| user1Id (FK)      |
| email             |        | targetId (FK)     |---|    | user2Id (FK)      |
| passwordHash      |        | type (LIKE/DIS)   |   +--->| id (PK)           |
| name              |        | createdAt         |        | createdAt         |
| bio               |        +-------------------+        +-------------------+
| birthDate         |                                               |
| avatarUrl         |                                               | 1:1
| createdAt         |                                               v
| updatedAt         |                                     +-------------------+
+-------------------+                                     |   Conversation    |
  |             |                                         +-------------------+
  | 1:N         | 1:N                                     | id (PK)           |
  v             v                                         | matchId (FK)      |
+-------------------+                                     | createdAt         |
|      Message      |                                     | updatedAt         |
+-------------------+                                     +-------------------+
| id (PK)           |                                               |
| conversationId(FK)|-----------------------------------------------+ 1:N
| senderId (FK)     |
| text              |
| imageUrl          |
| isRead            |
| createdAt         |
+-------------------+
```

---

## 3. Schema Completo de Prisma (`prisma/schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum SwipeDirection {
  LIKE
  DISLIKE
}

model User {
  id           String    @id @default(uuid())
  email        String    @unique
  passwordHash String
  name         String
  bio          String?   @db.Text
  birthDate    DateTime?
  avatarUrl    String?   // URL pública de Cloudinary/S3
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  // Relaciones de Swipes
  swipesSent     Swipe[] @relation("SwipesSent")
  swipesReceived Swipe[] @relation("SwipesReceived")

  // Relaciones de Matches
  matchesAsUser1 Match[] @relation("MatchUser1")
  matchesAsUser2 Match[] @relation("MatchUser2")

  // Relaciones de Mensajes
  messagesSent   Message[]

  @@index([email])
}

model Swipe {
  id        String         @id @default(uuid())
  swiperId  String
  targetId  String
  type      SwipeDirection
  createdAt DateTime       @default(now())

  swiper User @relation("SwipesSent", fields: [swiperId], references: [id], onDelete: Cascade)
  target User @relation("SwipesReceived", fields: [targetId], references: [id], onDelete: Cascade)

  // Un usuario solo puede darle swipe una única vez a cada objetivo
  @@unique([swiperId, targetId])
  @@index([swiperId])
  @@index([targetId])
}

model Match {
  id        String   @id @default(uuid())
  user1Id   String
  user2Id   String
  createdAt DateTime @default(now())

  user1 User @relation("MatchUser1", fields: [user1Id], references: [id], onDelete: Cascade)
  user2 User @relation("MatchUser2", fields: [user2Id], references: [id], onDelete: Cascade)

  conversation Conversation?

  @@unique([user1Id, user2Id])
  @@index([user1Id])
  @@index([user2Id])
}

model Conversation {
  id        String   @id @default(uuid())
  matchId   String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  match    Match     @relation(fields: [matchId], references: [id], onDelete: Cascade)
  messages Message[]

  @@index([updatedAt(sort: Desc)])
}

model Message {
  id             String   @id @default(uuid())
  conversationId String
  senderId       String
  text           String?  @db.Text
  imageUrl       String?  // URL de la imagen enviada en el chat
  isRead         Boolean  @default(false)
  createdAt      DateTime @default(now())

  conversation Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  sender       User         @relation(fields: [senderId], references: [id], onDelete: Cascade)

  @@index([conversationId, createdAt(sort: Desc)])
}
```

---

## 4. Estrategia de Consultas Críticas

### 4.1 Feed de Swipes (Exclusión de Perfiles Ya Vistos)
Para obtener perfiles disponibles para mostrar en las tarjetas de swipe del `currentUserId`:

```typescript
// backend/src/services/swipe.service.ts
export async function getFeedProfiles(userId: string, limit = 20) {
  // Obtener IDs a los que ya se les dio swipe
  const existingSwipes = await prisma.swipe.findMany({
    where: { swiperId: userId },
    select: { targetId: true },
  });

  const excludedIds = existingSwipes.map((s) => s.targetId);
  excludedIds.push(userId); // Excluirse a sí mismo

  return prisma.user.findMany({
    where: {
      id: { notIn: excludedIds },
    },
    select: {
      id: true,
      name: true,
      bio: true,
      birthDate: true,
      avatarUrl: true,
    },
    take: limit,
  });
}
```

### 4.2 Lógica Atómica de Match
Cuando un usuario envía un `LIKE`:

```typescript
export async function processSwipe(swiperId: string, targetId: string, type: 'LIKE' | 'DISLIKE') {
  return prisma.$transaction(async (tx) => {
    // 1. Registrar Swipe
    const swipe = await tx.swipe.create({
      data: { swiperId, targetId, type },
    });

    if (type === 'DISLIKE') {
      return { isMatch: false };
    }

    // 2. Verificar si el targetId ya había dado LIKE a swiperId
    const reciprocalSwipe = await tx.swipe.findUnique({
      where: {
        swiperId_targetId: {
          swiperId: targetId,
          targetId: swiperId,
        },
      },
    });

    if (reciprocalSwipe && reciprocalSwipe.type === 'LIKE') {
      // Ordenar IDs para mantener la restricción unique user1Id < user2Id
      const [u1, u2] = [swiperId, targetId].sort();

      // 3. Crear Match y Conversación asociada
      const match = await tx.match.create({
        data: {
          user1Id: u1,
          user2Id: u2,
          conversation: {
            create: {},
          },
        },
        include: { conversation: true },
      });

      return { isMatch: true, matchId: match.id, conversationId: match.conversation?.id };
    }

    return { isMatch: false };
  });
}
```

---

## 5. Script de Inicialización de Semilla (`prisma/seed.ts`)

```typescript
import { PrismaClient, SwipeDirection } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.match.deleteMany();
  await prisma.swipe.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password123!', 10);

  const u1 = await prisma.user.create({
    data: {
      email: 'juan@test.com',
      passwordHash,
      name: 'Juan Pérez',
      bio: 'Apasionado de la tecnología y el café. Buscando hacer buenos amigos.',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=500',
    },
  });

  const u2 = await prisma.user.create({
    data: {
      email: 'maria@test.com',
      passwordHash,
      name: 'María García',
      bio: 'Amante del senderismo, fotografía y los viajes por el mundo.',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500',
    },
  });

  const u3 = await prisma.user.create({
    data: {
      email: 'carlos@test.com',
      passwordHash,
      name: 'Carlos Mendoza',
      bio: 'Desarrollador de software y gamer en tiempos libres.',
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=500',
    },
  });

  console.log('✅ Base de datos poblada con éxito.');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
```
