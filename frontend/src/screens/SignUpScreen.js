import React, { useState } from 'react';
import { Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AuthForm from '../components/AuthForm';
import ImageSelector from '../components/ImageSelector';
import { useNavigation } from '@react-navigation/native';
import { isValidPassword, passwordValidationMessage } from '../utils/validation';
import { registerApi, uploadRegisterImageApi } from '../services/authApi';
import { getAuthErrorMessage } from '../services/authMessages';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';

function toDateString(d) {
  if (!d) {
    return null;
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const DEFAULT_BIRTH_DATE = new Date(new Date().getFullYear() - 25, 0, 1);

const SignUpScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [profileImage, setProfileImage] = useState(null);
  const [birthDate, setBirthDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onRegisterPressed = async ({ name, email, password, passwordRepeat, bio }) => {
    if (!name.trim() || !email.trim() || !password.trim() || !passwordRepeat.trim()) {
      Alert.alert('Campos incompletos', 'Por favor, rellena los campos obligatorios del formulario.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Correo electrónico inválido', 'Por favor, introduce un correo electrónico real (ejemplo@dominio.com).');
      return;
    }

    if (!isValidPassword(password)) {
      Alert.alert('Contraseña inválida', passwordValidationMessage);
      return;
    }

    if (password !== passwordRepeat) {
      Alert.alert('Error de coincidencia', 'Las contraseñas ingresadas no coinciden.');
      return;
    }

    setSubmitting(true);
    try {
      let avatar = null;
      if (profileImage) {
        const uploadResult = await uploadRegisterImageApi(profileImage);
        avatar = uploadResult.imageUrl;
      }

      await registerApi({
        username: '',
        email: email.trim(),
        password,
        name: name.trim(),
        bio: bio.trim(),
        birthDate: toDateString(birthDate),
        avatar
      });
      Alert.alert('Cuenta creada', 'Tu cuenta fue registrada. Ya puedes iniciar sesión.');
      navigation.navigate('SignIn');
    } catch (error) {
      Alert.alert('Registro fallido', getAuthErrorMessage(error.payload));
    } finally {
      setSubmitting(false);
    }
  };

  const onBirthDateChange = (event, selected) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'set' && selected) {
      setBirthDate(selected);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Crear cuenta</Text>

        <ImageSelector imageUri={profileImage} onImageSelected={setProfileImage} placeholderText="Agregar foto de perfil" />
        <Text style={styles.hint}>La foto es opcional. Si no la pones, usaremos una imagen genérica.</Text>

        <AuthForm
          fields={[
            { name: 'name', placeholder: 'Nombre' },
            { name: 'email', placeholder: 'Correo electrónico', keyboardType: 'email-address' },
            {
              name: 'birthDate',
              render: ({ value, setValue }) => (
                <View style={styles.birthRow}>
                  <TouchableOpacity style={styles.birthField} onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
                    <Text style={value ? styles.birthText : styles.birthPlaceholder}>
                      {value || 'Fecha de nacimiento (opcional)'}
                    </Text>
                  </TouchableOpacity>
                  {showDatePicker && (
                    <View>
                      {Platform.OS === 'ios' && (
                        <TouchableOpacity style={styles.birthDone} onPress={() => setShowDatePicker(false)}>
                          <Text style={styles.birthDoneText}>Listo</Text>
                        </TouchableOpacity>
                      )}
                      <DateTimePicker
                        value={birthDate || DEFAULT_BIRTH_DATE}
                        mode="date"
                        display={Platform.OS === 'android' ? 'spinner' : 'default'}
                        maximumDate={new Date()}
                        onChange={(event, selected) => {
                          setValue(selected ? toDateString(selected) : value);
                          setBirthDate(selected || birthDate);
                          onBirthDateChange(event, selected);
                        }}
                      />
                    </View>
                  )}
                </View>
              )
            },
            { name: 'password', placeholder: 'Contraseña', secure: true },
            { name: 'passwordRepeat', placeholder: 'Repetir contraseña', secure: true },
            { name: 'bio', placeholder: 'Sobre mí (opcional)', multiline: true }
          ]}
          onSubmit={onRegisterPressed}
          submitText={submitting ? 'Registrando...' : 'Registrarme'}
          submitting={submitting}
          secondaryAction={{ text: '¿Ya tienes cuenta? Inicia sesión', onPress: () => navigation.navigate('SignIn'), type: 'TERTIARY', fgColor: colors.primary }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const makeStyles = (colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { alignItems: 'center', padding: 20, paddingTop: 50 },
    title: { fontSize: 28, fontWeight: 'bold', color: colors.text, marginVertical: 15, alignSelf: 'flex-start' },
    hint: { fontSize: 12, color: colors.muted, textAlign: 'center', marginBottom: 8 },
    birthRow: { width: '100%' },
    birthField: {
      backgroundColor: colors.inputBackground,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 5,
      paddingHorizontal: 15,
      height: 50,
      justifyContent: 'center',
      marginVertical: 8
    },
    birthText: { color: colors.text, fontSize: 15 },
    birthPlaceholder: { color: colors.muted, fontSize: 15 },
    birthDone: {
      alignSelf: 'flex-end',
      paddingVertical: 6,
      paddingHorizontal: 12
    },
    birthDoneText: { color: colors.primary, fontWeight: 'bold', fontSize: 15 }
  });

export default SignUpScreen;
