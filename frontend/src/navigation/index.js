import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';
import { NavigationContainer, DefaultTheme, DarkTheme, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import NewPasswordScreen from '../screens/NewPasswordScreen';
import TabNavigator from './TabNavigator';
import ChatDetailScreen from '../screens/ChatDetailScreen';
import { meApi } from '../services/authApi';
import { clearToken, getToken } from '../services/sessionStorage';
import { setSessionExpiredHandler } from '../services/sessionEvents';
import { registerForPushNotifications } from '../services/notifications';
import { linking } from './linking';
import { useTheme } from '../theme/ThemeProvider';

const Stack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef();

const Navigation = () => {
  const { colors } = useTheme();
  const [bootstrapping, setBootstrapping] = useState(true);
  const [initialRoute, setInitialRoute] = useState('SignIn');

  useEffect(() => {
    let mounted = true;

    async function bootstrapSession() {
      try {
        const token = await getToken();
        if (token) {
          await meApi();
          if (mounted) {
            setInitialRoute('Home');
          }
          registerForPushNotifications();
        }
      } catch {
        await clearToken();
        if (mounted) {
          setInitialRoute('SignIn');
        }
      } finally {
        if (mounted) {
          setBootstrapping(false);
        }
      }
    }

    bootstrapSession();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      clearToken().catch(() => {});
      if (navigationRef.isReady()) {
        navigationRef.reset({
          index: 0,
          routes: [{ name: 'SignIn' }]
        });
      }
    });

    return () => {
      setSessionExpiredHandler(null);
    };
  }, []);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data || {};
      if (data.conversationId && navigationRef.isReady()) {
        navigationRef.navigate('ChatDetail', {
          conversationId: data.conversationId,
          peerName: data.peerName
        });
      }
    });

    return () => sub.remove();
  }, []);

  if (bootstrapping) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const navTheme = {
    ...(colors.mode === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(colors.mode === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      notification: colors.primary
    }
  };

  return (
    <NavigationContainer theme={navTheme} linking={linking} ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="NewPassword" component={NewPasswordScreen} />

        <Stack.Screen name="Home" component={TabNavigator} />

        <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});

export default Navigation;
