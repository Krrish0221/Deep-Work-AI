import React, { useState } from 'react';
import { 
  User, 
  Shield, 
  Cpu, 
  Bell, 
  Palette, 
  Lock, 
  Info, 
  Upload, 
  Trash2, 
  Download, 
  ExternalLink,
  Github,
  MessageSquare,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import './Settings.css';

const Settings = () => {
  const { accentColor, setAccentColor, theme, setTheme } = useSettings();
  const [confidence, setConfidence] = useState(85);
  const [showConfirm, setShowConfirm] = useState(null); // 'clear' or 'delete'

  const accentPresets = [
    { name: 'Purple', hex: '#6366f1' },
    { name: 'Blue', hex: '#3b82f6' },
    { name: 'Teal', hex: '#14b8a6' },
    { name: 'Green', hex: '#10b981' },
    { name: 'Amber', hex: '#f59e0b' },
    { name: 'Rose', hex: '#f43f5e' },
  ];

  const handleAction = (type) => {
    setShowConfirm(null);
    alert(`${type === 'clear' ? 'Session history cleared' : 'Account deletion requested'}`);
  };

  return (
    <div className="settings-page fade-in">
      <header className="page-header">
        <div className="header-left">
          <h1>Settings</h1>
          <p>Manage your account, AI preferences, and application appearance.</p>
        </div>
      </header>

      <div className="settings-container glass-effect">
        {/* Section 1: Profile */}
        <section className="settings-section">
          <div className="section-info">
            <h3><User size={18} /> Profile</h3>
            <p>Customize your personal identity and account details.</p>
          </div>
          <div className="section-content">
            <div className="profile-row">
              <div className="avatar-upload">
                <div className="avatar-preview large"><User size={32} /></div>
                <button className="btn-secondary">Change Avatar</button>
              </div>
            </div>
            <div className="input-group">
              <label>Full Name</label>
              <input type="text" defaultValue="Krish" placeholder="Enter your name" />
            </div>
            <div className="input-group">
              <label>Email Address</label>
              <div className="input-with-badge">
                <input type="email" defaultValue="krish@example.com" disabled />
                <span className="badge badge-primary">Premium</span>
              </div>
            </div>
          </div>
        </section>

        <div className="divider"></div>

        {/* Section 2: AI Model */}
        <section className="settings-section">
          <div className="section-info">
            <h3><Cpu size={18} /> AI Core</h3>
            <p>Configure the neural engine and detection sensitivity parameters.</p>
          </div>
          <div className="section-content">
            <div className="status-row">
              <span className="status-label">Model Status</span>
              <div className="status-indicator">
                <div className="dot pulse-success"></div>
                <span>Teachable Machine v2 — Active</span>
              </div>
            </div>
            
            <div className="setting-control">
              <div className="control-header">
                <label>Confidence Threshold</label>
                <span className="control-val">{confidence}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={confidence} 
                onChange={(e) => setConfidence(e.target.value)}
                className="slider"
              />
              <p className="explainer">Detections below this threshold will be ignored by the guard.</p>
            </div>

            <button className="btn-secondary"><Upload size={16} /> Re-upload Model Artifacts</button>
          </div>
        </section>

        <div className="divider"></div>

        {/* Section 3: Appearance */}
        <section className="settings-section">
          <div className="section-info">
            <h3><Palette size={18} /> Appearance</h3>
            <p>Tailor the visual experience to your preferences.</p>
          </div>
          <div className="section-content">
            <div className="setting-control">
              <label>Interface Theme</label>
              <div className="segmented-control">
                {['Light', 'Dark', 'System'].map(t => (
                  <button key={t} className={theme === t ? 'active' : ''} onClick={() => setTheme(t)}>{t}</button>
                ))}
              </div>
            </div>

            <div className="setting-control">
              <label>Accent Color</label>
              <div className="color-presets">
                {accentPresets.map(color => (
                  <button 
                    key={color.name} 
                    className={`color-swatch ${accentColor === color.hex ? 'active' : ''}`}
                    style={{ background: color.hex }}
                    onClick={() => setAccentColor(color.hex)}
                    title={color.name}
                  >
                    {accentColor === color.hex && <CheckCircle2 size={14} color="#fff" />}
                  </button>
                ))}
              </div>
              <p className="explainer">Choosing a color will update buttons, charts, and highlights.</p>
            </div>
          </div>
        </section>

        <div className="divider"></div>

        {/* Section 4: Data & Privacy */}
        <section className="settings-section">
          <div className="section-info">
            <h3><Lock size={18} /> Data & Privacy</h3>
            <p>Manage your exports and clear sensitive history logs.</p>
          </div>
          <div className="section-content">
            <div className="btn-group">
              <button className="btn-secondary" onClick={() => alert('Preparing JSON Export...')}><Download size={16} /> Export All (JSON)</button>
              <button className="btn-secondary" onClick={() => alert('Preparing CSV Export...')}><Download size={16} /> Export CSV</button>
            </div>
            
            <div className="btn-group-destructive">
              <button className="btn-danger-ghost" onClick={() => setShowConfirm('clear')}>
                <Trash2 size={16} /> Clear Session History
              </button>
              <button className="btn-danger-solid" onClick={() => setShowConfirm('delete')}>
                Delete Account Forever
              </button>
            </div>
          </div>
        </section>

        {/* Confirmation Modal */}
        {showConfirm && (
          <div className="modal-overlay">
            <div className="modal-content glass-effect">
              <AlertTriangle size={48} className="text-danger" />
              <h2>Are you absolutely sure?</h2>
              <p>This action is irreversible and will permanently remove your focus data.</p>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowConfirm(null)}>Cancel</button>
                <button className="btn-danger-solid" onClick={() => handleAction(showConfirm)}>Confirm Destruction</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
