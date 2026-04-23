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

export const FocusTimerHero = ({ focusTime, sessionActive, status, onToggle, loading, startTime }) => {
  const lowerStatus = (status || "").toLowerCase();
  const isDistracted = lowerStatus.includes('phone') || 
                       lowerStatus.includes('looking away') || 
                       lowerStatus.includes('away from desk') || 
                       lowerStatus.includes('multiple');

  const stateLabel = sessionActive ? (isDistracted ? 'DISTRACTED' : 'FOCUSED') : 'STANDBY';
  const stateColor = sessionActive ? (isDistracted ? 'var(--status-danger)' : 'var(--status-good)') : 'var(--text-dim)';

  return (
    <div className="timer-hero-container-v2 glass-effect">
      <div className="card-top-label">
        <Target size={14} />
        <span>FOCUS TIMER</span>
      </div>

      <div className="timer-header-v3">
        <span className="state-badge-v3" style={{ background: stateColor }}>{stateLabel}</span>
      </div>
      
      <div className="timer-display-v3">
        <h2 className="timer-digits-v3">{formatDigits(focusTime)}</h2>
        {focusTime === 0 ? (
          <p className="timer-guide-v3">SESSION STARTS WHEN GUARD INITIALIZES</p>
        ) : (
          <div className="timer-meta-v3">
            <p className="timer-sub-v3">ACTIVE FOCUS DURATION</p>
            {startTime && <p className="start-timestamp-v3">Session started at {startTime}</p>}
          </div>
        )}
      </div>

      <div className="timer-footer-v3">
        <button 
          className={`btn-primary-v3 ${sessionActive ? 'btn-stop-v3' : 'btn-start-v3'}`}
          onClick={onToggle}
          disabled={loading}
        >
          {loading ? (
            <>
              <Clock className="spin" size={18} />
              <span>INITIALIZING...</span>
            </>
          ) : (
            sessionActive ? 'TERMINATE GUARD' : 'INITIALIZE FOCUS GUARD'
          )}
        </button>
      </div>
    </div>
  );
};

export const CompactStatsRow = ({ distractionCount, currentProb, currentStreak, sessionActive, sessionCount }) => {
  const formatStreakValue = (seconds) => {
    if (!sessionActive || seconds === 0) return <span className="muted-val">—</span>;
    return formatTime(seconds);
  };

  const statItems = [
    { 
      label: 'TOTAL DISTRACTIONS', 
      val: distractionCount.toLocaleString(), 
      icon: <AlertTriangle size={18} />, 
      color: 'red',
      valClass: distractionCount > 10 ? 'text-danger' : '',
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
      val: formatStreakValue(currentStreak), 
      icon: <Zap size={18} />, 
      color: 'orange',
      unit: 'FOCUS TIME'
    },
    { 
      label: 'LOGGED HISTORY', 
      val: `#${sessionCount || 0}`, 
      icon: <Clock size={18} />, 
      color: 'purple',
      unit: 'SESSIONS'
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
              <h3 className={`mini-val-v2 ${item.valClass || ''}`}>{item.val}</h3>
              <span className="mini-unit-v2">{item.unit}</span>
            </div>
            {item.hasBar && (
              <div className="mini-track-v2">
                <div className="mini-fill-v2" style={{ width: `${currentProb * 100}%` }}></div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export const RecentSessions = ({ history }) => {
  const getBadgeClass = (count) => {
    if (count <= 10) return 'badge-success';
    if (count <= 25) return 'badge-warning';
    return 'badge-danger';
  };

  const renderPattern = (log, totalTime, distractions) => {
    const dots = Array.from({ length: 12 });
    return (
      <div className="pattern-dots-container">
        {dots.map((_, i) => {
          const relativePos = (i / 11) * totalTime;
          let isDistracted = false;
          if (log && log.length > 0) {
            isDistracted = log.some(t => Math.abs(t - relativePos) < (totalTime / 15));
          } else if (distractions > 0) {
            isDistracted = (i * 7) % 11 < (distractions / 5);
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
        <button className="btn-secondary-v3 header-btn-right">
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
            <span className="t-date-v3">{new Date(s.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            <div className="t-pattern-v3">{renderPattern(s.distractionLog, s.duration, s.distractions)}</div>
            <span className="t-duration-v3">
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
