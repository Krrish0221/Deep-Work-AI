import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import WebcamDetector from '../components/WebcamDetector';
import { FocusTimerHero, CompactStatsRow, RecentSessions } from '../components/StatsDashboard';
import './Dashboard.css';

const API_BASE_URL = "http://localhost:5000/api";

const Dashboard = () => {
  const [sessionActive, setSessionActive] = useState(false);
  const [focusTime, setFocusTime] = useState(0);
  const [distractionCount, setDistractionCount] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [currentProb, setCurrentProb] = useState(0);
  const [sessionData, setSessionData] = useState([]);
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState("Idle");
  const [distractionEvents, setDistractionEvents] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [active, setActive] = useState(false);
  
  const lastDistractionRef = useRef(0);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/sessions`);
        setHistory(response.data.reverse());
      } catch (err) { console.error("Backend offline"); }
    };
    fetchHistory();
  }, []);

  const getProductivityText = () => {
    if (history.length === 0) return "Welcome to your first focus session! Start guarding to see insights.";
    
    const today = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    const todayFocus = history
      .filter(s => new Date(s.timestamp).toDateString() === today)
      .reduce((acc, s) => acc + s.duration, 0);
    
    const yesterdayFocus = history
      .filter(s => new Date(s.timestamp).toDateString() === yesterdayStr)
      .reduce((acc, s) => acc + s.duration, 0);

    if (yesterdayFocus === 0 && todayFocus === 0) return "Day 1 of your journey! Focus now to build your baseline.";
    if (todayFocus === 0 && yesterdayFocus > 0) return "No focus sessions today yet — start guarding to beat yesterday's mark!";
    
    const diff = yesterdayFocus > 0 ? ((todayFocus - yesterdayFocus) / yesterdayFocus) * 100 : 0;
    const isHigher = diff >= 0;
    
    return (
      <>
        Your focus is <span style={{color: isHigher ? 'var(--status-good)' : 'var(--status-danger)', fontWeight: '700'}}>
          {Math.abs(Math.round(diff))}% {isHigher ? 'stronger' : 'lower'}
        </span> than yesterday's average.
      </>
    );
  };

  useEffect(() => {
    let interval;
    if (sessionActive && (status.toLowerCase().includes('normal') || status.toLowerCase().includes('focus'))) {
      interval = setInterval(() => {
        setFocusTime(prev => prev + 1);
        setCurrentStreak(prev => prev + 1);
      }, 1000);
    } else if (sessionActive && status !== "Idle") {
      const lowerStatus = status.toLowerCase();
      const isActuallyDistracted = lowerStatus.includes('phone') || 
                                   lowerStatus.includes('looking away') || 
                                   lowerStatus.includes('away from desk') || 
                                   lowerStatus.includes('multiple');
      
      if (isActuallyDistracted) {
        setCurrentStreak(0);
      } else {
        // Maintain streak for Focused, Yawning, etc.
        setFocusTime(prev => prev + 1);
        setCurrentStreak(prev => prev + 1);
      }
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
      const now = Date.now();
      // EMERGENCY FIX: 3-second cooldown logic as requested
      if (now - lastDistractionRef.current > 3000) {
        setDistractionCount(prev => prev + 1);
        setDistractionEvents(prev => [...prev, focusTime]);
        lastDistractionRef.current = now;
      }
    }
  }, [sessionActive, focusTime]);

  const toggleSession = () => {
    if (!active) {
      setActive(true);
      setSessionActive(true);
      setStartTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } else {
      handleSessionToggle(false);
      setActive(false);
    }
  };

  const handleSessionToggle = (isActive) => {
    setSessionActive(isActive);
    if (!isActive && focusTime > 0) {
      const sessionInfo = {
        duration: focusTime,
        distractions: distractionCount,
        averageConfidence: sessionData.length > 0 ? (sessionData.reduce((acc, curr) => acc + curr.prob, 0) / sessionData.length) : 0,
        distractionLog: distractionEvents
      };
      
      axios.post(`${API_BASE_URL}/sessions`, sessionInfo)
        .then(res => { setHistory(prev => [res.data, ...prev]); })
        .catch(err => console.error("Session save failed"));
        
      setFocusTime(0);
      setDistractionCount(0);
      setCurrentStreak(0);
      setSessionData([]);
      setDistractionEvents([]);
      setStartTime(null);
      setStatus("Idle");
    }
  };

  return (
    <div className="dashboard-v2-container fade-in">
      <header className="dashboard-header-v2">
        <div className="header-slug">REAL-TIME MONITOR / DEEP FOCUS GUARD</div>
        <h1>DeepWork <span className="gradient-text">Guard</span></h1>
        <p className="productivity-summary-v2">{getProductivityText()}</p>
      </header>

      <div className="hero-row-v2">
        <div className="camera-col-v2">
          <WebcamDetector 
            onStatusChange={handleStatusChange}
            onDistractionDetected={handleDistractionDetected}
            onSessionToggle={handleSessionToggle}
            sessionActive={sessionActive}
            active={active}
            setActive={setActive}
          />
        </div>
        <div className="timer-col-v2">
          <FocusTimerHero 
            focusTime={focusTime}
            sessionActive={sessionActive}
            status={status}
            onToggle={toggleSession}
            startTime={startTime}
          />
        </div>
      </div>

      <div className="stats-row-v3-container">
        <CompactStatsRow 
          distractionCount={distractionCount}
          currentProb={currentProb}
          currentStreak={currentStreak}
          sessionActive={sessionActive}
          sessionCount={history.length}
        />
      </div>

      <div className="history-row-standalone">
        <RecentSessions history={history} />
      </div>
    </div>
  );
};

export default Dashboard;
