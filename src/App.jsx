import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  History, 
  Settings as SettingsIcon, 
  LogOut, 
  User, 
  Bell, 
  Search,
  ShieldCheck,
  X
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import './App.css';

const NotificationDropdown = () => {
  const { notifications, setShowNotifications, clearNotification } = useSettings();
  
  return (
    <div className="notification-dropdown glass-effect">
      <div className="dropdown-header">
        <h4>Recent Insights</h4>
        <button className="btn-icon-xs" onClick={() => setShowNotifications(false)}><X size={14} /></button>
      </div>
      <div className="notification-list">
        {notifications.map(n => (
          <div key={n.id} className={`notification-item ${n.type}`}>
            <div className={`status-dot ${n.type}`}></div>
            <div className="notif-content">
              <p>{n.text}</p>
              <span className="notif-time">{n.time}</span>
            </div>
          </div>
        ))}
        {notifications.length === 0 && <p className="empty-notif">No new notifications</p>}
      </div>
      <button className="btn-text-full">View All Notifications</button>
    </div>
  );
};

const AppContent = () => {
  const { toggleNotifications, showNotifications, notifications, theme } = useSettings();
  const [systemTheme, setSystemTheme] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'Dark' : 'Light'
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setSystemTheme(e.matches ? 'Dark' : 'Light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Set the data-theme attribute on the root element
  useEffect(() => {
    const activeTheme = theme === 'System' ? systemTheme : theme;
    document.documentElement.setAttribute('data-theme', activeTheme.toLowerCase());
  }, [theme, systemTheme]);

  return (
    <BrowserRouter>
      <div className="app-layout">
        {/* Sidebar */}
        <aside className="sidebar glass-effect">
          <div className="sidebar-top">
            <div className="logo-section">
              <div className="logo-icon"><ShieldCheck size={24} strokeWidth={2.5} /></div>
              <h2>DeepWorkGuard</h2>
            </div>
            
            <nav className="nav-menu">
              <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <LayoutDashboard size={20} />
                <span>Dashboard</span>
              </NavLink>
              <NavLink to="/analytics" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <History size={20} />
                <span>Analytics</span>
              </NavLink>
              <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <SettingsIcon size={20} />
                <span>Settings</span>
              </NavLink>
            </nav>
          </div>

          <div className="sidebar-bottom">
            <div className="user-profile">
              <div className="avatar"><User size={20} /></div>
              <div className="user-info">
                <span className="user-name">Krish</span>
                <span className="badge badge-primary">Premium User</span>
              </div>
              <LogOut size={18} className="logout-btn" />
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="main-content">
          <header className="top-bar">
            <div className="search-box glass-effect">
              <Search size={18} strokeWidth={2} />
              <input type="text" placeholder="Search insights..." />
            </div>
            
            <div className="top-actions">
              <div className="notification-wrapper">
                <div 
                  className={`action-btn glass-effect notification-indicator ${showNotifications ? 'active-bell' : ''}`}
                  onClick={toggleNotifications}
                >
                  <Bell size={18} />
                  {notifications.length > 0 && <span className="notification-dot"></span>}
                </div>
                {showNotifications && <NotificationDropdown />}
              </div>
              <div className="date-info">
                {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </header>

          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}

export default App;
