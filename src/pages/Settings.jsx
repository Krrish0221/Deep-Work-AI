import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  AlertTriangle,
  RotateCcw,
  Pencil,
  Image as ImageIcon,
  Check,
  ChevronLeft,
  X,
  Mail,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import './Settings.css';

const Settings = () => {
  const { accentColor, setAccentColor, theme, setTheme } = useSettings();
  const fileInputRef = useRef(null);
  
  // Stable refs for OTP
  const otpRef0 = useRef(null);
  const otpRef1 = useRef(null);
  const otpRef2 = useRef(null);
  const otpRef3 = useRef(null);
  const otpRefs = [otpRef0, otpRef1, otpRef2, otpRef3];
  
  // Profile state
  const [fullName, setFullName] = useState("Krish");
  const [email, setEmail] = useState("krish@example.com");
  
  // Avatar states
  const [avatarType, setAvatarType] = useState('initials');
  const [avatarSource, setAvatarSource] = useState(null);
  const [avatarColor, setAvatarColor] = useState('#6366f1');
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [showPresetPicker, setShowPresetPicker] = useState(false);

  const [initialData, setInitialData] = useState({ 
    name: "Krish", 
    email: "krish@example.com",
    avatarType: 'initials',
    avatarColor: '#6366f1'
  });
  
  // Verification & Save states
  const [isVerifying, setIsVerifying] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [verifyState, setVerifyState] = useState('idle'); // 'idle' | 'verifying' | 'success'
  const [finalSaveState, setFinalSaveState] = useState('idle'); // 'idle' | 'success'

  // AI/App state
  const [confidence, setConfidence] = useState(85);
  const [showConfirm, setShowConfirm] = useState(null);
  
  // Notification states
  const [notifSound, setNotifSound] = useState(true);
  const [notifDesktop, setNotifDesktop] = useState(true);
  const [notifSummary, setNotifSummary] = useState(false);

  const isDirty = useMemo(() => {
    return (
      fullName !== initialData.name || 
      email !== initialData.email || 
      avatarType !== initialData.avatarType ||
      (avatarType === 'initials' && avatarColor !== initialData.avatarColor)
    );
  }, [fullName, email, initialData, avatarType, avatarColor]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarSource(reader.result);
        setAvatarType('upload');
        setShowAvatarMenu(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const selectPreset = (color) => {
    setAvatarColor(color);
    setAvatarType('initials');
    setShowPresetPicker(false);
    setShowAvatarMenu(false);
  };

  // OTP Logic
  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 3) {
      otpRefs[index + 1].current.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current.focus();
    }
  };

  const verifyOtp = () => {
    const code = otp.join('');
    setVerifyState('verifying');
    
    setTimeout(() => {
      if (code === '1234') {
        setVerifyState('success');
        setTimeout(() => {
          setIsVerifying(false);
          completeSave();
        }, 1500);
      } else {
        setVerifyState('idle');
        alert("Invalid code. Try 1234 for demo.");
        setOtp(['', '', '', '']);
        otpRefs[0].current.focus();
      }
    }, 1000);
  };

  const handleSaveAttempt = () => {
    if (email !== initialData.email) {
      setIsVerifying(true);
      setOtp(['', '', '', '']);
      setVerifyState('idle');
    } else {
      completeSave();
    }
  };

  const completeSave = () => {
    setFinalSaveState('success');
    setInitialData({ name: fullName, email: email, avatarType, avatarColor });
    setTimeout(() => setFinalSaveState('idle'), 3000);
  };

  // Use Hex codes only for template literal transparency compatibility
  const getConfidenceLabel = (val) => {
    if (val >= 90) return { text: "Strict", color: "#10b981" }; // Emerald
    if (val >= 70) return { text: "Balanced", color: "#6366f1" }; // Indigo
    return { text: "Lenient", color: "#f59e0b" }; // Amber
  };

  const avatarPresets = ['#6366f1', '#3b82f6', '#14b8a6', '#10b981', '#f59e0b', '#f43f5e'];
  const accentPresets = [
    { name: 'Purple', hex: '#6366f1' }, { name: 'Blue', hex: '#3b82f6' },
    { name: 'Teal', hex: '#14b8a6' }, { name: 'Green', hex: '#10b981' },
    { name: 'Amber', hex: '#f59e0b' }, { name: 'Rose', hex: '#f43f5e' }
  ];

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
            <div className="profile-edit-area">
              <div className="avatar-upload-enhanced">
                <div className="avatar-initials-container">
                  <div className="avatar-preview-circle" style={{ background: avatarType === 'initials' ? `linear-gradient(135deg, ${avatarColor}, var(--bg-dark))` : 'none' }}>
                    {avatarType === 'initials' ? (
                      <span className="initials-text">{fullName.charAt(0)}</span>
                    ) : (
                      <img src={avatarSource} alt="Profile" className="avatar-img-actual" />
                    )}
                  </div>
                  {showAvatarMenu && (
                    <div className="avatar-dropdown glass-effect">
                      {showPresetPicker ? (
                        <div className="preset-picker-v2">
                          <div className="dropdown-header">
                            <button className="btn-back" onClick={() => setShowPresetPicker(false)}><ChevronLeft size={14} /></button>
                            <span>Pick a Color</span>
                          </div>
                          <div className="preset-grid">
                            {avatarPresets.map(color => (
                              <button 
                                key={color} 
                                className={`color-option ${avatarColor === color ? 'active' : ''}`} 
                                style={{ background: color }} 
                                onClick={() => selectPreset(color)}
                              />
                            ))}
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="dropdown-title">Change Avatar</div>
                          <button className="dropdown-item" onClick={() => setShowPresetPicker(true)}><Palette size={14} /> <span>Choose Preset</span></button>
                          <button className="dropdown-item" onClick={() => fileInputRef.current.click()}><ImageIcon size={14} /> <span>Upload Image</span></button>
                        </>
                      )}
                    </div>
                  )}
                  <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileUpload} />
                </div>
                <div className="avatar-actions">
                  <button className="btn-avatar-edit-v2" onClick={() => { setShowAvatarMenu(!showAvatarMenu); setShowPresetPicker(false); }}>
                    {showAvatarMenu ? 'Close Menu' : 'Edit Avatar'}
                  </button>
                  <p className="text-xs text-dim">{avatarType === 'initials' ? 'Using letter-based preset' : 'Custom photo uploaded'}</p>
                </div>
              </div>

              <div className="input-grid">
                <div className="input-group">
                  <label>Full Name</label>
                  <div className="input-wrapper">
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your name" />
                    <Pencil size={14} className="input-icon" />
                  </div>
                </div>
                <div className="input-group">
                  <label>Email Address</label>
                  <div className="input-wrapper">
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <Pencil size={14} className="input-icon" />
                  </div>
                  <p className="text-xs text-dim italic mt-1">Changing email requires verification</p>
                </div>
              </div>

              <button 
                className={`btn-save-profile-v2 ${isDirty ? 'active' : 'disabled'} ${finalSaveState === 'success' ? 'save-success' : ''}`}
                onClick={handleSaveAttempt}
                disabled={!isDirty || finalSaveState === 'success'}
              >
                {finalSaveState === 'success' ? <CheckCircle2 size={18} /> : (isDirty ? <CheckCircle2 size={16} /> : <Check size={16} />)}
                {finalSaveState === 'success' ? 'Profile Updated!' : 'Save Changes'}
              </button>
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
            <div className="status-row-enhanced">
              <div className="status-main">
                <span className="status-label">Model Engine Status</span>
                <div className="status-indicator">
                  <div className="dot pulse-success"></div>
                  <span>Teachable Machine v2 — Active</span>
                </div>
                <p className="text-xs text-dim mt-1">Last updated: Apr 6, 2026</p>
              </div>
            </div>
            
            <div className="setting-control">
              <div className="control-header">
                <label>Confidence Threshold</label>
                <div className="control-val-wrapper">
                  <span className="confidence-mode-badge" style={{ background: `${getConfidenceLabel(confidence).color}15`, color: getConfidenceLabel(confidence).color }}>
                    {getConfidenceLabel(confidence).text}
                  </span>
                  <span className="control-val">{confidence}%</span>
                </div>
              </div>
              <input type="range" min="0" max="100" value={confidence} onChange={(e) => setConfidence(e.target.value)} className="slider" />
              <p className="explainer">Detections below this threshold will be ignored by the guard.</p>
            </div>

            <div className="model-reupload">
              <button className="btn-secondary"><Upload size={16} /> Re-upload Model Artifacts</button>
              <p className="explainer mt-1">Use this if you've retrained your model in Roboflow.</p>
            </div>
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
            <div className="setting-control"><label>Interface Theme</label>
              <div className="segmented-control">
                {['Light', 'Dark', 'System'].map(t => (<button key={t} className={theme === t ? 'active' : ''} onClick={() => setTheme(t)}>{t}</button>))}
              </div>
            </div>
            <div className="setting-control"><label>Accent Color</label>
              <div className="color-presets-row-v2">
                {accentPresets.map(color => (
                  <button 
                    key={color.name} 
                    className={`color-swatch-ring ${accentColor === color.hex ? 'active' : ''}`} 
                    onClick={() => setAccentColor(color.hex)} 
                    title={color.name}
                  >
                    <div className="swatch-inner" style={{ background: color.hex }}></div>
                  </button>
                ))}
              </div>
              <p className="explainer">Choosing a color will update buttons, charts, and highlights.</p>
            </div>
          </div>
        </section>

        <div className="divider"></div>

        {/* Section 4: Notifications */}
        <section className="settings-section">
          <div className="section-info">
            <h3><Bell size={18} /> Notifications</h3>
            <p>Control how the Guard alerts you to potential distractions.</p>
          </div>
          <div className="section-content">
            <div className="toggle-group">
              {[
                { label: 'Sound alert on distraction', desc: 'Play a subtle beep when Guard detects a distraction.', state: notifSound, set: setNotifSound },
                { label: 'Desktop notifications', desc: 'Show system-level notifications for high-priority alerts.', state: notifDesktop, set: setNotifDesktop },
                { label: 'End-of-session summary', desc: 'Receive a full focus report immediately after session ends.', state: notifSummary, set: setNotifSummary }
              ].map((notif, idx) => (
                <div className="toggle-control" key={idx}>
                  <div className="toggle-text"><span className="toggle-label">{notif.label}</span><p className="text-xs text-dim">{notif.desc}</p></div>
                  <button className={`toggle-switch ${notif.state ? 'on' : ''}`} onClick={() => notif.set(!notif.state)}></button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="divider"></div>

        {/* Section 5: Data & Privacy */}
        <section className="settings-section">
          <div className="section-info">
            <h3><Lock size={18} /> Data & Privacy</h3>
            <p>Manage your exports and clear sensitive history logs.</p>
          </div>
          <div className="section-content">
            <div className="btn-group">
              <button className="btn-secondary" onClick={() => alert('Preparing JSON Export...')}><Download size={16} /> Export (JSON)</button>
              <button className="btn-secondary" onClick={() => alert('Preparing CSV Export...')}><Download size={16} /> Export (CSV)</button>
            </div>
            <div className="danger-zone">
              <div className="danger-header"><AlertTriangle size={14} className="text-danger" /><span>Danger Zone</span></div>
              <div className="btn-group-destructive">
                <button className="btn-danger-outline" onClick={() => setShowConfirm('clear')}><RotateCcw size={16} /> Reset History</button>
                <button className="btn-danger-solid-imposing" onClick={() => setShowConfirm('delete')}>Delete Account Forever</button>
              </div>
            </div>
          </div>
        </section>

        {/* Verification Modal (OTP) */}
        {isVerifying && (
          <div className="modal-overlay">
            <div className="modal-content glass-effect verification-modal">
              <div className="modal-close" onClick={() => setIsVerifying(false)}><X size={20} /></div>
              <div className={`verification-icon-wrap ${verifyState}`}>
                {verifyState === 'success' ? <ShieldCheck size={48} className="text-success" /> : <Mail size={44} className="text-brand" />}
                {verifyState === 'success' && <div className="success-ring-animation"></div>}
              </div>
              
              <h2>Confirm Email Update</h2>
              <p>We've sent a 4-digit code to <strong>{email}</strong>. Enter it below to secure your changes.</p>
              
              <div className={`otp-input-container ${verifyState === 'success' ? 'shrink' : ''}`}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={otpRefs[idx]}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="otp-field"
                    autoFocus={idx === 0}
                  />
                ))}
              </div>
              
              <div className="modal-actions-v2">
                <button 
                  className={`btn-verify-otp ${verifyState === 'success' ? 'success' : ''}`}
                  onClick={verifyOtp}
                  disabled={otp.join('').length < 4 || verifyState !== 'idle'}
                >
                  {verifyState === 'verifying' ? 'Verifying...' : (verifyState === 'success' ? 'Verified!' : 'Complete Verification')}
                  {verifyState === 'idle' && <ArrowRight size={16} />}
                </button>
                <p className="text-xs text-dim mt-4">Didn't receive code? <span className="text-brand cursor-pointer">Resend Code</span></p>
              </div>
            </div>
          </div>
        )}

        {/* Standard Confirms */}
        {showConfirm && (
          <div className="modal-overlay">
            <div className="modal-content glass-effect">
              <AlertTriangle size={48} className="text-danger" />
              <h2>Are you absolutely sure?</h2><p>This action is irreversible and will permanently remove your data.</p>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowConfirm(null)}>Cancel</button>
                <button className="btn-danger-solid-imposing" onClick={() => handleAction(showConfirm)}>Confirm Destruction</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
