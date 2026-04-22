import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const [accentColor, setAccentColor] = useState('#6366f1');
  const [theme, setTheme] = useState('Dark');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    localStorage.getItem('sidebar_collapsed') === 'true'
  );

  // AI Core State
  const [aiProvider, setAiProvider] = useState('Teachable Machine');
  const [confidenceThreshold, setConfidenceThreshold] = useState(85);
  const [teachableUrl, setTeachableUrl] = useState('https://teachablemachine.withgoogle.com/models/-YCasu5Jm/');
  const [roboflowConfig, setRoboflowConfig] = useState({
    apiKey: 'rf_PYTMexEStZYGUWefzBTc0oLjqd32',
    model: 'deepworkai-v2.1', // Assuming the slug based on name
    version: '1'
  });

  // Notification State
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'danger', title: 'Critical Distraction', text: 'Phone detected for 5+ minutes in Session #42.', time: '2m ago', unread: true },
    { id: 2, type: 'warning', title: 'Focus Dropping', text: 'Your focus score dipped below 60% in the last 15 mins.', time: '15m ago', unread: true },
    { id: 3, type: 'success', title: 'Goal Achieved!', text: 'You completed your 2h daily focus goal. Keep it up!', time: '1h ago', unread: false },
    { id: 4, type: 'info', title: 'Weekly Summary', text: 'Your average focus time is up by 12% this week.', time: '5h ago', unread: false },
  ]);

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
      isSidebarCollapsed, toggleSidebar,
      aiProvider, setAiProvider,
      confidenceThreshold, setConfidenceThreshold,
      teachableUrl, setTeachableUrl,
      roboflowConfig, setRoboflowConfig
    }}>
      {children}
    </SettingsContext.Provider>
  );
};
