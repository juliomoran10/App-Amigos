import React, { useState } from 'react';
import { Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import AuthForm from '../components/AuthForm';
import { useNavigation, useRoute } from '@react-navigation/native';
import { isValidPassword, passwordValidationMessage } from '../utils/validation';
import { resetPasswordApi } from '../services/authApi';
import { getAuthErrorMessage } from '../services/authMessages';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';

const NewPasswordScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const tokenFromLink = (route.params?.token || route.params?.code || '').trim();

  const onSubmitPressed = async ({ code, newPassword: np }) => {
    const recoveryToken = (code || tokenFromLink || '').trim();

    if (!recoveryToken || !np.trim()) {
      Alert.alert('Campos vacíos', 'Por favor, introduce el código de verificación y tu nueva contraseña.');
      return;
    }

    if (!isValidPassword(np)) {
      Alert.alert('Contraseña inválida', passwordValidationMessage);
      return;
    }

    try {
      await resetPasswordApi({ code: recoveryToken, newPassword: np });
      Alert.alert('Éxito', 'Tu contraseña ha sido restablecida correctamente.');
      navigation.reset({
        index: 0,
        routes: [{ name: 'SignIn' }]
      });
    } catch (error) {
      Alert.alert('Restablecimiento fallido', getAuthErrorMessage(error.payload?.error));
    }
  };

  const fields = tokenFromLink
    ? [{ name: 'newPassword', placeholder: 'Nueva contraseña', secure: true }]
    : [
        { name: 'code', placeholder: 'Código del correo' },
        { name: 'newPassword', placeholder: 'Nueva contraseña', secure: true }
      ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Restablecer contraseña</Text>
        {tokenFromLink ? (
          <Text style={styles.subtitle}>
            Enlace verificado. Solo ingresa tu nueva contraseña.
          </Text>
        ) : (
          <Text style={styles.subtitle}>
            Abre el enlace del correo en tu móvil o pega aquí el código que recibiste.
          </Text>
        )}

        <AuthForm
          fields={fields}
          onSubmit={(values) =>
            onSubmitPressed({
              code: values.code || tokenFromLink,
              newPassword: values.newPassword
            })
          }
          submitText="Guardar"
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

export default NewPasswordScreen;
