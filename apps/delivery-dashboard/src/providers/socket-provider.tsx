'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getApiBaseUrl } from '@foodhub/config';
import { useDeliveryAuthStore } from '../stores/use-delivery-auth-store';

const SocketContext = createContext<Socket | null>(null);

export const useDeliverySocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { isAuthenticated, accessToken } = useDeliveryAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      return;
    }

    const socketUrl = getApiBaseUrl().replace('/api/v1', '');
    const newSocket = io(`${socketUrl}/orders`, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      newSocket.emit('joinDriver', { token: accessToken });
      newSocket.emit('joinAvailableDrivers');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, accessToken]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};
