import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import WebcamDetector from '../components/WebcamDetector';
import { FocusTimerHero, CompactStatsRow, RecentSessions } from '../components/StatsDashboard';
import { SessionStartModal, SessionReportModal, HistoryArchiveModal } from '../components/SessionModals';
import './Dashboard.css';

const Dashboard = () => {
  // Session State
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionState, setSessionState] = useState('idle'); // 'idle' | 'focus' | 'break'
  const [showStartModal, setShowStartModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [sessionConfig, setSessionConfig] = useState(null);
  const [reportData, setReportData] = useState(null);

  // Timer States
  const [remainingTime, setRemainingTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [focusTime, setFocusTime] = useState(0);
  const [distractedTime, setDistractedTime] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  
  // Live Detection Stats
  const [status, setStatus] = useState("Idle");
  const [currentProb, setCurrentProb] = useState(0);
  const [distractionCount, setDistractionCount] = useState(0);
  const [history, setHistory] = useState([]);

  // Distraction Stats for Breakdown
  const distractionStats = useRef({ phone: 0, looking_away: 0, away_from_desk: 0, yawning: 0, multiple_people: 0, slouching: 0 });

  // Distraction Escalation & Debounce
  const [escalationLevel, setEscalationLevel] = useState(0);
  const consecutiveDistractions = useRef(0);
  const distractionSeconds = useRef(0);
  const lastStateChangeTime = useRef(0);
  const timeline = useRef([]);
  const timerInterval = useRef(null);
  const audioCtx = useRef(null);

  // Load History
  useEffect(() => {
    const fetchHistory = () => {
      try {
        const saved = localStorage.getItem('focus_history');
        if (saved) {
          setHistory(JSON.parse(saved));
        }
      } catch (err) { console.error("Local storage error"); }
    };
    fetchHistory();
  }, []);

  // Timer Engine
  useEffect(() => {
    if (sessionActive && sessionState !== 'idle') {
      timerInterval.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
        
        if (sessionConfig?.duration > 0 && sessionState === 'focus') {
          setRemainingTime(prev => {
            if (prev <= 1) {
              endSession();
              return 0;
            }
            return prev - 1;
          });
        }

        if (sessionState === 'focus') {
          const lowerStatus = status.toLowerCase();
          const isDistracted = lowerStatus.includes('phone') || 
                              lowerStatus.includes('away') || 
                              lowerStatus.includes('multiple') || 
                              lowerStatus.includes('looking') ||
                              lowerStatus.includes('slouching');
          
          if (isDistracted) {
            setDistractedTime(prev => prev + 1);
            setCurrentStreak(0);
            distractionSeconds.current += 1;
            handleEscalation(distractionSeconds.current);
          } else {
            setFocusTime(prev => prev + 1);
            setCurrentStreak(prev => {
              const next = prev + 1;
              if (next > longestStreak) setLongestStreak(next);
              return next;
            });
            distractionSeconds.current = 0;
            setEscalationLevel(0);
            if (window.speechSynthesis.speaking) {
              window.speechSynthesis.cancel();
            }
          }
        }
      }, 1000);
    } else {
      clearInterval(timerInterval.current);
    }
    return () => clearInterval(timerInterval.current);
  }, [sessionActive, sessionState, status, longestStreak]);

  const handleEscalation = (seconds) => {
    if (seconds >= 15) {
      if (escalationLevel < 3) {
        setEscalationLevel(3);
        playVoiceAlert("Hey, refocus!");
      } else if (seconds % 5 === 0) {
        playVoiceAlert("Please refocus!");
        playChime();
      }
    } else if (seconds >= 7) {
      if (escalationLevel < 2) {
        setEscalationLevel(2);
        playChime();
      }
    } else if (seconds >= 3) {
      if (escalationLevel < 1) setEscalationLevel(1);
    }
  };

  const playChime = () => {
    if (!audioCtx.current) audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.current.createOscillator();
    const gain = audioCtx.current.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, audioCtx.current.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, audioCtx.current.currentTime + 0.4);
    gain.gain.setValueAtTime(0.15, audioCtx.current.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.current.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(audioCtx.current.destination);
    osc.start();
    osc.stop(audioCtx.current.currentTime + 0.4);
  };

  const playVoiceAlert = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    window.speechSynthesis.speak(utterance);
  };

  const logTimelineEvent = (nextState) => {
    const now = elapsedTime;
    const duration = now - lastStateChangeTime.current;
    
    if (duration > 0) {
      const lowerStatus = status.toLowerCase();
      const currentState = sessionState === 'break' ? 'break' : 
                          (lowerStatus.includes('phone') || 
                           lowerStatus.includes('looking') || 
                           lowerStatus.includes('away') || 
                           lowerStatus.includes('multiple') ||
                           lowerStatus.includes('slouching')) ? 'distracted' : 'focused';

      timeline.current.push({
        time: lastStateChangeTime.current,
        state: currentState,
        duration: duration,
        label: status
      });
      lastStateChangeTime.current = now;
    }
  };

  const handleStatusChange = useCallback((newStatus, probability) => {
    if (!sessionActive) return;
    
    const lowerStatus = newStatus.toLowerCase();
    const isDistracted = lowerStatus.includes('phone') || lowerStatus.includes('away') || lowerStatus.includes('multiple') || lowerStatus.includes('looking') || lowerStatus.includes('slouching');
    
    if (isDistracted) {
      consecutiveDistractions.current += 1;
    } else {
      consecutiveDistractions.current = 0;
    }

    if (consecutiveDistractions.current >= 3 || !isDistracted) {
      if (newStatus !== status) {
        logTimelineEvent(newStatus);
        setStatus(newStatus);
        
        if (isDistracted && consecutiveDistractions.current === 3) {
           setDistractionCount(prev => prev + 1);
           if (lowerStatus.includes('phone')) distractionStats.current.phone += 1;
           else if (lowerStatus.includes('looking')) distractionStats.current.looking_away += 1;
           else if (lowerStatus.includes('away')) distractionStats.current.away_from_desk += 1;
           else if (lowerStatus.includes('yawning')) distractionStats.current.yawning += 1;
           else if (lowerStatus.includes('multiple')) distractionStats.current.multiple_people += 1;
           else if (lowerStatus.includes('slouching')) distractionStats.current.slouching += 1;
        }
      }
    }
    setCurrentProb(probability);
  }, [sessionActive, status, elapsedTime, sessionState]);

  const startSession = (config) => {
    if (config.monitorOnly) {
      setSessionActive(true);
      setSessionState('focus');
      setShowStartModal(false);
      return;
    }

    setSessionConfig(config);
    setRemainingTime(config.duration * 60);
    setElapsedTime(0);
    setFocusTime(0);
    setDistractedTime(0);
    setDistractionCount(0);
    setCurrentStreak(0);
    setLongestStreak(0);
    distractionStats.current = { 
      phone: 0, 
      looking_away: 0, 
      away_from_desk: 0, 
      yawning: 0, 
      multiple_people: 0, 
      slouching: 0 
    };
    timeline.current = [];
    lastStateChangeTime.current = 0;
    
    setSessionActive(true);
    setSessionState('focus');
    setShowStartModal(false);
    setShowReportModal(false);
  };

  const endSession = async () => {
    logTimelineEvent('idle');
    const focused = focusTime;
    const distracted = distractedTime;
    const total = focused + distracted || 1;
    const score = Math.round((focused / total) * 100);
    
    const report = {
      id: Date.now(),
      focusScore: score,
      focusedTime: focused,
      distractedTime: distracted,
      distractions: distractionCount,
      longestStreak: longestStreak,
      taskName: sessionConfig?.taskName || "General Focus",
      technique: sessionConfig?.technique || "Deep Work",
      timeline: timeline.current,
      distractionBreakdown: distractionStats.current,
      duration: elapsedTime,
      timestamp: new Date().toISOString()
    };

    setReportData(report);
    setSessionActive(false);
    setSessionState('idle');
    setShowReportModal(true);
    setEscalationLevel(0);
    window.speechSynthesis.cancel();

    try {
      const saved = JSON.parse(localStorage.getItem('focus_history') || '[]');
      const newHistory = [report, ...saved].slice(0, 50);
      localStorage.setItem('focus_history', JSON.stringify(newHistory));
      setHistory(newHistory);
    } catch (e) { console.error("Local save failed", e); }
  };

  const toggleBreak = () => {
    if (sessionState === 'focus') {
      logTimelineEvent('break');
      setSessionState('break');
      setEscalationLevel(0);
    } else {
      logTimelineEvent('focus');
      setSessionState('focus');
    }
  };

  return (
    <div className="dashboard-v2-container fade-in">
      {escalationLevel === 3 && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, bottom: 0, right: 0,
          background: 'rgba(100, 0, 0, 0.8)',
          zIndex: 2147483647,
          display: 'grid',
          placeItems: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            padding: '40px 30px',
            borderRadius: '24px',
            textAlign: 'center',
            maxWidth: '400px',
            width: '100%',
            color: '#000000',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
          }}>
            <div style={{ fontSize: '50px', marginBottom: '15px' }}>⚠️</div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '900', marginBottom: '10px', color: '#000' }}>Refocus Required</h2>
            <p style={{ color: '#666', fontSize: '1rem', marginBottom: '15px', fontWeight: '600' }}>
               {status.includes('Phone') ? '📱 Phone' : 
                status.includes('Away') ? '👤 Away' : 
                status.includes('Looking') ? '👀 Looking Away' : '⚠️ Distraction'} detected
            </p>

            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              padding: '6px 16px',
              borderRadius: '99px',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              marginBottom: '2.5rem',
              color: '#ef4444',
              fontWeight: '700',
              fontSize: '0.9rem'
            }}>
              <span style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', animation: 'pulse 1s infinite' }}></span>
              {Math.floor(distractionSeconds.current / 60).toString().padStart(2, '0')}:{(distractionSeconds.current % 60).toString().padStart(2, '0')} distracted
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                onClick={() => { setEscalationLevel(0); distractionSeconds.current = 0; }}
                style={{ background: '#22c55e', color: '#fff', padding: '16px', borderRadius: '12px', border: 'none', fontWeight: '800', fontSize: '18px', cursor: 'pointer' }}
              >
                ✅ I'm Back
              </button>
              <button 
                onClick={toggleBreak}
                style={{ background: '#f3f4f6', color: '#374151', padding: '14px', borderRadius: '12px', border: '1px solid #d1d5db', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}
              >
                ☕ Take 2min Break
              </button>
            </div>
          </div>
        </div>
      )}

      <SessionStartModal 
        isOpen={showStartModal} 
        onStart={startSession} 
        onClose={() => setShowStartModal(false)} 
      />
      
      <SessionReportModal 
        isOpen={showReportModal} 
        data={reportData} 
        onClose={() => setShowReportModal(false)} 
        onRestart={() => {
          setShowReportModal(false);
          setShowStartModal(true);
        }}
      />

      <HistoryArchiveModal 
        isOpen={showHistoryModal}
        history={history}
        onClose={() => setShowHistoryModal(false)}
      />

      <header className="dashboard-header-v2">
        <div className="header-slug">REAL-TIME MONITOR / DEEP FOCUS GUARD</div>
        <h1>DeepWork <span className="gradient-text">Guard</span></h1>
      </header>

      <div className="hero-row-v2">
        <div className="camera-col-v2">
          <WebcamDetector 
            onStatusChange={handleStatusChange}
            sessionActive={sessionActive}
            active={sessionActive}
            escalationLevel={escalationLevel}
          />
        </div>
        <div className="timer-col-v2">
          <FocusTimerHero 
            remainingTime={remainingTime}
            elapsedTime={elapsedTime}
            sessionActive={sessionActive}
            sessionState={sessionState}
            status={status}
            onToggle={() => sessionActive ? endSession() : setShowStartModal(true)}
            onBreak={toggleBreak}
            config={sessionConfig}
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
        <RecentSessions 
          history={history} 
          onViewAll={() => setShowHistoryModal(true)} 
        />
      </div>
    </div>
  );
};

export default Dashboard;
