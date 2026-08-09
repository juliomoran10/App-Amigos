import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Constants from 'expo-constants';
import { savePushTokenApi } from './pushTokenApi';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false
  })
});

async function setupAndroidChannel() {
  if (Platform.OS !== 'android') {
    return;
  }
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Notificaciones',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF2A6D'
  });
}

export async function registerForPushNotifications() {
  if (Platform.OS !== 'android') {
    return null;
  }

  try {
    await setupAndroidChannel();

    let status = (await Notifications.getPermissionsAsync()).status;
    if (status !== 'granted') {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== 'granted') {
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const token = tokenData?.data;
    if (!token) {
      return null;
    }

    await savePushTokenApi(token);
    return token;
  } catch (error) {
    console.log('Push registration error:', error?.message || error);
    return null;
  }
}
