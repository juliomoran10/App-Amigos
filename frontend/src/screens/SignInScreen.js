import React, { useState } from 'react';
import { Text, Image, StyleSheet, useWindowDimensions, ScrollView, Alert, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import AuthForm from '../components/AuthForm';
import { useThemedStyles } from '../theme/ThemeProvider';
import { useNavigation } from '@react-navigation/native';
import LogoImg from '../../assets/logo.png';
import { loginAndSaveSession } from '../services/authApi';
import { registerForPushNotifications } from '../services/notifications';
import { getAuthErrorMessage } from '../services/authMessages';

const SignInScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { height } = useWindowDimensions();
  const navigation = useNavigation();
  const styles = useThemedStyles(makeStyles);

  const handleSignInWithValues = async ({ email: e, password: p }) => {
    if (!e?.trim() || !p?.trim()) {
      Alert.alert('Campos obligatorios', 'Por favor, rellena todos los campos para ingresar.');
      return;
    }

    try {
      await loginAndSaveSession({ email: e.trim(), password: p });
      registerForPushNotifications();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }]
      });
    } catch (error) {
      Alert.alert('Inicio de sesión fallido', getAuthErrorMessage(error.payload?.error));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Image source={LogoImg} style={[styles.logo, { height: height * 0.22 }]} resizeMode="contain" />
        <Text style={styles.title}>FriendMatch</Text>
        <Text style={styles.subtitle}>Haz amigos cerca de ti</Text>

        <AuthForm
          fields={[
            { name: 'email', placeholder: 'Correo electrónico', keyboardType: 'email-address' },
            { name: 'password', placeholder: 'Contraseña', secure: true }
          ]}
          initialValues={{ email, password }}
          onSubmit={(vals) => handleSignInWithValues(vals)}
          submitText="Iniciar sesión"
          secondaryAction={{ text: 'Olvidé mi contraseña', onPress: () => navigation.navigate('ForgotPassword') }}
        />

        <TouchableOpacity onPress={() => navigation.navigate('SignUp')} style={styles.signUpLink}>
          <Text style={styles.signUpText}>¿No tienes cuenta? Crea una</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const makeStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background
    },
    content: {
      alignItems: 'center',
      padding: 20,
      paddingTop: 50
    },
    logo: {
      width: '60%',
      maxWidth: 220
    },
    title: {
      fontSize: 30,
      fontWeight: 'bold',
      color: colors.text,
      marginVertical: 8
    },
    subtitle: {
      fontSize: 15,
      color: colors.muted,
      marginBottom: 20
    },
    signUpLink: {
      marginTop: 14,
    },
    signUpText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '600',
    }
  });

export default SignInScreen;
