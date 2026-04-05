import React from 'react';
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Clock, 
  AlertTriangle, 
  Activity, 
  Target, 
  TrendingUp, 
  TrendingDown,
  Minus
} from 'lucide-react';
import './StatsDashboard.css';

const StatsDashboard = ({ sessionData, distractionCount, focusTime, currentProb, sessionActive, history }) => {
  const formatTime = (totalSeconds) => {
    if (!sessionActive && totalSeconds === 0) return "00:00:00";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds]
      .map(v => v.toString().padStart(2, '0'))
      .join(':');
  };

  const lastSession = history.length > 0 ? history[0] : null;

  const getTrend = (current, last) => {
    if (!last) return null;
    if (current === last) return { icon: <Minus size={12} />, color: 'var(--text-dim)', label: 'Stable' };
    const diff = current - last;
    const isGood = current > last; // Logic varies per metric
    return {
      icon: isGood ? <TrendingUp size={12} /> : <TrendingDown size={12} />,
      color: isGood ? 'var(--status-good)' : 'var(--status-danger)',
      label: `${Math.abs(diff)} vs last`
    };
  };

  const distractionTrend = getTrend(distractionCount, lastSession?.distractions);

  return (
    <div className="stats-container">
      <div className="stats-grid">
        {/* Focus Timer Card */}
        <div className={`stat-card glass-effect focus-card ${sessionActive ? 'active-stat' : ''}`}>
          <div className="stat-header">
            <div className="stat-icon-wrapper focus">
              <Clock size={20} strokeWidth={2.5} />
            </div>
            {!sessionActive && focusTime === 0 && <span className="stat-status">READY</span>}
            {sessionActive && <span className="stat-status live">LIVE</span>}
          </div>
          <div className="stat-info">
            <span className="stat-label">Focus Deep Work</span>
            <h2 className="stat-value timer-font">{formatTime(focusTime)}</h2>
          </div>
          <div className="stat-footer">
            <span className="text-xs">{sessionActive ? 'Tracking Session...' : 'Select "Initialize Guard" to start'}</span>
          </div>
        </div>

        {/* Distractions Card */}
        <div className="stat-card glass-effect distraction-card">
          <div className="stat-header">
            <div className="stat-icon-wrapper distraction">
              <AlertTriangle size={20} />
            </div>
            {distractionTrend && (
              <div className="trend-badge" style={{ color: distractionTrend.color }}>
                {distractionTrend.icon} <span>{distractionTrend.label}</span>
              </div>
            )}
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Distractions</span>
            <h2 className="stat-value">{distractionCount}</h2>
          </div>
          <div className="stat-footer">
            <span className="text-xs">Context: {distractionCount > 5 ? 'High Distraction Level' : 'Maintaining Focus'}</span>
          </div>
        </div>

        {/* Confidence Card */}
        <div className="stat-card glass-effect confidence-card">
          <div className="stat-header">
            <div className="stat-icon-wrapper confidence">
              <Activity size={20} />
            </div>
          </div>
          <div className="stat-info">
            <span className="stat-label">AI Confidence</span>
            <h2 className="stat-value">{(currentProb * 100).toFixed(1)}%</h2>
          </div>
          <div className="stat-footer">
            <div className="confidence-track">
              <div className="confidence-fill" style={{ width: `${currentProb * 100}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Card */}
      <div className="chart-card glass-effect">
        <div className="chart-header">
          <div className="chart-title">
            <Target size={18} className="icon-purple" />
            <h3>Focus Timeline</h3>
          </div>
          <span className="badge badge-primary">Direct Inference</span>
        </div>
        <div className="chart-container">
          {sessionActive && sessionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={sessionData}>
                <defs>
                  <linearGradient id="probGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="time" hide />
                <YAxis domain={[0, 100]} hide />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-glass)', 
                    border: '1px solid var(--border-glass)',
                    borderRadius: '12px',
                    boxShadow: 'var(--shadow-glow)',
                    color: '#fff'
                  }}
                  itemStyle={{ color: 'var(--brand-primary)' }}
                  labelStyle={{ display: 'none' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="prob" 
                  stroke="var(--brand-primary)" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#probGradient)" 
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">
              <Activity size={32} strokeWidth={1} />
              <p>Awaiting session start to begin telemetry tracking...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsDashboard;
