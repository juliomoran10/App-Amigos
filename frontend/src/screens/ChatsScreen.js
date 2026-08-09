import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import Avatar from '../components/Avatar';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import { fetchConversationsApi } from '../services/chatApi';
import { getAuthErrorMessage } from '../services/authMessages';

const ChatsScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [search, setSearch] = useState('');
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const result = await fetchConversationsApi(search);
      setConversations(result.conversations || []);
    } catch (error) {
      Alert.alert('Error', getAuthErrorMessage(error.payload?.error));
    } finally {
      setRefreshing(false);
    }
  }, [search]);

  const loadConversations = useCallback(async (query = search) => {
    try {
      setLoading(true);
      const result = await fetchConversationsApi(query);
      setConversations(result.conversations || []);
    } catch (error) {
      Alert.alert('Error', getAuthErrorMessage(error.payload?.error));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [loadConversations])
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() =>
        navigation.navigate('ChatDetail', {
          conversationId: item.id,
          peerName: item.peer?.name
        })
      }
    >
      <View style={styles.avatar}>
        <Avatar uri={item.peer?.avatarUrl} size={54} />
      </View>

      <View style={styles.rowBody}>
        <Text style={styles.peerName}>{item.peer?.name}</Text>
        <Text numberOfLines={1} style={styles.preview}>
          {item.lastMessage?.text ||
            (item.lastMessage?.imageUrl ? '[Imagen]' : 'Inicia la conversación')}
        </Text>
      </View>

      {!item.lastMessage?.isRead && item.lastMessage?.senderId !== undefined && (
        <View style={styles.unreadDot} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header title="Chats" />
      <View style={styles.content}>
        <SearchBar
          value={search}
          onChangeText={(text) => {
            setSearch(text);
            loadConversations(text);
          }}
          placeholder="Buscar personas conversadas..."
        />

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            ListEmptyComponent={
              <Text style={styles.empty}>
                {search ? 'Sin resultados para tu búsqueda.' : 'Aún no tienes conversaciones. ¡Empieza a explorar!'}
              </Text>
            }
          />
        )}
      </View>
    </View>
  );
};

const makeStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background
    },
    content: {
      flex: 1,
      padding: 15
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border
    },
    avatar: {
      marginRight: 12
    },
    rowBody: {
      flex: 1
    },
    peerName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text
    },
    preview: {
      fontSize: 14,
      color: colors.muted,
      marginTop: 3
    },
    unreadDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.primary
    },
    empty: {
      textAlign: 'center',
      color: colors.muted,
      marginTop: 40,
      fontSize: 15
    }
  });

export default ChatsScreen;
