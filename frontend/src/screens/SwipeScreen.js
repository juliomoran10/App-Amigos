import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Header from '../components/Header';
import SwipeCard from '../components/SwipeCard';
import MatchModal from '../components/MatchModal';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import { fetchFeedApi, postSwipeApi } from '../services/swipeApi';
import { getAuthErrorMessage } from '../services/authMessages';

const SwipeScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [profiles, setProfiles] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [matchInfo, setMatchInfo] = useState(null);

  const loadFeed = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchFeedApi(30);
      setProfiles(result.profiles || []);
      setIndex(0);
    } catch (error) {
      Alert.alert('Error', getAuthErrorMessage(error.payload?.error));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFeed();
    }, [loadFeed])
  );

  const current = profiles[index];

  const handleSwipe = async (targetUserId, direction) => {
    if (busy) {
      return;
    }
    setBusy(true);
    try {
      const result = await postSwipeApi({ targetUserId, direction });
      if (result.isMatch) {
        setMatchInfo({
          peerName: current?.name,
          peerAvatar: current?.avatarUrl,
          conversationId: result.conversationId
        });
      }
      setIndex((i) => i + 1);
    } catch (error) {
      Alert.alert('Error', getAuthErrorMessage(error.payload?.error));
    } finally {
      setBusy(false);
    }
  };

  const onSwipeLeft = (userId) => handleSwipe(userId, 'DISLIKE');
  const onSwipeRight = (userId) => handleSwipe(userId, 'LIKE');

  const goToChat = () => {
    const info = matchInfo;
    setMatchInfo(null);
    navigation.navigate('ChatDetail', {
      conversationId: info?.conversationId,
      peerName: info?.peerName
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Explorar" />

      {current ? (
        <View style={styles.cardsContainer}>
          <View style={styles.cardSlot}>
            <SwipeCard
              key={current.id}
              user={current}
              onSwipeLeft={onSwipeLeft}
              onSwipeRight={onSwipeRight}
            />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.nopeButton]}
              onPress={() => onSwipeLeft(current.id)}
              disabled={busy}
              accessibilityLabel="No me interesa"
            >
              <Ionicons name="close" size={34} color={colors.danger} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.likeButton]}
              onPress={() => onSwipeRight(current.id)}
              disabled={busy}
              accessibilityLabel="Me gusta"
            >
              <Ionicons name="heart" size={34} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.empty}>
          <Ionicons name="people-outline" size={64} color={colors.muted} />
          <Text style={styles.emptyText}>No hay más perfiles por ahora.</Text>
          <Text style={styles.emptySub}>Vuelve más tarde para descubrir nuevas personas.</Text>
          <TouchableOpacity style={styles.reloadButton} onPress={loadFeed} disabled={loading}>
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.reloadText}>Recargar</Text>
          </TouchableOpacity>
        </View>
      )}

      <MatchModal
        visible={Boolean(matchInfo)}
        peerName={matchInfo?.peerName}
        peerAvatar={matchInfo?.peerAvatar}
        onChat={goToChat}
        onClose={() => setMatchInfo(null)}
      />
    </View>
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
    cardsContainer: {
      flex: 1,
      justifyContent: 'space-between',
      paddingTop: 10,
      paddingBottom: 20
    },
    cardSlot: {
      flex: 1
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 10
    },
    actionButton: {
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: 18,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4
    },
    nopeButton: {
      backgroundColor: colors.card,
      borderWidth: 2,
      borderColor: colors.danger
    },
    likeButton: {
      backgroundColor: colors.primary
    },
    empty: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 30
    },
    emptyText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginTop: 16
    },
    emptySub: {
      fontSize: 14,
      color: colors.muted,
      marginTop: 6,
      textAlign: 'center'
    },
    reloadButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      paddingHorizontal: 22,
      paddingVertical: 12,
      borderRadius: 24,
      marginTop: 20
    },
    reloadText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 15,
      marginLeft: 8
    }
  });

export default SwipeScreen;
