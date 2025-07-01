
import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface NotificationContextType {
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000); // Auto-dismiss after 5 seconds
  }, []);

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      <NotificationToastsImpl notifications={notifications} removeNotification={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} />
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

// Moved implementation part to be callable from provider
interface NotificationToastsImplProps {
    notifications: Notification[];
    removeNotification: (id: string) => void;
}

const NotificationToastsImpl: React.FC<NotificationToastsImplProps> = ({ notifications, removeNotification }) => {
  return (
    <div className="fixed top-20 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 rounded-md shadow-lg text-white flex justify-between items-center
            ${notification.type === 'success' ? 'bg-green-500' : ''}
            ${notification.type === 'error' ? 'bg-red-500' : ''}
            ${notification.type === 'info' ? 'bg-blue-500' : ''}
          `}
        >
          <span>{notification.message}</span>
          <button onClick={() => removeNotification(notification.id)} className="ml-4 text-xl font-bold">&times;</button>
        </div>
      ))}
    </div>
  );
};

// Exporting a wrapper component to be used in App.tsx
// This avoids directly rendering NotificationToastsImpl inside Provider's value, which is not ideal.
export const NotificationToasts: React.FC = () => {
    // This component doesn't need to render anything itself if logic is in Provider
    // Or, it could fetch notifications from context if not passed as props, but current design passes them.
    // The current design with NotificationToastsImpl rendered by Provider is okay.
    // No specific component needed here as Provider renders its own UI part.
    return null; 
};
