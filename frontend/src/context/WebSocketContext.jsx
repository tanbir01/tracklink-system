import { createContext, useEffect, useRef, useState, useCallback } from 'react';
import { WebSocketClient } from '../api/websocket';
import { useAuth } from '../hooks/useAuth';

export const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [deviceLocations, setDeviceLocations] = useState({});
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) {
      if (wsRef.current) {
        wsRef.current.disconnect();
        wsRef.current = null;
      }
      setConnected(false);
      return;
    }

    const token = localStorage.getItem('access_token');
    const client = new WebSocketClient();
    wsRef.current = client;

    client.on('connected', () => setConnected(true));
    client.on('disconnected', () => setConnected(false));

    client.on('location_update', (data) => {
      setDeviceLocations((prev) => ({
        ...prev,
        [data.device_id]: {
          ...data,
          timestamp: new Date().toISOString(),
        },
      }));
      setLastMessage({ type: 'location_update', data });
    });

    client.on('alert', (data) => {
      setAlerts((prev) => [data, ...prev].slice(0, 50));
      setLastMessage({ type: 'alert', data });
    });

    client.on('device_status', (data) => {
      setLastMessage({ type: 'device_status', data });
    });

    client.connect(token);

    return () => {
      client.disconnect();
    };
  }, [isAuthenticated]);

  const subscribe = useCallback((event, callback) => {
    if (wsRef.current) {
      return wsRef.current.on(event, callback);
    }
    return () => {};
  }, []);

  const sendMessage = useCallback((type, data) => {
    if (wsRef.current) {
      wsRef.current.send(type, data);
    }
  }, []);

  const value = {
    connected,
    lastMessage,
    deviceLocations,
    alerts,
    subscribe,
    sendMessage,
  };

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
}
