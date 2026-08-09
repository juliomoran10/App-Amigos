import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import CustomButton from '../components/CustomButton';
import ImageSelector from '../components/ImageSelector';
import Header from '../components/Header';
import ActionRow from '../components/ActionRow';
import Avatar from '../components/Avatar';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import { getProfileApi, updateProfileApi } from '../services/profileApi';
import { logoutApi } from '../services/authApi';
import { uploadImageApi } from '../services/chatApi';
import { getAuthErrorMessage } from '../services/authMessages';

const THEME_OPTIONS = [
  { key: 'light', label: 'Claro', icon: 'sunny-outline' },
  { key: 'dark', label: 'Oscuro', icon: 'moon-outline' }
];

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { colors, mode, setMode } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const [user, setUser] = useState({
    name: '',
    username: '',
    email: '',
    bio: '',
    avatar: null
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [inputUsername, setInputUsername] = useState('');
  const [inputName, setInputName] = useState('');
  const [inputBio, setInputBio] = useState('');
  const [inputAvatar, setInputAvatar] = useState(null);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getProfileApi();
      const u = result.user;

      setUser({
        name: u.name || '',
        username: u.username || '',
        email: u.email || '',
        bio: u.bio || '',
        avatar: u.avatar || null
      });
    } catch (error) {
      Alert.alert('Error', getAuthErrorMessage(error.payload));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const handleSignOut = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas salir de tu cuenta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            try {
              await logoutApi();
            } catch {
              // clearToken already runs in logoutApi finally block
            }

            navigation.reset({
              index: 0,
              routes: [{ name: 'SignIn' }]
            });
          }
        }
      ]
    );
  };

  const openEditModal = () => {
    setInputUsername(user.username);
    setInputName(user.name);
    setInputBio(user.bio);
    setInputAvatar(user.avatar);
    setEditModalVisible(true);
  };

  const handleSaveChanges = async () => {
    if (!inputName.trim()) {
      Alert.alert('Campo vacío', 'El nombre no puede estar vacío.');
      return;
    }

    const username = inputUsername.trim().toLowerCase();
    if (username && (!/^[a-z0-9_]{3,20}$/.test(username))) {
      Alert.alert('Usuario inválido', 'El nombre de usuario debe tener entre 3 y 20 caracteres (letras, números o _).');
      return;
    }

    setSaving(true);
    try {
      let avatar = inputAvatar;

      if (inputAvatar && !inputAvatar.startsWith('http')) {
        const uploadResult = await uploadImageApi(inputAvatar);
        avatar = uploadResult.imageUrl;
      }

      const result = await updateProfileApi({
        username,
        name: inputName.trim(),
        bio: inputBio.trim(),
        avatar
      });

      const u = result.user;
      setUser({
        name: u.name || '',
        username: u.username || '',
        email: u.email || '',
        bio: u.bio || '',
        avatar: u.avatar || null
      });
      setEditModalVisible(false);
    } catch (error) {
      Alert.alert('Error', getAuthErrorMessage(error.payload));
    } finally {
      setSaving(false);
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
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Header title="Perfil" />

      <View style={styles.profileCard}>
        <View style={styles.avatarWrapper}>
          <Avatar uri={user.avatar} size={90} />
        </View>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userUsername}>@{user.username}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
        {user.bio ? <Text style={styles.userBio}>{user.bio}</Text> : null}
      </View>

      <Text style={styles.sectionTitle}>Ajustes de cuenta</Text>
      <View style={styles.optionsBox}>
        <ActionRow icon="person-outline" text="Editar mis datos" onPress={openEditModal} />
      </View>

      <Text style={styles.sectionTitle}>Apariencia</Text>
      <View style={styles.optionsBox}>
        {THEME_OPTIONS.map((option) => {
          const selected = mode === option.key;
          return (
            <ActionRow
              key={option.key}
              icon={option.icon}
              text={option.label}
              rightIcon={selected ? 'checkmark' : 'chevron-forward'}
              tint={selected ? colors.primary : undefined}
              onPress={() => setMode(option.key)}
            />
          );
        })}
      </View>

      <View style={styles.buttonWrapper}>
        <CustomButton text="Cerrar Sesión" onPress={handleSignOut} type="SECONDARY" />
      </View>

      <Modal animationType="slide" transparent={true} visible={editModalVisible} onRequestClose={() => setEditModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Perfil</Text>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.subLabel}>Foto de Perfil</Text>
              <ImageSelector
                imageUri={inputAvatar}
                onImageSelected={setInputAvatar}
                placeholderText="Subir Foto"
              />

              <Text style={styles.subLabel}>Nombre de usuario</Text>
              <TextInput
                placeholder="@usuario"
                placeholderTextColor={colors.muted}
                value={inputUsername}
                onChangeText={setInputUsername}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.modalInput}
              />

              <Text style={styles.subLabel}>Nombre</Text>
              <TextInput
                placeholder="Tu nombre"
                placeholderTextColor={colors.muted}
                value={inputName}
                onChangeText={setInputName}
                style={styles.modalInput}
              />

              <Text style={styles.subLabel}>Sobre mí</Text>
              <TextInput
                placeholder="Cuéntanos algo sobre ti..."
                placeholderTextColor={colors.muted}
                value={inputBio}
                onChangeText={setInputBio}
                style={[styles.modalInput, styles.modalBioInput]}
                multiline
              />

              <View style={styles.modalButtons}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <CustomButton text={saving ? 'Guardando...' : 'Guardar'} onPress={handleSaveChanges} />
                </View>
                <View style={{ flex: 1 }}>
                  <CustomButton text="Cancelar" onPress={() => setEditModalVisible(false)} type="TERTIARY" fgColor={colors.muted} />
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
};

const makeStyles = (colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: {
      justifyContent: 'center',
      alignItems: 'center'
    },
    scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
    profileCard: {
      backgroundColor: colors.card,
      borderRadius: 15,
      padding: 25,
      alignItems: 'center',
      borderColor: colors.border,
      borderWidth: 1,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      marginBottom: 25,
      marginTop: 10
    },
    avatarWrapper: { marginBottom: 15 },
    userName: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
    userUsername: { fontSize: 14, color: colors.primary, marginBottom: 2 },
    userEmail: { fontSize: 14, color: colors.muted },
    userBio: { fontSize: 14, color: colors.textSecondary, marginTop: 10, textAlign: 'center', lineHeight: 20 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 12, marginLeft: 5 },
    optionsBox: {
      backgroundColor: colors.card,
      borderRadius: 12,
      borderColor: colors.border,
      borderWidth: 1,
      paddingHorizontal: 15,
      marginBottom: 30
    },
    buttonWrapper: { marginTop: 10, marginBottom: 20 },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20
    },
    modalContent: {
      backgroundColor: colors.card,
      width: '100%',
      maxWidth: 340,
      maxHeight: '90%',
      padding: 20,
      borderRadius: 15,
      elevation: 10
    },
    modalScroll: {
      flexGrow: 0
    },
    modalScrollContent: {
      paddingBottom: 10
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 15,
      textAlign: 'center'
    },
    subLabel: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.textSecondary,
      marginBottom: 5,
      marginTop: 10
    },
    modalInput: {
      width: '100%',
      minHeight: 48,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 5,
      paddingHorizontal: 15,
      marginBottom: 10,
      color: colors.text,
      backgroundColor: colors.inputBackground
    },
    modalBioInput: {
      minHeight: 80,
      textAlignVertical: 'top',
      paddingTop: 12
    },
    modalButtons: {
      flexDirection: 'row',
      width: '100%',
      marginTop: 20
    }
  });

export default ProfileScreen;
