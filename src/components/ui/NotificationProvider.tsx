// [RECTIFICATION:BUILD_ERROR_NOTIFICATION_PROVIDER_JSX_SYNTAX]
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
          {/* [RECTIFICATION:IMPROVE_ANIMATIONS] Smooth spring toast entrance */}
          {notification && (
            <motion.div 
              key={notification.id}
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 10 }}
              transition={{ type: 'spring', duration: 0.38, bounce: 0.16 }}
              className="pointer-events-auto"
            >
              <HaloPolishedNotification 
                messageKey={notification.id}
                title={notification.title} 
                description={notification.description}
                rimVariant={notification.variant} 
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
