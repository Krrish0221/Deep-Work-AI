import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { TrendingUp, Clock, Inbox, ChevronRight } from 'lucide-react';
import WebcamDetector from '../components/WebcamDetector';
import StatsDashboard from '../components/StatsDashboard';

const API_BASE_URL = "http://localhost:5000/api";

const Dashboard = () => {
  const [sessionActive, setSessionActive] = useState(false);
  const [focusTime, setFocusTime] = useState(0);
  const [distractionCount, setDistractionCount] = useState(0);
  const [currentProb, setCurrentProb] = useState(0);
  const [sessionData, setSessionData] = useState([]);
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState("Idle");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/sessions`);
        setHistory(response.data.reverse());
      } catch (err) { console.error("Backend offline"); }
    };
    fetchHistory();
  }, []);

  // Professional HH:MM:SS timer logic
  useEffect(() => {
    let interval;
    if (sessionActive && (status === "Normal" || status === "Smartwatch" || status === "Smartwatch/Wrist")) {
      interval = setInterval(() => {
        setFocusTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionActive, status]);

  const handleStatusChange = useCallback((newStatus, probability) => {
    if (!sessionActive) return;
    setStatus(newStatus);
    setCurrentProb(probability);
    
    setSessionData(prev => {
      const newData = [...prev, { time: new Date().toLocaleTimeString(), prob: Math.round(probability * 100) }];
      return newData.slice(-50);
    });
  }, [sessionActive]);

  const handleDistractionDetected = useCallback(() => {
    if (sessionActive) {
      setDistractionCount(prev => prev + 1);
    }
  }, [sessionActive]);

  const handleSessionToggle = (isActive) => {
    setSessionActive(isActive);
    if (!isActive && focusTime > 0) {
      const sessionInfo = {
        duration: focusTime,
        distractions: distractionCount,
        averageConfidence: sessionData.length > 0 ? (sessionData.reduce((acc, curr) => acc + curr.prob, 0) / sessionData.length) : 0
      };
      
      axios.post(`${API_BASE_URL}/sessions`, sessionInfo)
        .then(res => { setHistory(prev => [res.data, ...prev]); })
        .catch(err => console.error("Session save failed"));
        
      setFocusTime(0);
      setDistractionCount(0);
      setSessionData([]);
      setStatus("Idle");
    }
  };

  return (
    <div className="dashboard-content">
      <div className="welcome-header">
        <h3>Overview</h3>
        <h1>Welcome back, <span className="gradient-text">Krish</span></h1>
        <p className="welcome-subtitle">Your productivity is <span style={{color: 'var(--status-good)', fontWeight: '600'}}><TrendingUp size={14} style={{display: 'inline', verticalAlign: 'middle'}} /> 12% higher</span> than yesterday's average.</p>
      </div>

      <div className="dashboard-grid">
        <div className="grid-left">
          <WebcamDetector 
            onStatusChange={handleStatusChange}
            onDistractionDetected={handleDistractionDetected}
            onSessionToggle={handleSessionToggle}
            sessionActive={sessionActive}
          />
        </div>

        <div className="grid-right">
          <StatsDashboard 
            sessionData={sessionData}
            distractionCount={distractionCount}
            focusTime={focusTime}
            currentProb={currentProb}
            sessionActive={sessionActive}
            history={history}
          />
          
          <div className="recent-history glass-effect">
            <div className="section-header">
              <h3>Recent Sessions</h3>
              <button className="text-btn">View Full Report <ChevronRight size={14} /></button>
            </div>
            
            <div className="history-list">
              {history.slice(0, 3).map(session => (
                <div key={session.id} className="history-item">
                  <div className="history-icon focus-icon"><Clock size={16} /></div>
                  <div className="history-details">
                    <span className="h-date">{new Date(session.timestamp).toLocaleDateString(undefined, {month: 'long', day: 'numeric'})}</span>
                    <span className="h-duration">{Math.floor(session.duration / 60)}h {session.duration % 60}m</span>
                  </div>
                  <div className="history-stats">
                    <span className="badge badge-danger">-{session.distractions}</span>
                  </div>
                </div>
              ))}
              {history.length === 0 && (
                <div className="empty-state">
                  <Inbox size={40} strokeWidth={1} />
                  <p>No session history found.</p>
                  <span className="text-xs">Start your first focus session to see data.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
