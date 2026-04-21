import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const [accentColor, setAccentColor] = useState('#6366f1');
  const [theme, setTheme] = useState('Dark');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    localStorage.getItem('sidebar_collapsed') === 'true'
  );

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const newState = !prev;
      localStorage.setItem('sidebar_collapsed', newState);
      return newState;
    });
  };

  // Sync accent color to CSS variables
  useEffect(() => {
    document.documentElement.style.setProperty('--brand-primary', accentColor);
    
    // Calculate contrast color for text on accent background
    const hex = accentColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    const contrastColor = brightness > 155 ? '#000000' : '#ffffff';
    document.documentElement.style.setProperty('--text-on-brand', contrastColor);
    
    // Also derive a softer version for shadows/glows
    document.documentElement.style.setProperty('--brand-primary-glow', `${accentColor}4D`); // 30% opacity
  }, [accentColor]);

  const toggleNotifications = () => {
    setShowNotifications(prev => !prev);
    // Note: We don't clear hasUnread until they click mark all as read
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    setHasUnread(false);
  };

  const clearNotification = (id) => setNotifications(prev => prev.filter(n => n.id !== id));

  return (
    <SettingsContext.Provider value={{
      accentColor, setAccentColor,
      theme, setTheme,
      showNotifications, setShowNotifications, toggleNotifications,
      notifications, clearNotification, hasUnread, markAllAsRead,
      isSidebarCollapsed, toggleSidebar
    }}>
      {children}
    </SettingsContext.Provider>
  );
};  );
};
