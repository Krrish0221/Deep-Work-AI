import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, 
  History, 
  Settings, 
  LogOut, 
  User, 
  Bell, 
  Search,
  ShieldCheck,
  Clock
} from 'lucide-react';
import WebcamDetector from './components/WebcamDetector';
import StatsDashboard from './components/StatsDashboard';
import './App.css';

const API_BASE_URL = "http://localhost:5000/api";

function App() {
  const [sessionActive, setSessionActive] = useState(false);
  const [focusTime, setFocusTime] = useState(0);
  const [distractionCount, setDistractionCount] = useState(0);
  const [currentProb, setCurrentProb] = useState(0);
  const [sessionData, setSessionData] = useState([]);
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState("Idle");

  // Load history from backend
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/sessions`);
        setHistory(response.data.reverse());
      } catch (err) {
        console.error("Backend offline, using local state");
      }
    };
    fetchHistory();
  }, []);

  // Timer logic
  useEffect(() => {
    let interval;
    if (sessionActive) {
      interval = setInterval(() => {
        setFocusTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionActive]);

  const handleStatusChange = useCallback((newStatus, probability) => {
    setStatus(newStatus);
    setCurrentProb(probability);
    
    // Add data point for chart (keep last 50 points)
    setSessionData(prev => {
      const newData = [...prev, { time: new Date().toLocaleTimeString(), prob: Math.round(probability * 100) }];
      return newData.slice(-50);
    });
  }, []);

  const handleDistractionDetected = useCallback(() => {
    setDistractionCount(prev => prev + 1);
  }, []);

  const handleSessionToggle = (isActive) => {
    setSessionActive(isActive);
    if (!isActive && focusTime > 0) {
      // Save session to backend
      const sessionInfo = {
        duration: focusTime,
        distractions: distractionCount,
        averageConfidence: sessionData.reduce((acc, curr) => acc + curr.prob, 0) / sessionData.length || 0
      };
      
      axios.post(`${API_BASE_URL}/sessions`, sessionInfo)
        .then(res => {
          setHistory(prev => [res.data, ...prev]);
        })
        .catch(err => console.error("Failed to save session"));
        
      // Reset for next session
      setFocusTime(0);
      setDistractionCount(0);
      setSessionData([]);
    }
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar glass-effect">
        <div className="logo-section">
          <div className="logo-icon"><ShieldCheck size={24} /></div>
          <h2>DeepWork</h2>
        </div>
        
        <nav className="nav-menu">
          <div className="nav-item active"><LayoutDashboard size={20} /> Dashboard</div>
          <div className="nav-item"><History size={20} /> Analytics</div>
          <div className="nav-item"><Settings size={20} /> Settings</div>
        </nav>

        <div className="user-profile">
          <div className="avatar"><User size={20} /></div>
          <div className="user-info">
            <span className="user-name">Krish</span>
            <span className="user-role">Premium User</span>
          </div>
          <LogOut size={18} className="logout-btn" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="top-bar">
          <div className="search-box glass-effect">
            <Search size={18} />
            <input type="text" placeholder="Search analytics..." />
          </div>
          
          <div className="top-actions">
            <div className="action-btn glass-effect"><Bell size={18} /></div>
            <div className="date-display glass-effect">{new Date().toLocaleDateString()}</div>
          </div>
        </header>

        <div className="dashboard-content">
          <div className="welcome-header">
            <h1>Welcome back, <span className="gradient-text">Krish</span></h1>
            <p>Your productivity score is 12% higher than yesterday.</p>
          </div>

          <div className="dashboard-grid">
            {/* Left Col: Detector */}
            <div className="grid-left">
              <WebcamDetector 
                onStatusChange={handleStatusChange}
                onDistractionDetected={handleDistractionDetected}
                onSessionToggle={handleSessionToggle}
              />
            </div>

            {/* Right Col: Stats */}
            <div className="grid-right">
              <StatsDashboard 
                sessionData={sessionData}
                distractionCount={distractionCount}
                focusTime={focusTime}
                currentProb={currentProb}
              />
              
              <div className="recent-history glass-effect">
                <div className="history-header">
                  <h3>Recent Sessions</h3>
                  <button className="text-btn">View All</button>
                </div>
                <div className="history-list">
                  {history.slice(0, 4).map(session => (
                    <div key={session.id} className="history-item">
                      <div className="history-icon"><Clock size={16} /></div>
                      <div className="history-details">
                        <span className="h-date">{new Date(session.timestamp).toLocaleDateString()}</span>
                        <span className="h-duration">{Math.floor(session.duration / 60)}m {session.duration % 60}s</span>
                      </div>
                      <div className="history-stats">
                        <span className="h-distraction">-{session.distractions}</span>
                      </div>
                    </div>
                  ))}
                  {history.length === 0 && <p className="empty-msg">No session history found.</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
