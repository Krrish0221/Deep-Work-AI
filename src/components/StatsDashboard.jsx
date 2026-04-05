import React from 'react';
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock, AlertTriangle, Activity, Target } from 'lucide-react';
import './StatsDashboard.css';

const StatsDashboard = ({ sessionData, distractionCount, focusTime, currentProb }) => {
  const formatTime = (secs) => `${Math.floor(secs / 60).toString().padStart(2, '0')}:${(secs % 60).toString().padStart(2, '0')}`;
  return (
    <div className="stats-container">
      <div className="stats-grid">
        <div className="stat-card glass-effect"><div className="stat-icon-bg focus"><Clock size={20} /></div><div className="stat-info"><span className="stat-label">Focus</span><span className="stat-value">{formatTime(focusTime)}</span></div></div>
        <div className="stat-card glass-effect"><div className="stat-icon-bg distraction"><AlertTriangle size={20} /></div><div className="stat-info"><span className="stat-label">Distractions</span><span className="stat-value">{distractionCount}</span></div></div>
        <div className="stat-card glass-effect"><div className="stat-icon-bg probability"><Activity size={20} /></div><div className="stat-info"><span className="stat-label">AI Conf</span><span className="stat-value">{(currentProb * 100).toFixed(1)}%</span></div></div>
      </div>
      <div className="chart-card glass-effect">
        <div className="chart-header"><h3><Target size={18} /> Timeline</h3><span className="chart-subtitle">Direct Analysis</span></div>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={sessionData}>
              <defs><linearGradient id="colorProb" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3}/><stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="time" hide /><YAxis domain={[0, 100]} hide />
              <Tooltip contentStyle={{ backgroundColor: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff' }} />
              <Area type="monotone" dataKey="prob" stroke="var(--accent-primary)" fillOpacity={1} fill="url(#colorProb)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
export default StatsDashboard;
