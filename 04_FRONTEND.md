# 📱 Documentación del Frontend - Expo (React Native) + TypeScript

## 1. Arquitectura y Estructura del Proyecto

El desarrollo se basa en **Expo** con TypeScript, **React Navigation** para el flujo de pantallas, **Zustand** para estado global y **TanStack Query** para la gestión de la caché HTTP.

```text
frontend/
├── src/
│   ├── api/
│   │   ├── client.ts         # Instancia de Axios con Interceptor JWT
│   │   ├── auth.api.ts
│   │   ├── user.api.ts
│   │   ├── swipe.api.ts
│   │   └── chat.api.ts
│   ├── components/
│   │   ├── common/           # Input, Button, Avatar, Loading
│   │   ├── swipe/
│   │   │   ├── SwipeCard.tsx # Tarjeta animada con Reanimated
│   │   │   └── MatchModal.tsx# Popup al hacer match
│   │   └── chat/
│   │       ├── MessageBubble.tsx # Renderiza Texto e Imágenes
│   │       ├── ChatInput.tsx     # Campo de texto + Botón de Galería
│   │       └── SearchBar.tsx     # Buscador de contactos
│   ├── hooks/
│   │   ├── useSocket.ts      # Manejo de conexión Socket.io
│   │   └── useAuth.ts
│   ├── navigation/
│   │   ├── RootNavigator.tsx
│   │   ├── AuthStack.tsx
│   │   └── MainTabNavigator.tsx
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   ├── profile/
│   │   │   └── EditProfileScreen.tsx # CRUD de Perfil e Imagen
│   │   ├── swipe/
│   │   │   └── SwipeScreen.tsx       # Feed principal con gestos
│   │   └── chat/
│   │       ├── ConversationsScreen.tsx # Lista de chats con SearchBar
│   │       └── ChatDetailScreen.tsx    # Mensajería en tiempo real
│   ├── store/
│   │   ├── authStore.ts      # Almacenamiento del Token JWT en MMKV/AsyncStorage
│   │   └── chatStore.ts
│   └── types/
│       └── index.ts          # Tipos de TS (User, Message, Conversation)
├── App.tsx
└── app.json
```

---

## 2. Bibliotecas Esenciales
Asegúrate de instalar estas dependencias en Expo:

```bash
npx expo install react-native-reanimated react-native-gesture-handler expo-image-picker
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npm install @tanstack/react-query zustand axios socket.io-client
```

---

## 3. Implementación de Funcionalidades Clave

### 3.1 Gestos de Swipe (`SwipeCard.tsx`)
Utiliza `react-native-reanimated` y `react-native-gesture-handler` para deslizar tarjetas suavemente a 60fps.

```tsx
import React from 'react';
import { StyleSheet, Text, View, Image, Dimensions } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

interface Props {
  user: { id: string; name: string; bio: string; avatarUrl: string };
  onSwipeLeft: (userId: string) => void;
  onSwipeRight: (userId: string) => void;
}

export const SwipeCard = ({ user, onSwipeLeft, onSwipeRight }: Props) => {
  const translateX = useSharedValue(0);

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd(() => {
      if (translateX.value > SWIPE_THRESHOLD) {
        runOnJS(onSwipeRight)(user.id);
      } else if (translateX.value < -SWIPE_THRESHOLD) {
        runOnJS(onSwipeLeft)(user.id);
      } else {
        translateX.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.card, cardStyle]}>
        <Image source={{ uri: user.avatarUrl }} style={styles.image} />
        <View style={styles.info}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.bio}>{user.bio}</Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  card: { width: SCREEN_WIDTH * 0.9, height: 500, borderRadius: 20, overflow: 'hidden', backgroundColor: '#fff' },
  image: { width: '100%', height: '80%' },
  info: { padding: 15 },
  name: { fontSize: 22, fontWeight: 'bold' },
  bio: { fontSize: 14, color: '#666', marginTop: 5 },
});
```

