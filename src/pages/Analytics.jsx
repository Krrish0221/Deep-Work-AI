import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell,
  Legend 
} from 'recharts';
import { 
  Download, 
  Zap, 
  Target, 
  Clock, 
  Flame, 
  Shield, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import './Analytics.css';

// --- DATA GENERATORS ---

const getFocusData = (range) => {
  switch(range) {
    case 'Today':
      return [
        { day: '09:00', hours: 0.8 }, { day: '11:00', hours: 1.2 }, { day: '13:00', hours: 0.5 },
        { day: '15:00', hours: 2.1 }, { day: '17:00', hours: 1.4 }, { day: '19:00', hours: 0.2 },
      ];
    case 'Month':
      return [
        { day: 'W1', hours: 22 }, { day: 'W2', hours: 28 }, { day: 'W3', hours: 19 }, { day: 'W4', hours: 32 },
      ];
    default: // Week
      return [
        { day: 'Mon', hours: 4.5 }, { day: 'Tue', hours: 5.2 }, { day: 'Wed', hours: 6.1 },
        { day: 'Thu', hours: 4.8 }, { day: 'Fri', hours: 7.2 }, { day: 'Sat', hours: 3.5 },
        { day: 'Sun', hours: 2.1 },
      ];
  }
};

const getSummary = (range) => {
  switch(range) {
    case 'Today':
      return [
        { label: "Total Focus Time", value: "6h 15m", trend: "+24%", color: "var(--brand-primary)" },
        { label: "Avg Session Length", value: "48m", trend: "-2%", color: "var(--brand-secondary)" },
        { label: "Best Focus Streak", value: "1h 45m", icon: <Flame size={16} />, color: "#f59e0b" },
        { label: "Distraction-Free Sessions", value: "4 of 6", ratio: 0.66, color: "var(--status-good)" }
      ];
    case 'Month':
      return [
        { label: "Total Focus Time", value: "102h 45m", trend: "+18%", color: "var(--brand-primary)" },
        { label: "Avg Session Length", value: "1h 05m", trend: "+8%", color: "var(--brand-secondary)" },
        { label: "Best Focus Streak", value: "4h 20m", icon: <Flame size={16} />, color: "#f59e0b" },
        { label: "Distraction-Free Sessions", value: "28 of 42", ratio: 0.66, color: "var(--status-good)" }
      ];
    default: // Week
      return [
        { label: "Total Focus Time", value: "14h 32m", trend: "+12%", color: "var(--brand-primary)" },
        { label: "Avg Session Length", value: "1h 12m", trend: "+5%", color: "var(--brand-secondary)" },
        { label: "Best Focus Streak", value: "2h 45m", icon: <Flame size={16} />, color: "#f59e0b" },
        { label: "Distraction-Free Sessions", value: "3 of 12", ratio: 0.25, color: "var(--status-good)" }
      ];
  }
};

const DISTRACTION_BREAKDOWN = [
  { name: 'Phone', value: 45, color: '#ef4444' },
  { name: 'Smartwatch', value: 25, color: '#f59e0b' },
  { name: 'Earbuds', value: 15, color: 'var(--brand-secondary)' },
  { name: 'Unknown', value: 15, color: '#94a3b8' },
];

const Heatmap = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 18 }, (_, i) => i + 6); // 6 AM to Midnight

  return (
    <div className="heatmap-card glass-effect">
      <div className="section-header">
        <div className="header-text">
          <h3>Hourly Focus Intensity</h3>
          <p className="text-xs">Peak productivity windows across the week</p>
        </div>
      </div>
      <div className="heatmap-container">
        <div className="heatmap-grid">
          <div className="hours-axis">
            {hours.filter(h => h % 3 === 0).map(h => <span key={h}>{h > 12 ? h-12 + 'pm' : h + 'am'}</span>)}
          </div>
          <div className="grid-cells">
            {days.map(day => (
              <div key={day} className="day-column">
                <span className="day-label">{day}</span>
                {hours.map(hour => {
                  const intensity = Math.floor(Math.random() * 5); // 0 to 4
                  return (
                    <div 
                      key={hour} 
                      className={`heat-cell intensity-${intensity}`}
                      title={`${day} ${hour}:00 — ${intensity * 15} min focused`}
                    ></div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="heatmap-legend">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map(i => <div key={i} className={`legend-cell intensity-${i}`}></div>)}
          <span>More</span>
        </div>
      </div>
    </div>
  );
};

const Analytics = () => {
  const [activeRange, setActiveRange] = useState('Week');
  
  const focusData = useMemo(() => getFocusData(activeRange), [activeRange]);
  const summaryStats = useMemo(() => getSummary(activeRange), [activeRange]);

  return (
    <div className="analytics-page fade-in">
      {/* Top Header */}
      <header className="page-header">
        <div className="header-left">
          <h1>Analytics</h1>
          <p>Track your deep work patterns and distraction trends.</p>
        </div>
        <div className="header-right">
          <div className="segmented-control glass-effect">
            {['Today', 'Week', 'Month', 'Custom'].map(r => (
              <button 
                key={r} 
                className={activeRange === r ? 'active' : ''} 
                onClick={() => setActiveRange(r)}
              >
                {r}
              </button>
            ))}
          </div>
          <button className="btn-ghost"><Download size={16} /> Export CSV</button>
        </div>
      </header>

      <div className="analytics-layout">
        <div className="analytics-main">
          {/* Row 1: Summary Cards */}
          <div className="summary-grid">
            {summaryStats.map(stat => (
              <div key={stat.label} className="summary-card glass-effect">
                <span className="stat-label">{stat.label}</span>
                <div className="stat-value-row">
                  <h2 style={{ color: stat.color }}>{stat.value}</h2>
                  {stat.trend && <span className="trend-up"><ArrowUpRight size={14} /> {stat.trend}</span>}
                  {stat.icon && <span className="stat-icon" style={{ color: stat.color }}>{stat.icon}</span>}
                </div>
                {stat.ratio !== undefined && (
                  <div className="stat-progress-bg">
                    <div className="stat-progress-fill" style={{ width: `${stat.ratio * 100}%`, background: stat.color }}></div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="charts-grid-two">
            <div className="chart-large glass-effect">
              <div className="chart-header">
                <h3>Focus Over Time</h3>
                <span className="avg-line-label">Telemetric View</span>
              </div>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={focusData}>
                    <defs>
                      <linearGradient id="focusGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: 'var(--text-dim)', fontSize: 11}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-dim)', fontSize: 11}} hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="hours" stroke="var(--brand-primary)" strokeWidth={3} fillOpacity={1} fill="url(#focusGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-small glass-effect">
              <h3>Distraction Breakdown</h3>
              <div className="donut-wrap">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={DISTRACTION_BREAKDOWN} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {DISTRACTION_BREAKDOWN.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="donut-center">
                  <span className="total-count">248</span>
                  <span className="text-xs">Total</span>
                </div>
              </div>
              <div className="donut-legend">
                {DISTRACTION_BREAKDOWN.map(item => (
                  <div key={item.name} className="legend-item">
                    <div className="legend-dot" style={{ background: item.color }}></div>
                    <span className="legend-name">{item.name}</span>
                    <span className="legend-val">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Heatmap />
        </div>

        <div className="analytics-sidebar">
          <div className="sidebar-card glass-effect ai-insights">
            <div className="sidebar-header">
              <Sparkles size={18} style={{color: 'var(--brand-primary)'}} />
              <h3>AI Insights</h3>
            </div>
            <ul className="insights-list">
              <li>
                <div className="insight-bullet"></div>
                <p>Your peak focus window is <strong>9am – 11am</strong>.</p>
              </li>
              <li>
                <div className="insight-bullet bullet-danger"></div>
                <p>Phone distractions increased <strong>22%</strong> this week.</p>
              </li>
              <li>
                <div className="insight-bullet bullet-success"></div>
                <p>Wednesday had your longest uninterrupted session (2h 45m).</p>
              </li>
            </ul>
          </div>

          <div className="sidebar-card glass-effect score-gauge">
            <h3>Productivity Score</h3>
            <div className="gauge-wrap">
              <svg viewBox="0 0 100 100" className="circular-progress">
                <circle className="bg" cx="50" cy="50" r="45"></circle>
                <circle className="fg" cx="50" cy="50" r="45" style={{ 
                  strokeDasharray: '283', 
                  strokeDashoffset: (283 - (283 * 84) / 100),
                  stroke: 'var(--brand-primary)' 
                }}></circle>
              </svg>
              <div className="gauge-text">
                <span className="score">84</span>
                <span className="text-xs">Weekly Avg</span>
              </div>
            </div>
            <div className="gauge-footer">
              <div className="vs-period">
                <ArrowUpRight size={16} className="text-good" />
                <span>+5 pts vs last week</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
