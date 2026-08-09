import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from './Avatar';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';

export const MatchModal = ({ visible, peerName, peerAvatar, onChat, onClose }) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Ionicons name="heart" size={72} color={colors.primary} />
          <View style={styles.avatarWrap}>
            <Avatar uri={peerAvatar} size={96} />
          </View>
          <Text style={styles.title}>¡Es un Match!</Text>
          <Text style={styles.subtitle}>
            {peerName
              ? `A ${peerName} también le gustas. Empiecen a conversar.`
              : 'También le gustas. Empiecen a conversar.'}
          </Text>
          <View style={styles.buttons}>
            <TouchableOpacity style={[styles.button, styles.chatButton]} onPress={onChat}>
              <Text style={styles.chatButtonText}>Enviar mensaje</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.closeButton]} onPress={onClose}>
              <Text style={styles.closeButtonText}>Seguir explorando</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const makeStyles = (colors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24
    },
    content: {
      width: '100%',
      maxWidth: 340,
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 28,
      alignItems: 'center'
    },
    avatarWrap: { marginTop: 16 },
    title: {
      fontSize: 28,
      fontWeight: '900',
      color: colors.text,
      marginTop: 12
    },
    subtitle: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 10,
      lineHeight: 22
    },
    buttons: { width: '100%', marginTop: 24 },
    button: {
      padding: 14,
      borderRadius: 10,
      alignItems: 'center',
      marginBottom: 10
    },
    chatButton: { backgroundColor: colors.primary },
    closeButton: { backgroundColor: colors.inputBackground },
    chatButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    closeButtonText: { color: colors.text, fontWeight: '600', fontSize: 15 }
  });

export default MatchModal;
