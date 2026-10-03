# FriendMatch

A real-time social app for making friends, inspired by the swipe-to-match experience. Users create a profile, swipe through suggestions, match, and chat in real time.

Monorepo with a **React Native (Expo)** mobile client and a **Node.js + Express** API with live messaging over **Socket.IO**.

## Features

- Authentication with JWT (sign up, login, protected routes)
- Swipe & match mechanic to connect users
- Real-time chat between matched users (Socket.IO)
- Profile management with image upload (Cloudinary)
- Push notifications to mobile devices (Expo)
- Transactional emails (Resend)

## Tech stack

**Mobile (frontend)**
- React Native + Expo
- React Navigation (native stack + bottom tabs)
- Socket.IO client
- expo-notifications, expo-image-picker, expo-secure-store

**API (backend)**
- Node.js + Express
- Socket.IO (real-time chat)
- PostgreSQL (`pg`)
- JWT (`jsonwebtoken`) + bcrypt
- Cloudinary + Multer (image storage/upload)
- Resend (email) · expo-server-sdk (push)

## Project structure

```
App-Amigos/
├── backend/      # Node.js + Express + Socket.IO API
│   └── src/      # config, controllers, services, routes, sockets, middlewares
└── frontend/     # React Native (Expo) app
    └── src/
```

## Getting started

### Backend

```bash
cd backend
npm install
cp .env.example .env     # set DB, JWT, Cloudinary and email keys
npm run db:migrate       # create the database schema
npm run dev              # start the API (http://localhost:PORT)
```

### Frontend

```bash
cd frontend
npm install
npx expo start           # open in Expo Go or an emulator
```

> Point the app's API URL to your backend before running.

## Screenshots

<!-- Agrega aquí 2-3 capturas de la app (login, swipe, chat) -->

---

Hecho por [Julio Morán](https://www.linkedin.com/in/julio-moran-52ab51309) · [GitHub](https://github.com/juliomoran10)
