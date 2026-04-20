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
  Legend,
  ReferenceLine,
  LineChart,
  Line
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
        { day: 'Apr 01', hours: 4.2 }, { day: 'Apr 08', hours: 5.8 }, { day: 'Apr 15', hours: 3.9 }, { day: 'Apr 22', hours: 6.2 },
      ];
    default: // Week
      return [
        { day: 'Apr 14', hours: 4.5 }, { day: 'Apr 15', hours: 5.2 }, { day: 'Apr 16', hours: 6.1 },
        { day: 'Apr 17', hours: 4.8 }, { day: 'Apr 18', hours: 7.2 }, { day: 'Apr 19', hours: 3.5 },
        { day: 'Apr 20', hours: 2.1 },
      ];
  }
};

const getSummary = (range) => {
  switch(range) {
    case 'Today':
      return [
        { label: "Total Focus Time", value: "6h 15m", trend: "+24%", color: "var(--brand-primary)" },
        { label: "Avg Session Length", value: "48m", trend: "-2%", color: "var(--brand-secondary)" },
        { label: "Best Focus Streak", value: "1h 45m", color: "var(--status-info)" },
        { label: "Distraction-Free Sessions", value: "4 of 6", ratio: 0.66, color: "#f59e0b" }
      ];
    case 'Month':
      return [
        { label: "Total Focus Time", value: "102h 45m", trend: "+18%", color: "var(--brand-primary)" },
        { label: "Avg Session Length", value: "1h 05m", trend: "+8%", color: "var(--brand-secondary)" },
        { label: "Best Focus Streak", value: "4h 20m", color: "var(--status-info)" },
        { label: "Distraction-Free Sessions", value: "32 of 42", ratio: 0.76, color: "var(--status-good)" }
      ];
    default: // Week
      return [
        { label: "Total Focus Time", value: "14h 32m", trend: "+12%", color: "var(--brand-primary)" },
        { label: "Avg Session Length", value: "1h 12m", trend: "+5%", color: "var(--brand-secondary)" },
        { label: "Best Focus Streak", value: "2h 45m", color: "var(--status-info)" },
        { label: "Distraction-Free Sessions", value: "3 of 12", ratio: 0.25, color: "#f59e0b" }
      ];
  }
};

const DISTRACTION_BREAKDOWN = [
  { name: 'Phone', value: 45, color: 'var(--status-danger)' },
  { name: 'Smartwatch', value: 25, color: '#f59e0b' },
  { name: 'Earbuds', value: 15, color: 'var(--brand-secondary)' },
  { name: 'Unclassified', value: 15, color: '#94a3b8' },
];

