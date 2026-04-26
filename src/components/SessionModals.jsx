import React, { useState, useEffect } from 'react';
import { X, Play, RotateCcw, Target, Zap, Clock, PieChart, Activity, AlertTriangle, Coffee, Save, Plus } from 'lucide-react';

export const SessionStartModal = ({ isOpen, onClose, onStart }) => {
  const [duration, setDuration] = useState(45);
  const [technique, setTechnique] = useState('Deep Work');
  const [taskName, setTaskName] = useState('');

  useEffect(() => {
    if (technique === 'Pomodoro') setDuration(25);
    else if (technique === 'Deep Work') setDuration(45);
  }, [technique]);

  if (!isOpen) return null;

  const presets = [20, 45, 60, 90];

  const handleStart = () => {
    const finalDuration = Number(duration);
    if (isNaN(finalDuration) || finalDuration <= 0) return;
    onStart({ duration: finalDuration, technique, taskName });
  };

  return (
    <div className="modal-overlay" style={{ backdropFilter: 'blur(8px)' }}>
      <div className="focus-modal-content fade-in-scale" style={{ position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={20} />
        </button>

        <div className="modal-title-row">
          <h2>Start Focus Session</h2>
          <p>Configure your workspace before diving in</p>
        </div>

        <div className="duration-section" style={{ marginBottom: '1.5rem' }}>
          {technique === 'Custom' ? (
            <div className="input-group-v4 fade-in">
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Set custom minutes</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="number" 
                  min="1" 
                  max="480"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--border)', padding: '14px', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '1rem' }}
                />
                <span style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>minutes</span>
              </div>
            </div>
          ) : technique !== 'Pomodoro' ? (
            <div className="duration-presets fade-in">
              {presets.map(p => (
                <button 
                  key={p} 
                  className={`preset-pill ${Number(duration) === p ? 'active' : ''}`}
                  onClick={() => setDuration(p)}
                >
                  {p}m
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="technique-grid">
          {[
            { id: 'Pomodoro', name: 'Pomodoro', icon: '🍅' },
            { id: 'Deep Work', name: 'Deep Work', icon: '⚡' },
            { id: 'Custom', name: 'Custom', icon: '🎯' }
          ].map(t => (
            <button 
              key={t.id} 
              className={`technique-btn ${technique === t.id ? 'active' : ''}`}
              onClick={() => setTechnique(t.id)}
            >
              <span className="icon">{t.icon}</span>
              <span>{t.name}</span>
            </button>
          ))}
        </div>

        <div className="input-group-v4" style={{ marginBottom: '2rem' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>What are you working on?</label>
          <input 
            type="text" 
            placeholder="e.g. Design UI components" 
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--border)', padding: '14px', borderRadius: '12px', color: 'var(--text-primary)' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button className="btn-primary-v3" style={{ width: '100%', padding: '16px' }} onClick={handleStart}>
            Start Session <Play size={18} fill="currentColor" />
          </button>
          <button className="btn-ghost" style={{ width: '100%', border: '1px solid rgba(255,255,255,0.15)' }} onClick={() => onStart({ monitorOnly: true })}>
            Skip - Monitor Only
          </button>
        </div>
      </div>
    </div>
  );
};

export const SessionReportModal = ({ isOpen, data, onClose, onRestart }) => {
  if (!isOpen || !data) return null;

  const {
    focusScore = 0,
    focusedTime = 0,
    distractedTime = 0,
    totalDistractions = 0,
    longestStreak = 0,
    taskName = "Untitled Focus",
    technique = "Deep Work",
    timeline = [],
    distractionBreakdown = { phone: 0, looking_away: 0, yawning: 0 }
  } = data;

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  const getScoreLabel = (s) => {
    if (s >= 85) return "Excellent";
    if (s >= 70) return "Good";
    if (s >= 50) return "Fair";
    return "Needs Improvement";
  };

  const getScoreColor = (s) => {
    if (s >= 80) return 'var(--status-good)';
    if (s >= 60) return '#f59e0b';
    return 'var(--status-danger)';
  };

  const [shareStatus, setShareStatus] = React.useState("📤 Share Results");

  const handleShare = () => {
    const summary = `
🔥 DEEP WORK GUARD - SESSION REPORT
🛡️ Status: ${getScoreLabel(focusScore)} (${focusScore}%)
⏱️ Focused: ${formatTime(focusedTime)}
🚨 Alerts: ${totalDistractions}
🎯 Task: ${taskName}
🔥 Peak Streak: ${formatTime(longestStreak)}

Generated by DeepWork Guard 🚀
    `.trim();

    navigator.clipboard.writeText(summary).then(() => {
      setShareStatus("✅ Copied to Clipboard!");
      setTimeout(() => setShareStatus("📤 Share Results"), 3000);
    }).catch(err => {
      console.error("Share failed", err);
    });
  };

  return (
    <div className="modal-overlay" style={{ backdropFilter: 'blur(12px)', zIndex: 10000 }}>
      <div className="focus-modal-content report-modal fade-in-scale" style={{ maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-title-row">
          <h2 style={{ fontSize: '1.75rem', marginBottom: '4px' }}>Session Complete! 🎉</h2>
          <p style={{ fontSize: '0.8rem' }}>{new Date(data.timestamp).toLocaleDateString()} · {technique} Session</p>
          <div style={{ marginTop: '12px' }}>
             <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Working on: </span>
             <span style={{ color: taskName === "General Focus" ? 'var(--text-dim)' : 'var(--text-primary)', fontSize: '0.95rem', fontWeight: '600' }}>
               {taskName}
             </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '40px', margin: '2rem 0', padding: '0 10px' }}>
          <div className="score-hero">
            <div className="circular-progress-v4" style={{ '--progress': focusScore, '--p-color': getScoreColor(focusScore) }}>
              <div className="score-val">
                <span className="num">{focusScore}</span>
                <span className="lbl" style={{ color: getScoreColor(focusScore), fontWeight: '700' }}>{getScoreLabel(focusScore)}</span>
              </div>
            </div>
          </div>
          
          <div className="report-stats-grid" style={{ flex: 1, margin: 0, gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
            <div className="report-stat-card">
              <label><Clock size={12} /> Focused</label>
              <span className="value">{formatTime(focusedTime)}</span>
            </div>
            <div className="report-stat-card">
              <label><Zap size={12} /> Distracted</label>
              <span className="value">{formatTime(distractedTime)}</span>
            </div>
            <div className="report-stat-card">
              <label><AlertTriangle size={12} /> Total Alerts</label>
              <span className="value">{totalDistractions}</span>
            </div>
            <div className="report-stat-card">
              <label><Activity size={12} /> Peak Streak</label>
              <span className="value">{formatTime(longestStreak)}</span>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Focus Rate</label>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: getScoreColor(focusScore) }}>{focusScore}%</span>
          </div>
          <div style={{ height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '5px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: getScoreColor(focusScore), width: `${focusScore}%`, transition: 'width 1s ease-out' }}></div>
          </div>
        </div>

        <div className="session-timeline-container" style={{ marginBottom: '2.5rem' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px', display: 'block' }}>Focus Timeline</label>
          <div className="timeline-bar" style={{ height: '32px', borderRadius: '16px' }}>
            {timeline.map((segment, idx) => {
              const startT = formatTime(segment.time);
              const endT = formatTime(segment.time + segment.duration);
              return (
                <div 
                  key={idx}
                  className={`timeline-segment segment-${segment.state} has-tooltip`}
                  style={{ width: `${(segment.duration / data.duration) * 100}%`, position: 'relative' }}
                >
                  <div className="timeline-tooltip">
                    <div className="tt-state">{segment.state.toUpperCase()}</div>
                    <div className="tt-time">{startT} → {endT}</div>
                    <div className="tt-dur">Duration: {formatTime(segment.duration)}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="timeline-labels">
            <span>0:00</span>
            <span>{formatTime(data.duration)}</span>
          </div>
        </div>

        <div className="forensic-events" style={{ marginBottom: '2.5rem' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '15px', display: 'block' }}>SESSION EVENTS</label>
          <div style={{ background: 'var(--input-bg)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <tbody>
                {timeline.map((event, idx) => {
                  const isDistracted = event.state === 'distracted';
                  const label = event.label || '';
                  const displayLabel = isDistracted ? 
                    (label.includes('Phone') ? '📱 Phone Detected' : 
                     label.includes('Away') ? '👤 Away' : 
                     label.includes('Multiple') ? '👥 Multiple People' : 
                     label.includes('Looking') ? '👀 Looking Away' : '🚨 Distracted') :
                    (event.state === 'focused' ? '✅ Focused' : 
                     event.state === 'break' ? '☕ Break' : '👤 Away');

                  return (
                    <tr key={idx} style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '12px 15px', color: 'var(--text-muted)' }}>{formatTime(event.time)} → {formatTime(event.time + event.duration)}</td>
                      <td style={{ padding: '12px 15px', fontWeight: '600' }}>
                        {displayLabel}
                      </td>
                      <td style={{ padding: '12px 15px', textAlign: 'right', color: 'var(--text-muted)' }}>{formatTime(event.duration)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="distraction-breakdown" style={{ marginBottom: '2.5rem' }}>
           <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '15px', display: 'block' }}>Distraction Breakdown</label>
           {[
             { label: '📱 Phone', key: 'phone' },
             { label: '👀 Looking Away', key: 'looking_away' },
             { label: '👤 Away from Desk', key: 'away_from_desk' },
             { label: '😴 Yawning', key: 'yawning' },
             { label: '👥 Multiple People', key: 'multiple_people' },
             { label: '🧘 Slouching', key: 'slouching' }
           ].map(item => {
             const count = distractionBreakdown[item.key] || 0;
             const total = totalDistractions || 1;
             return (
               <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.8rem', width: '130px' }}>{item.label}</span>
                  <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                     <div style={{ height: '100%', background: 'var(--status-danger)', width: `${(count / total) * 100}%`, transition: 'width 1s ease' }}></div>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', width: '60px', textAlign: 'right' }}>{count}x</span>
               </div>
             );
           })}
        </div>

        <div className="ai-insight-box" style={{ background: 'rgba(124, 58, 237, 0.05)', padding: '1.25rem', borderRadius: '16px', marginBottom: '2.5rem', border: '1px solid rgba(124, 58, 237, 0.15)' }}>
          <p style={{ color: 'var(--brand-primary)', fontSize: '0.9rem', display: 'flex', gap: '12px', lineHeight: '1.5' }}>
            <Zap size={20} fill="currentColor" />
            {focusScore > 85 ? "Elite performance. You maintained a high state of flow throughout the entire duration." : 
             totalDistractions > 5 ? "Your phone usage was the primary flow-breaker. Consider keeping it in another room." : 
             "Solid session. Your focus is improving steadily. Keep up this momentum."}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', paddingBottom: '10px' }}>
          <button className="btn-secondary-v3" style={{ flex: 1.2, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }} onClick={handleShare}>
             {shareStatus}
          </button>
          <button className="btn-secondary-v3" style={{ flex: 1, background: 'rgba(124, 58, 237, 0.1)', color: 'var(--brand-primary)', border: '1px solid rgba(124, 58, 237, 0.2)' }} onClick={onRestart}>
            <RotateCcw size={18} /> Start New
          </button>
          <button className="btn-primary-v3" style={{ flex: 1 }} onClick={onClose}>
            <Save size={18} /> Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export const HistoryArchiveModal = ({ isOpen, history, onClose }) => {
  if (!isOpen) return null;

  const getBadgeClass = (count) => {
    if (count <= 10) return 'badge-success';
    if (count <= 25) return 'badge-warning';
    return 'badge-danger';
  };

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m ${sec}s`;
  };

  return (
    <div className="modal-overlay" style={{ backdropFilter: 'blur(12px)', zIndex: 10000 }}>
      <div className="focus-modal-content archive-modal fade-in-scale" style={{ maxWidth: '800px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '4px' }}>Session Archive 📚</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Complete history of your focus journeys</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', borderRadius: '10px', color: '#fff', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div className="archive-scroll-area" style={{ flex: 1, overflowY: 'auto', paddingRight: '5px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10 }}>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <th style={{ padding: '15px' }}>DATE & TIME</th>
                <th style={{ padding: '15px' }}>TASK</th>
                <th style={{ padding: '15px' }}>DURATION</th>
                <th style={{ padding: '15px' }}>SCORE</th>
                <th style={{ padding: '15px', textAlign: 'right' }}>ALERTS</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No sessions recorded yet. Start your first journey!
                  </td>
                </tr>
              ) : (
                history.map((s, idx) => (
                  <tr key={s.id || idx} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                    <td style={{ padding: '15px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{new Date(s.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(s.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <span style={{ color: s.taskName === "General Focus" ? 'var(--text-dim)' : 'var(--text-primary)' }}>{s.taskName}</span>
                    </td>
                    <td style={{ padding: '15px', color: 'var(--text-muted)' }}>{formatTime(s.duration)}</td>
                    <td style={{ padding: '15px' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '6px', 
                        fontSize: '0.75rem', 
                        fontWeight: '800',
                        background: s.focusScore >= 80 ? 'rgba(16, 185, 129, 0.1)' : s.focusScore >= 60 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: s.focusScore >= 80 ? '#10b981' : s.focusScore >= 60 ? '#f59e0b' : '#ef4444'
                      }}>
                        {s.focusScore}%
                      </span>
                    </td>
                    <td style={{ padding: '15px', textAlign: 'right' }}>
                      <span className={`badge ${getBadgeClass(s.distractions)}`}>{s.distractions}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-primary-v3" style={{ padding: '12px 24px' }} onClick={onClose}>
            Close Archive
          </button>
        </div>
      </div>
    </div>
  );
};
