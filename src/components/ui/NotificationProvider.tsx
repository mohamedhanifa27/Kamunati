'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { HaloPolishedNotification, RimVariant } from './halo-notification';
import { AnimatePresence, motion } from 'framer-motion';

interface NotificationState {
  id: string;
  title: string;
  description?: string;
  variant: RimVariant;
}

interface NotificationContextType {
  notify: (title: string, description?: string, variant?: RimVariant) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notification, setNotification] = useState<NotificationState | null>(null);

  const notify = useCallback((title: string, description?: string, variant: RimVariant = 'default') => {
    setNotification({
      id: Math.random().toString(36).substr(2, 9),
      title,
      description,
      variant
    });

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setNotification(current => {
        if (current?.title === title) {
          return null;
        }
        return current;
      });
    }, 5000);
  }, []);

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {notification && (
            <motion.div 
              key={notification.id}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="pointer-events-auto"
            >
              <HaloPolishedNotification 
                messageKey={notification.id}
                title={notification.title} 
                description={notification.description}
                rim={notification.variant} 
                onDismiss={() => setNotification(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