const getTrendData = (range) => {
  return [
    { day: 'Mon', phone: 12, earbuds: 4, watch: 2 },
    { day: 'Tue', phone: 8, earbuds: 6, watch: 5 },
    { day: 'Wed', phone: 15, earbuds: 2, watch: 1 },
    { day: 'Thu', phone: 10, earbuds: 8, watch: 4 },
    { day: 'Fri', phone: 4, earbuds: 12, watch: 3 },
    { day: 'Sat', phone: 20, earbuds: 5, watch: 2 },
    { day: 'Sun', phone: 12, earbuds: 3, watch: 1 },
  ];
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-chart-tooltip glass-effect">
        <p className="tooltip-label">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="tooltip-item">
            <div className="tooltip-dot" style={{ background: entry.color || entry.fill }}></div>
            <span className="tooltip-name">{entry.name}:</span>
            <span className="tooltip-val">{entry.value}{entry.unit || (entry.dataKey === 'hours' ? 'h' : '')}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const Heatmap = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 18 }, (_, i) => i + 6); // 6 AM to Midnight

  return (
    <div className="heatmap-card glass-effect heatmap-full-width">
      <div className="section-header">
        <div className="header-text">
          <h3>Hourly Focus Intensity</h3>
          <p className="text-xs">Visualizing peak productivity windows across the week</p>
        </div>
      </div>
      <div className="heatmap-layout-wrapper">
        <div className="hours-axis-labels">
          {hours.filter(h => h % 3 === 0).map(h => <span key={h}>{h > 12 ? h-12 + 'pm' : h + 'am'}</span>)}
        </div>
        <div className="heatmap-grid-cells">
          {days.map(day => (
            <div key={day} className="heatmap-day-column">
              <span className="heatmap-day-header">{day}</span>
              {hours.map(hour => {
                const intensity = Math.floor(Math.random() * 5); // 0 to 4
                return (
                  <div 
                    key={hour} 
                    className={`heatmap-cell-v4 intensity-${intensity}`}
                    title={`${day} ${hour}:00 — ${intensity * 15} min focused`}
                  ></div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="heatmap-footer-v4">
        <span>Less Intensity</span>
        {[0, 1, 2, 3, 4].map(i => <div key={i} className={`legend-cell intensity-${i}`}></div>)}
        <span>More Intensity</span>
      </div>
    </div>
  );
};

const Analytics = () => {
  const [activeRange, setActiveRange] = useState('Week');
  
  const focusData = useMemo(() => getFocusData(activeRange), [activeRange]);
  const summaryStats = useMemo(() => getSummary(activeRange), [activeRange]);
  const trendData = useMemo(() => getTrendData(activeRange), [activeRange]);

  return (
    <div className="analytics-page fade-in">
      <header className="page-header">
        <div className="header-left">
          <h1>Analytics</h1>
          <p>Track your deep work patterns and distraction trends.</p>
        </div>
        <div className="header-right">
          <div className="segmented-control glass-effect">
            {['Today', 'Week', 'Month'].map(r => (
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

      <div className="analytics-layout-grid-wrap">
        <div className="analytics-top-section">
          <div className="analytics-main-stack">
            {/* Row 1: Summary Cards */}
            <div className="summary-grid">
              {summaryStats.map(stat => (
                <div key={stat.label} className="summary-card glass-effect">
                  <span className="stat-label">{stat.label}</span>
                  <div className="stat-value-row">
                    <h2 style={{ color: stat.color }}>{stat.value}</h2>
                    {stat.trend && <span className="trend-up"><ArrowUpRight size={14} /> {stat.trend}</span>}
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
                  <span className="view-details-btn">VIEW FULL LOG</span>
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
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: 'var(--text-dim)', fontSize: 11}} dy={10} />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: 'var(--text-dim)', fontSize: 11}} 
                        ticks={[0, 2, 4, 6]}
                        tickFormatter={(v) => v + 'h'}
                        width={30}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <ReferenceLine y={2} stroke="var(--status-danger)" strokeDasharray="5 5" label={{ value: 'Daily Goal', position: 'right', fill: 'var(--status-danger)', fontSize: 10 }} />
                      <Area type="monotone" dataKey="hours" name="Focused Time" stroke="var(--brand-primary)" strokeWidth={3} fillOpacity={1} fill="url(#focusGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="chart-small glass-effect">
                <h3>Distraction Frequency</h3>
                <div className="donut-wrap">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie 
                        data={DISTRACTION_BREAKDOWN} 
                        innerRadius={60} 
                        outerRadius={80} 
                        paddingAngle={5} 
                        dataKey="value"
                        stroke="none"
                      >
                        {DISTRACTION_BREAKDOWN.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="donut-center">
                    <span className="total-count">248</span>
                    <span className="text-xs">Total Alerts</span>
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
          </div>

          <div className="analytics-sidebar">
            <div className="sidebar-card glass-effect ai-insights">
              <div className="sidebar-header">
                <Sparkles size={18} style={{color: 'var(--brand-primary)'}} />
                <h3>AI Insights</h3>
              </div>
              <ul className="insights-list">
                {[
                  { text: <>Your peak focus window is <strong className="insight-link">9am – 11am</strong>.</>, type: 'info' },
                  { text: <>Phone distractions increased <strong className="insight-link">22%</strong> this week.</>, type: 'danger' },
                  { text: <>Wednesday had your longest uninterrupted session (2h 45m).</>, type: 'success' },
                ].map((insight, idx) => (
                  <li key={idx} className="clickable-insight">
                    <div className={`custom-accent-dot ${insight.type}`}></div>
                    <p>{insight.text}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="sidebar-card glass-effect score-gauge">
              <h3>Productivity Score</h3>
              <div className="gauge-wrap">
                <svg viewBox="0 0 100 100" className="circular-progress">
                  <circle className="bg" cx="50" cy="50" r="45"></circle>
                  <circle className="fg" cx="50" cy="50" r="45" style={{ 
                    strokeDasharray: '283', 
                    strokeDashoffset: (283 - (283 * 84) / 100)
                  }}></circle>
                </svg>
                <div className="gauge-text">
                  <span className="score">84</span>
                  <span className="text-xs">Weekly Avg</span>
                </div>
              </div>
              <div className="gauge-footer">
                <div className="vs-period">
                  <ArrowUpRight size={16} />
                  <span>+5 pts vs last week</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="analytics-full-width-stack">
          <Heatmap />

          <div className="distraction-trend-card glass-effect">
            <div className="section-header">
              <div className="header-text">
                <h3>Distraction Frequency Trends</h3>
                <p className="text-xs">Daily category volume over current {activeRange.toLowerCase()}</p>
              </div>
            </div>
            <div className="trend-chart-wrap">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: 'var(--text-dim)', fontSize: 11}} dy={10} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: 'var(--text-dim)', fontSize: 11}} 
                    ticks={[0, 10, 20, 30]}
                    width={30}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
                  <Line type="monotone" dataKey="phone" name="Phone" stroke="var(--status-danger)" strokeWidth={3} dot={{ r: 4, fill: 'var(--status-danger)' }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="earbuds" name="Earbuds" stroke="var(--brand-secondary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--brand-secondary)' }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="watch" name="Smartwatch" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
