import React, { useMemo, useRef } from 'react';
import { Animated, PanResponder, StyleSheet, Text, View, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.28;

function getAge(birthDate) {
  if (!birthDate) return null;
  const dob = new Date(birthDate);
  if (isNaN(dob.getTime())) return null;
  const diff = Date.now() - dob.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

export const SwipeCard = ({ user, onSwipeLeft, onSwipeRight }) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderMove: (_, g) => pan.setValue({ x: g.dx, y: g.dy }),
        onPanResponderRelease: (_, g) => {
          if (g.dx > SWIPE_THRESHOLD) {
            Animated.timing(pan, {
              toValue: { x: SCREEN_WIDTH * 1.5, y: g.dy },
              duration: 200,
              useNativeDriver: true
            }).start(() => onSwipeRight(user.id));
          } else if (g.dx < -SWIPE_THRESHOLD) {
            Animated.timing(pan, {
              toValue: { x: -SCREEN_WIDTH * 1.5, y: g.dy },
              duration: 200,
              useNativeDriver: true
            }).start(() => onSwipeLeft(user.id));
          } else {
            Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start();
          }
        }
      }),
    [pan, user.id, onSwipeLeft, onSwipeRight]
  );

  const rotate = pan.x.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: ['-15deg', '0deg', '15deg']
  });

  const likeOpacity = pan.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });

  const nopeOpacity = pan.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });

  const age = getAge(user.birthDate);

  return (
    <View style={styles.wrapper}>
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.card,
          { transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }] }
        ]}
      >
        {user.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={styles.image} contentFit="cover" transition={200} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Ionicons name="person" size={120} color={colors.muted} />
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.name}>
            {user.name}
            {age != null ? <Text style={styles.age}>  {age}</Text> : null}
          </Text>
          {user.bio ? <Text style={styles.bio} numberOfLines={3}>{user.bio}</Text> : null}
        </View>

        <Animated.View style={[styles.badge, styles.likeBadge, { opacity: likeOpacity }]}>
          <Text style={[styles.badgeText, styles.likeBadgeText]}>LIKE</Text>
        </Animated.View>
        <Animated.View style={[styles.badge, styles.nopeBadge, { opacity: nopeOpacity }]}>
          <Text style={[styles.badgeText, styles.nopeBadgeText]}>NOPE</Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const makeStyles = (colors) =>
  StyleSheet.create({
    wrapper: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center'
    },
    card: {
      width: SCREEN_WIDTH * 0.9,
      height: 480,
      borderRadius: 20,
      overflow: 'hidden',
      backgroundColor: colors.card,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.12,
      shadowRadius: 6
    },
    image: { width: '100%', height: '78%' },
    imagePlaceholder: {
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.card
    },
    info: { padding: 16 },
    name: { fontSize: 24, fontWeight: 'bold', color: colors.text },
    age: { fontSize: 20, fontWeight: '600', color: colors.muted },
    bio: { fontSize: 14, color: colors.textSecondary, marginTop: 6, lineHeight: 20 },
    badge: {
      position: 'absolute',
      top: 30,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderWidth: 3,
      borderRadius: 8,
      backgroundColor: 'rgba(255,255,255,0.85)'
    },
    likeBadge: { left: 20, borderColor: colors.success },
    nopeBadge: { right: 20, borderColor: colors.danger },
    badgeText: { fontSize: 28, fontWeight: '900' },
    likeBadgeText: { color: colors.success },
    nopeBadgeText: { color: colors.danger }
  });

export default SwipeCard;
