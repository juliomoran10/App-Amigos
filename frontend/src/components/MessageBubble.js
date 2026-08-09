import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useThemedStyles } from '../theme/ThemeProvider';

export const MessageBubble = ({ message, isMe, onPressImage }) => {
  const isImage = Boolean(message.imageUrl);
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={[styles.row, isMe ? styles.rowMe : styles.rowOther]}>
      <View style={styles.bubbleWrap}>
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
          {isImage && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onPressImage && onPressImage(message.imageUrl)}
            >
              <Image source={{ uri: message.imageUrl }} style={styles.image} contentFit="cover" transition={150} />
            </TouchableOpacity>
          )}
          {message.text ? (
            <Text style={[styles.text, isMe ? styles.textMe : styles.textOther]}>
              {message.text}
            </Text>
          ) : null}
        </View>
        {isMe && (
          <Text style={[styles.status, styles.statusMe]}>
            {message.pending ? 'Enviando...' : message.isRead ? 'Leído' : 'Enviado'}
          </Text>
        )}
      </View>
    </View>
  );
};

const makeStyles = (colors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', marginVertical: 4 },
    rowMe: { justifyContent: 'flex-end' },
    rowOther: { justifyContent: 'flex-start' },
    bubbleWrap: { maxWidth: '78%' },
    bubble: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 9, overflow: 'hidden' },
    bubbleMe: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
    bubbleOther: { backgroundColor: colors.card, borderBottomLeftRadius: 4 },
    text: { fontSize: 15 },
    textMe: { color: '#fff' },
    textOther: { color: colors.text },
    image: { width: 200, height: 200, borderRadius: 10, marginBottom: 4 },
    status: { fontSize: 11, marginTop: 2, marginRight: 4 },
    statusMe: { color: colors.muted, textAlign: 'right' }
  });

export default MessageBubble;
