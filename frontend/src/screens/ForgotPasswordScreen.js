import React from 'react';
import { Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import AuthForm from '../components/AuthForm';
import { useNavigation } from '@react-navigation/native';
import { forgotPasswordApi } from '../services/authApi';
import { getAuthErrorMessage } from '../services/authMessages';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';

const ForgotPasswordScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const handleSendEmail = async ({ email }) => {
    const trimmedEmail = email?.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedEmail) {
      Alert.alert('Campo obligatorio', 'Por favor, escribe tu email.');
      return;
    }

    if (!emailRegex.test(trimmedEmail)) {
      Alert.alert('Email inválido', 'Escribe un email válido para continuar.');
      return;
    }

    try {
      await forgotPasswordApi({ email: trimmedEmail });
      Alert.alert(
        'Revisa tu correo',
        'Si el email está registrado, te enviamos un enlace para restablecer la contraseña. Ábrelo desde el mismo móvil donde tienes FriendMatch.',
        [
          {
            text: 'Ingresar código manual',
            onPress: () => navigation.navigate('NewPassword')
          },
          {
            text: 'Volver al login',
            onPress: () => navigation.navigate('SignIn')
          }
        ]
      );
    } catch (error) {
      Alert.alert('Recuperación fallida', getAuthErrorMessage(error.payload?.error));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Recuperar contraseña</Text>
        <Text style={styles.subtitle}>
          Te enviaremos un enlace que abre la app directamente para crear una nueva contraseña.
        </Text>

        <AuthForm
          fields={[{ name: 'email', placeholder: 'Correo electrónico', keyboardType: 'email-address' }]}
          onSubmit={handleSendEmail}
          submitText="Enviar enlace"
          secondaryAction={{
            text: 'Volver a iniciar sesión',
            onPress: () => navigation.navigate('SignIn'),
            type: 'TERTIARY',
            fgColor: colors.primary
          }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const makeStyles = (colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { alignItems: 'center', padding: 20, paddingTop: 60 },
    title: { fontSize: 28, fontWeight: 'bold', color: colors.text, marginVertical: 15, alignSelf: 'flex-start' },
    subtitle: { fontSize: 14, color: colors.muted, marginBottom: 18, alignSelf: 'flex-start', lineHeight: 20 }
  });

export default ForgotPasswordScreen;
