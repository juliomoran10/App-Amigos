import { Platform } from 'react-native';
import Constants from 'expo-constants';

const PRODUCTION_API_URL = 'https://friendmatch-backend.onrender.com';

// Si tu teléfono no detecta la IP automáticamente, pon aquí la IP de tu PC
// (ej: '192.168.0.108') y el resto funcionará.
const EXPLICIT_DEV_HOST = '';

function getDevServerHost() {
  if (EXPLICIT_DEV_HOST) {
    return EXPLICIT_DEV_HOST;
  }
  try {
    const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.hostUri;
    if (hostUri) {
      const host = hostUri.split(':')[0];
      if (
        host &&
        host !== 'localhost' &&
        host !== '127.0.0.1' &&
        !host.includes('exp.direct') &&
        !host.includes('expo.dev')
      ) {
        return host;
      }
    }
  } catch {}
  return null;
}

const getBaseUrl = () => {
  if (__DEV__) {
    const devHost = getDevServerHost();
    if (devHost && devHost !== 'localhost' && devHost !== '127.0.0.1') {
      return `http://${devHost}:4000`;
    }

    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:4000';
    }

    return 'http://localhost:4000';
  }

  return PRODUCTION_API_URL;
};

export const API_BASE_URL = getBaseUrl();
