import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';

export const ChatInput = ({ onSend, onSendImage, sendingImage = false, keyboardInset = 0, onTextChange }) => {
  const [text, setText] = useState('');
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const handleSend = () => {
    if (!text.trim()) {
      return;
    }
    onSend(text);
    setText('');
    if (onTextChange) {
      onTextChange('');
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: keyboardInset }]}>
      <TouchableOpacity style={styles.iconButton} onPress={onSendImage} disabled={sendingImage}>
        {sendingImage ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Ionicons name="image-outline" size={24} color={colors.primary} />
        )}
      </TouchableOpacity>

      <TextInput
        value={text}
        onChangeText={(val) => {
          setText(val);
          if (onTextChange) {
            onTextChange(val);
          }
        }}
        placeholder="Escribe un mensaje..."
        placeholderTextColor={colors.muted}
        style={styles.input}
        multiline
      />

      <TouchableOpacity
        style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]}
        onPress={handleSend}
        disabled={!text.trim()}
      >
        <Ionicons name="send" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const makeStyles = (colors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: 10,
      paddingVertical: 8,
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 6
    },
    input: {
      flex: 1,
      minHeight: 40,
      maxHeight: 110,
      backgroundColor: colors.inputBackground,
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingTop: 10,
      paddingBottom: 10,
      fontSize: 15,
      color: colors.text
    },
    sendButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 6
    },
    sendButtonDisabled: { opacity: 0.4 }
  });

export default ChatInput;
