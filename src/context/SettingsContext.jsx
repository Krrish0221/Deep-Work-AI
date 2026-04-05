import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const [accentColor, setAccentColor] = useState('#6366f1');
  const [theme, setTheme] = useState('Dark');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'success', text: "Your focus streak is up 15% today!", time: "2m ago" },
    { id: 2, type: 'info', text: "Peak productivity window detected: 9am-11am", time: "1h ago" },
    { id: 3, type: 'warning', text: "High phone distraction level in last session", time: "3h ago" }
  ]);

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

  const toggleNotifications = () => setShowNotifications(prev => !prev);
  const clearNotification = (id) => setNotifications(prev => prev.filter(n => n.id !== id));

  return (
    <SettingsContext.Provider value={{
      accentColor, setAccentColor,
      theme, setTheme,
      showNotifications, setShowNotifications, toggleNotifications,
      notifications, clearNotification
    }}>
      {children}
    </SettingsContext.Provider>
  );
};
