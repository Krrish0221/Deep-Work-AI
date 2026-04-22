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
  X,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import './App.css';

const NotificationDropdown = () => {
  const { notifications, setShowNotifications, markAllAsRead } = useSettings();
  
  return (
    <div className="notification-dropdown glass-effect slide-up">
      <div className="dropdown-header">
        <div className="header-info">
          <h4>Notifications</h4>
          <span className="notif-count">{notifications.filter(n => n.unread).length} New</span>
        </div>
        <button className="btn-text-xs" onClick={markAllAsRead}>Mark all read</button>
      </div>
      <div className="notification-list custom-scrollbar">
        {notifications.map(n => (
          <div key={n.id} className={`notification-item ${n.unread ? 'unread' : 'read'}`}>
            <div className={`status-icon-v2 ${n.type}`}>
              {n.type === 'danger' && '🔴'}
              {n.type === 'warning' && '🟡'}
              {n.type === 'success' && '🟢'}
              {n.type === 'info' && '🔵'}
            </div>
            <div className="notif-content-v2">
              <div className="notif-title-row">
                <p className="notif-title">{n.title}</p>
                <span className="notif-time-v2">{n.time}</span>
              </div>
              <p className="notif-desc">{n.text}</p>
            </div>
          </div>
        ))}
        {notifications.length === 0 && (
          <div className="empty-notif-v2">
            <Bell size={32} opacity={0.2} />
            <p>Your inbox is empty</p>
          </div>
        )}
      </div>
      <div className="dropdown-footer">
        <button className="btn-text-full">View All Notifications <ChevronRight size={14} /></button>
      </div>
    </div>
  );
};

const CommandPalette = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const quickActions = [
    { icon: <ShieldCheck size={18} />, label: "Start Focus Session", cmd: "Shift + S" },
    { icon: <History size={18} />, label: "View Analytics", cmd: "G + A" },
    { icon: <LayoutDashboard size={18} />, label: "Export Session Data", cmd: "Shift + E" },
    { icon: <SettingsIcon size={18} />, label: "Open Settings", cmd: "G + S" },
  ];

  const searchExamples = [
    "Show sessions with 50+ distractions",
    "Yesterday's focus report",
    "Best focus streak this month",
    "Phone distractions in April"
  ];

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette glass-effect slide-up" onClick={e => e.stopPropagation()}>
        <div className="palette-search-header">
          <Search size={20} className="palette-icon" />
          <input autoFocus placeholder="Type a command or search..." className="palette-input" />
          <div className="esc-hint">ESC</div>
        </div>
        
        <div className="palette-sections">
          <div className="palette-section">
            <h5>Quick Actions</h5>
            <div className="palette-list">
              {quickActions.map((action, i) => (
                <div key={i} className="palette-item">
                  <div className="item-main">
                    {action.icon}
                    <span>{action.label}</span>
                  </div>
                  <kbd className="item-kbd">{action.cmd}</kbd>
                </div>
              ))}
            </div>
          </div>
          
          <div className="palette-divider"></div>
          
          <div className="palette-section">
            <h5>Search Insights</h5>
            <div className="palette-list">
              {searchExamples.map((example, i) => (
                <div key={i} className="palette-item example">
                  <Search size={14} />
                  <span>{example}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="palette-footer">
          <span>↑↓ to navigate</span>
          <span>↵ to select</span>
        </div>
      </div>
    </div>
  );
};

const AppContent = () => {
  const { 
    toggleNotifications, 
    showNotifications, 
    theme, 
    hasUnread, 
    isSidebarCollapsed, 
    toggleSidebar,
    userName,
    avatarColor,
    avatarType,
    avatarSource
  } = useSettings();
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [systemTheme, setSystemTheme] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'Dark' : 'Light'
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsPaletteOpen(prev => !prev);
      }
      if (e.key === 'Escape') setIsPaletteOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      <div className={`app-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Sidebar */}
        <aside className="sidebar glass-effect">
          <button className="sidebar-toggle-v3" onClick={toggleSidebar} title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}>
            {isSidebarCollapsed ? '›' : '‹'}
          </button>

          <div className="sidebar-top">
            <div className="logo-section">
              <div className="logo-icon"><ShieldCheck size={22} strokeWidth={2.5} /></div>
              <h2 className="sidebar-label">DeepWorkGuard</h2>
            </div>
            
            <nav className="nav-menu">
              <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} data-name="Dashboard">
                <LayoutDashboard size={20} />
                <span className="sidebar-label">Dashboard</span>
              </NavLink>
              <NavLink to="/analytics" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} data-name="Analytics">
                <History size={20} />
                <span className="sidebar-label">Analytics</span>
              </NavLink>
              <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} data-name="Settings">
                <SettingsIcon size={20} />
                <span className="sidebar-label">Settings</span>
              </NavLink>
            </nav>
          </div>

          <div className="sidebar-footer">
            <div className="sidebar-divider"></div>
            <div className="user-profile-row-v3">
              <div 
                className="user-avatar-mini" 
                style={{ 
                  background: avatarType === 'initials' ? `linear-gradient(135deg, ${avatarColor}, #1e2035)` : 'none',
                  border: avatarType === 'upload' ? 'none' : '2px solid rgba(255,255,255,0.1)',
                  boxShadow: `0 4px 10px ${avatarColor}40`
                }}
              >
                {avatarType === 'initials' ? (
                  userName.charAt(0)
                ) : (
                  <img src={avatarSource} alt="User" className="avatar-img-actual" />
                )}
              </div>
              <div className="user-details-mini sidebar-label">
                <span className="user-name-mini">{userName}</span>
                <div className="user-status-mini">
                  <div className="status-dot-mini"></div>
                  <span>Premium</span>
                </div>
              </div>
              <button className="logout-btn-v3" title="Sign Out">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="main-content">
          <header className="top-bar">
            <div className="search-box glass-effect" onClick={() => setIsPaletteOpen(true)}>
              <Search size={18} strokeWidth={2} />
              <div className="search-placeholder">Search insights...</div>
              <kbd className="search-kbd">⌘K</kbd>
            </div>
            
            <div className="top-actions">
              <div className="notification-wrapper">
                <div 
                  className={`action-btn glass-effect ${showNotifications ? 'active-bell' : ''} ${hasUnread ? 'has-unread' : ''}`}
                  onClick={toggleNotifications}
                >
                  <Bell size={20} className="bell-icon-v2" />
                  {hasUnread && <span className="notification-badge-v2"></span>}
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
        <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />
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