---

### 3.2 Selección y Carga de Fotos de Perfil/Chat (`expo-image-picker`)

```typescript
import * as ImagePicker from 'expo-image-picker';

export async function pickImageFromGallery(): Promise<string | null> {
  const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permissionResult.granted) {
    alert('Se requiere permiso para acceder a la galería');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.8,
  });

  if (!result.canceled && result.assets[0].uri) {
    return result.assets[0].uri;
  }

  return null;
}
```

---

### 3.3 Barra de Búsqueda de Chats (`ConversationsScreen.tsx`)

```tsx
import React, { useState } from 'react';
import { View, TextInput, FlatList, Text, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { fetchConversations } from '../api/chat.api';

export const ConversationsScreen = ({ navigation }: any) => {
  const [search, setSearch] = useState('');

  // Re-ejecuta la búsqueda con debounce automático en TanStack Query
  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations', search],
    queryFn: () => fetchConversations(search),
  });

  return (
    <View style={{ flex: 1, padding: 15 }}>
      {/* Search Bar */}
      <TextInput
        placeholder="Buscar personas conversadas..."
        value={search}
        onChangeText={setSearch}
        style={{
          padding: 12,
          backgroundColor: '#f0f0f0',
          borderRadius: 10,
          marginBottom: 15,
        }}
      />

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate('ChatDetail', { conversationId: item.id, peerName: item.peer.name })}
            style={{ padding: 15, borderBottomWidth: 1, borderColor: '#eee' }}
          >
            <Text style={{ fontWeight: 'bold' }}>{item.peer.name}</Text>
            <Text numberOfLines={1} style={{ color: '#777' }}>
              {item.lastMessage?.text || (item.lastMessage?.imageUrl ? '📷 [Imagen]' : 'Inicia la conversación')}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};
```

---

### 3.4 Pantalla de Chat con Imágenes y WebSockets (`ChatDetailScreen.tsx`)

```tsx
import React, { useEffect, useState } from 'react';
import { View, FlatList, TextInput, Button, Image, Text } from 'react-native';
import { useSocket } from '../hooks/useSocket';
import { pickImageFromGallery } from '../utils/imagePicker';
import { uploadChatImage } from '../api/chat.api';

export const ChatDetailScreen = ({ route }: any) => {
  const { conversationId } = route.params;
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.emit('join_conversation', { conversationId });

    socket.on('receive_message', (newMessage) => {
      setMessages((prev) => [newMessage, ...prev]);
    });

    return () => {
      socket.emit('leave_conversation', { conversationId });
      socket.off('receive_message');
    };
  }, [socket, conversationId]);

  const handleSendText = () => {
    if (!text.trim() || !socket) return;
    socket.emit('send_message', { conversationId, text });
    setText('');
  };

  const handleSendImage = async () => {
    const localUri = await pickImageFromGallery();
    if (!localUri || !socket) return;

    // 1. Subir imagen vía REST
    const { imageUrl } = await uploadChatImage(localUri);

    // 2. Transmitir evento por WebSocket
    socket.emit('send_message', { conversationId, imageUrl });
  };

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <FlatList
        inverted
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ marginVertical: 5, alignSelf: item.isMe ? 'flex-end' : 'flex-start' }}>
            {item.imageUrl && (
              <Image source={{ uri: item.imageUrl }} style={{ width: 200, height: 200, borderRadius: 10 }} />
            )}
            {item.text && <Text style={{ backgroundColor: '#e2e2e2', padding: 10, borderRadius: 10 }}>{item.text}</Text>}
          </View>
        )}
      />

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Button title="📷" onPress={handleSendImage} />
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Escribe un mensaje..."
          style={{ flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 20, paddingHorizontal: 15 }}
        />
        <Button title="Enviar" onPress={handleSendText} />
      </View>
    </View>
  );
};
```
