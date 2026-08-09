import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config/api';
import { getToken } from '../services/sessionStorage';

export function useSocket(enabled = true) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let mounted = true;
    let instance = null;

    async function connect() {
      const token = await getToken();
      if (!token) {
        return;
      }

      const s = io(API_BASE_URL, {
        auth: { token },
        transports: ['websocket'],
        autoConnect: true
      });

      instance = s;

      if (mounted) {
        setSocket(s);
      }

      s.on('connect_error', (err) => {
        console.log('Socket connect_error:', err.message);
      });
    }

    connect();

    return () => {
      mounted = false;
      if (instance) {
        instance.disconnect();
      }
    };
  }, [enabled]);

  return socket;
}
