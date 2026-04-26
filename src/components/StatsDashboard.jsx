import React from 'react';
import { 
  Clock, 
  AlertTriangle, 
  Activity, 
  Zap,
  ChevronRight,
  Target
} from 'lucide-react';
import './StatsDashboard.css';

const formatTime = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

const formatDigits = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map(v => v.toString().padStart(2, '0'))
    .join(':');
};

export const FocusTimerHero = ({ remainingTime, elapsedTime, sessionActive, sessionState, status, onToggle, onBreak, config, pomodoroCount }) => {
  const formatDigits = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours > 0 ? hours : null, minutes, seconds]
      .filter(v => v !== null)
      .map(v => v.toString().padStart(2, '0'))
      .join(':');
  };

  const lowerStatus = (status || "").toLowerCase();
  const isDistracted = lowerStatus.includes('phone') || 
                      lowerStatus.includes('away') || 
                      lowerStatus.includes('multiple') || 
                      lowerStatus.includes('looking') ||
                      lowerStatus.includes('slouching');

  const stateLabel = !sessionActive ? 'STANDBY' : 
                     sessionState === 'break' ? 'ON BREAK' :
                     isDistracted ? 'DISTRACTED' : 'FOCUSED';
  
  const stateColor = !sessionActive ? 'var(--text-dim)' :
                     sessionState === 'break' ? 'var(--status-info)' :
                     isDistracted ? 'var(--status-danger)' : 'var(--status-good)';

  const progress = config?.duration ? ((elapsedTime / (config.duration * 60)) * 100) : 0;

  const renderPomodoroProgress = () => {
    const dots = [];
    for (let i = 0; i < 4; i++) {
      dots.push(i < (pomodoroCount % 4) ? '🍅' : '○');
    }
    return <div className="pomodoro-dots" style={{ display: 'flex', gap: '4px', fontSize: '1.2rem' }}>{dots.join('')}</div>;
  };

  const isLongBreak = sessionState === 'break' && pomodoroCount > 0 && pomodoroCount % 4 === 0;

  return (
    <div className="timer-hero-container-v2 glass-effect">
      <div className="card-top-label" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Target size={14} />
          <span>{config?.technique || 'FOCUS TIMER'}</span>
        </div>
        {config?.technique === 'Pomodoro' && renderPomodoroProgress()}
      </div>

      <div className="timer-header-v3" style={{ marginTop: '1.25rem' }}>
        {config?.taskName && <p className="working-on-txt" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Working on: {config.taskName}</p>}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="state-badge-v3" style={{ background: stateColor }}>{stateLabel}</span>
          {sessionState === 'break' && (
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700' }}>
               {isLongBreak ? '🏠 LONG BREAK' : '⚡ SHORT BREAK'}
            </span>
          )}
        </div>
      </div>
      
      <div className="timer-display-v3" style={{ padding: '1.5rem 0' }}>
        <h2 className="timer-digits-v3" style={{ fontSize: '4rem', fontWeight: '800' }}>
          {sessionActive ? formatDigits(config?.duration ? remainingTime : elapsedTime) : '00:00'}
        </h2>
        <div className="timer-meta-v3">
          <p className="timer-sub-v3">{sessionActive ? `Elapsed: ${formatDigits(elapsedTime)}` : 'SESSION STARTS WHEN GUARD INITIALIZES'}</p>
        </div>
      </div>

      {sessionActive && (
        <div className="session-progress-container" style={{ margin: '1rem 0 1.5rem 0' }}>
          <div className="progress-track" style={{ height: '6px', background: 'var(--border)', borderRadius: '3px' }}>
            <div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%`, height: '100%', background: 'var(--brand-primary)', borderRadius: '3px', transition: 'width 1s linear' }}></div>
          </div>
        </div>
      )}

      <div className="timer-footer-v3">
        {!sessionActive ? (
          <button className="btn-primary-v3 btn-start-v3" style={{ width: '100%', padding: '16px' }} onClick={onToggle}>
            INITIALIZE FOCUS GUARD
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
            <button className="btn-secondary-v3" style={{ flex: 1.2, whiteSpace: 'nowrap', padding: '12px 8px' }} onClick={onBreak}>
              {sessionState === 'break' ? '▶ Resume' : '⏸ Take Break'}
            </button>
            <button className="btn-primary-v3 btn-stop-v3" style={{ flex: 1, whiteSpace: 'nowrap' }} onClick={onToggle}>
              ⏹ End Session
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const CompactStatsRow = ({ distractionCount, currentProb, currentStreak, sessionActive, sessionCount }) => {
  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}m ${s}s`;
  };

  const statItems = [
    { 
      label: 'SESSION DISTRACTIONS', 
      val: sessionActive ? distractionCount : '0', 
      icon: <AlertTriangle size={18} />, 
      color: 'red',
      unit: 'ALERTS'
    },
    { 
      label: 'AI CONFIDENCE', 
      val: `${Math.round(currentProb * 100)}%`, 
      icon: <Activity size={18} />, 
      color: 'blue',
      hasBar: true,
      unit: 'ACCURACY'
    },
    { 
      label: 'CURRENT STREAK', 
      val: sessionActive ? formatTime(currentStreak) : '—', 
      icon: <Zap size={18} />, 
      color: 'orange',
      unit: 'STREAK'
    },
    { 
      label: 'TOTAL SESSIONS', 
      val: `#${sessionCount || 0}`, 
      icon: <Clock size={18} />, 
      color: 'purple',
      unit: 'HISTORY'
    }
  ];

  return (
    <div className="stats-row-v3-grid">
      {statItems.map((item, idx) => (
        <div key={idx} className="compact-stat-card-v2 glass-effect">
          <div className={`mini-icon-box-v2 ${item.color}`}>{item.icon}</div>
          <div className="mini-content-v2">
            <span className="mini-label-v2">{item.label}</span>
            <div className="val-unit-group">
              <h3 className="mini-val-v2">{item.val}</h3>
              <span className="mini-unit-v2">{item.unit}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const RecentSessions = ({ history, onViewAll }) => {
  const getBadgeClass = (count) => {
    if (count <= 10) return 'badge-success';
    if (count <= 25) return 'badge-warning';
    return 'badge-danger';
  };

  const renderPattern = (timeline, totalTime) => {
    const dots = Array.from({ length: 12 });
    return (
      <div className="pattern-dots-container">
        {dots.map((_, i) => {
          const relativePos = (i / 11) * totalTime;
          let isDistracted = false;
          if (timeline && timeline.length > 0) {
            // Find if this time slot overlaps with a distracted period
            isDistracted = timeline.some(seg => 
              seg.state === 'distracted' && 
              relativePos >= seg.time && 
              relativePos <= (seg.time + seg.duration)
            );
          }
          return <div key={i} className={`pattern-dot ${isDistracted ? 'dot-red' : 'dot-green'}`}></div>;
        })}
      </div>
    );
  };

  return (
    <div className="recent-history-v3 glass-effect">
      <div className="section-header-v3">
        <div className="header-title-v3">
          <h3>Recent Sessions</h3>
          <span className="subtitle-v3">Last 3 focus cycles</span>
        </div>
        <button className="btn-secondary-v3 header-btn-right" onClick={onViewAll}>
          View All History <ChevronRight size={14} />
        </button>
      </div>

      <div className="history-table-v3">
        <div className="table-header-v3">
          <span>DATE & TIME</span>
          <span>FOCUS PATTERN</span>
          <span>DURATION</span>
          <span>ALERTS</span>
        </div>
        {history.slice(0, 3).map(s => (
          <div key={s.id} className="table-row-v3">
            <span className="t-date-v3" style={{ color: 'var(--text-primary)' }}>{new Date(s.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            <div className="t-pattern-v3">{renderPattern(s.timeline, s.duration)}</div>
            <span className="t-duration-v3" style={{ color: 'var(--text-muted)' }}>
              {Math.floor(s.duration / 3600) > 0 ? `${Math.floor(s.duration / 3600)}h ` : ''}
              {Math.floor((s.duration % 3600) / 60)}m {s.duration % 60}s
            </span>
            <div className="t-badge-v3">
              <span className={`badge ${getBadgeClass(s.distractions)}`}>
                {s.distractions}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
