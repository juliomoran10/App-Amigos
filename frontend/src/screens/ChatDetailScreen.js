import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Modal, TouchableOpacity, Keyboard } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation, useRoute } from '@react-navigation/native';
import Header from '../components/Header';
import MessageBubble from '../components/MessageBubble';
import ChatInput from '../components/ChatInput';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import { useSocket } from '../hooks/useSocket';
import { fetchMessagesApi, uploadImageApi, markConversationReadApi } from '../services/chatApi';
import { meApi } from '../services/authApi';
import { pickImageFromGallery } from '../utils/imagePicker';
import { getAuthErrorMessage } from '../services/authMessages';

const ChatDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { conversationId, peerName } = route.params || {};

  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const socket = useSocket(Boolean(conversationId));
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [sendingImage, setSendingImage] = useState(false);
  const [myId, setMyId] = useState(null);
  const [viewerUrl, setViewerUrl] = useState(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [peerTyping, setPeerTyping] = useState(false);

  const myIdRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const peerTypingTimeoutRef = useRef(null);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return undefined;
    }

    const show = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const loadMessages = useCallback(async () => {
    try {
      const result = await fetchMessagesApi(conversationId);
      setMessages(result.messages || []);
      setPage(result.pagination?.page || 1);
      setHasMore(Boolean(result.pagination?.hasMore));
    } catch (error) {
      Alert.alert('Error', getAuthErrorMessage(error.payload));
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    meApi()
      .then((result) => {
        const id = result.user?.id;
        setMyId(id);
        myIdRef.current = id;
      })
      .catch(() => {});
    loadMessages();
  }, [loadMessages]);

  const markRead = useCallback(() => {
    if (socket) {
      socket.emit('mark_read', { conversationId });
    } else {
      markConversationReadApi(conversationId).catch(() => {});
    }
  }, [socket, conversationId]);

  useEffect(() => {
    if (conversationId) {
      markRead();
    }
  }, [conversationId, markRead]);

  const loadOlder = useCallback(async () => {
    if (loadingMore || !hasMore) {
      return;
    }
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const result = await fetchMessagesApi(conversationId, nextPage);
      setMessages((prev) => [...prev, ...(result.messages || [])]);
      setPage(result.pagination?.page || nextPage);
      setHasMore(Boolean(result.pagination?.hasMore));
    } catch {
      // Error silencioso al cargar mensajes antiguos
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, page, conversationId]);

  useEffect(() => {
    if (!socket || !conversationId) {
      return undefined;
    }

    socket.emit('join_conversation', { conversationId });

    const onReceive = (newMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMessage.id)) {
          return prev;
        }
        return [newMessage, ...prev.filter((m) => !m.pending)];
      });
      if (newMessage.senderId !== myIdRef.current) {
        markRead();
      }
    };

    const onTyping = ({ userId, isTyping }) => {
      if (userId === myIdRef.current) {
        return;
      }
      setPeerTyping(Boolean(isTyping));
      if (isTyping) {
        if (peerTypingTimeoutRef.current) {
          clearTimeout(peerTypingTimeoutRef.current);
        }
        peerTypingTimeoutRef.current = setTimeout(() => setPeerTyping(false), 3000);
      }
    };

    const onRead = ({ readerId }) => {
      if (readerId === myIdRef.current) {
        return;
      }
      setMessages((prev) =>
        prev.map((m) =>
          m.senderId === myIdRef.current && !m.isRead ? { ...m, isRead: true } : m
        )
      );
    };

    const onError = (err) => {
      setMessages((prev) => prev.filter((m) => !m.pending));
      Alert.alert('Chat', err?.message || 'Ocurrió un error');
    };

    socket.on('receive_message', onReceive);
    socket.on('typing_indicator', onTyping);
    socket.on('messages_read', onRead);
    socket.on('error', onError);

    return () => {
      socket.emit('leave_conversation', { conversationId });
      socket.off('receive_message', onReceive);
      socket.off('typing_indicator', onTyping);
      socket.off('messages_read', onRead);
      socket.off('error', onError);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (peerTypingTimeoutRef.current) {
        clearTimeout(peerTypingTimeoutRef.current);
      }
    };
  }, [socket, conversationId, markRead]);

  const emitTyping = useCallback(
    (isTyping) => {
      if (socket) {
        socket.emit('typing', { conversationId, isTyping });
      }
    },
    [socket, conversationId]
  );

  const handleTextChange = (text) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    emitTyping(Boolean(text));
    if (text) {
      typingTimeoutRef.current = setTimeout(() => emitTyping(false), 1500);
    }
  };

  const stopTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    emitTyping(false);
  };

  const handleSendText = (text) => {
    if (!socket || !text.trim()) {
      return;
    }
    socket.emit('send_message', { conversationId, text });
    stopTyping();
  };

  const handleSendImage = async () => {
    if (sendingImage) {
      return;
    }

    let localUri;
    try {
      localUri = await pickImageFromGallery();
    } catch {
      return;
    }
    if (!localUri) {
      return;
    }

    setSendingImage(true);
    try {
      const { imageUrl } = await uploadImageApi(localUri);

      const optimistic = {
        id: `local-${Date.now()}`,
        senderId: myId,
        imageUrl,
        text: null,
        isRead: false,
        pending: true,
        createdAt: new Date().toISOString()
      };
      setMessages((prev) => [optimistic, ...prev]);

      if (socket) {
        socket.emit('send_message', { conversationId, imageUrl });
      }
    } catch (error) {
      Alert.alert('Error', getAuthErrorMessage(error.payload));
    } finally {
      setSendingImage(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header
        title={peerName || 'Chat'}
        showBack
        onBack={() => navigation.goBack()}
      />

      <FlatList
        inverted
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        onEndReached={loadOlder}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator size="small" color={colors.primary} style={styles.loadingOlder} />
          ) : null
        }
        renderItem={({ item }) => (
          <MessageBubble message={item} isMe={item.senderId === myId} onPressImage={setViewerUrl} />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Aún no hay mensajes. ¡Saluda!</Text>
        }
      />

      {peerTyping && <Text style={styles.typingIndicator}>Escribiendo...</Text>}

      <ChatInput
        onSend={handleSendText}
        onSendImage={handleSendImage}
        sendingImage={sendingImage}
        keyboardInset={Platform.OS === 'android' ? keyboardHeight : 0}
        onTextChange={handleTextChange}
      />

      <Modal
        visible={Boolean(viewerUrl)}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerUrl(null)}
      >
        <TouchableOpacity
          style={styles.viewer}
          activeOpacity={1}
          onPress={() => setViewerUrl(null)}
        >
          <Image
            source={{ uri: viewerUrl }}
            style={styles.viewerImage}
            contentFit="contain"
            transition={150}
          />
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const makeStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background
    },
    centered: {
      justifyContent: 'center',
      alignItems: 'center'
    },
    listContent: {
      padding: 12,
      flexGrow: 1
    },
    empty: {
      textAlign: 'center',
      color: colors.muted,
      marginTop: 40
    },
    loadingOlder: {
      paddingVertical: 12
    },
    typingIndicator: {
      fontSize: 12,
      color: colors.muted,
      paddingHorizontal: 16,
      paddingBottom: 2,
      fontStyle: 'italic'
    },
    viewer: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      justifyContent: 'center',
      alignItems: 'center'
    },
    viewerImage: {
      width: '100%',
      height: '100%'
    }
  });

export default ChatDetailScreen;
