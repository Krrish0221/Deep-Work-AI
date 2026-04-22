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
  const { 
    accentColor, setAccentColor, 
    theme, setTheme,
    avatarColor, setAvatarColor,
    avatarType, setAvatarType,
    avatarSource, setAvatarSource,
    userName, setUserName
  } = useSettings();
  
  const fileInputRef = useRef(null);
  
  // Local Profile state (for dirty checking/saving)
  const [fullName, setFullName] = useState(userName);
  const [email, setEmail] = useState("krish@example.com");

  const [initialData, setInitialData] = useState({ 
    name: userName, 
    email: "krish@example.com",
    avatarType: avatarType,
    avatarColor: avatarColor
  });
  
  // Verification & Save states
  const [isVerifying, setIsVerifying] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [verifyState, setVerifyState] = useState('idle'); // 'idle' | 'verifying' | 'success'
  const [finalSaveState, setFinalSaveState] = useState('idle'); // 'idle' | 'success'
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);

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

  // Countdown timer logic
  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  const verifyOtp = () => {
    const code = otp.join('');
    setVerifyState('verifying');
    
    setTimeout(() => {
      if (code === '1234') {
        setVerifyState('success');
        // Wait 1.5s for success animation then close
        setTimeout(() => {
          setIsVerifying(false);
          setVerifyState('idle');
          completeSave();
        }, 1500);
      } else {
        setVerifyState('idle');
        alert("Invalid code. Try 1234 for demo.");
        setOtp(['', '', '', '']);
        otpRefs[0].current.focus();
      }
    }, 1200);
  };

  const handleResend = () => {
    if (resendTimer === 0) {
      setResendTimer(60);
      setOtp(['', '', '', '']);
      otpRefs[0].current.focus();
      // Logic to resend code would go here
    }
  };

  const handleSaveAttempt = () => {
    if (email !== initialData.email) {
      setIsVerifying(true);
      setOtp(['', '', '', '']);
      setVerifyState('idle');
      setResendTimer(60); // Start countdown when modal opens
    } else {
      completeSave();
    }
  };

  const completeSave = () => {
    setFinalSaveState('success');
    setUserName(fullName); // Update global username
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
                  <div 
                    className="avatar-preview-circle" 
                    style={{ 
                      background: avatarType === 'initials' ? `linear-gradient(135deg, ${avatarColor}, #1e2035)` : 'none',
                      boxShadow: `0 4px 12px ${avatarColor}40`
                    }}
                  >
                    {avatarType === 'initials' ? (
                      <span className="initials-text">{fullName.charAt(0)}</span>
                    ) : (
                      <img src={avatarSource} alt="Profile" className="avatar-img-actual" />
                    )}
                  </div>
                  {showAvatarMenu && (
                    <div className="avatar-dropdown-v3 glass-effect fade-in-down">
                      <div className="dropdown-label">Pick avatar color</div>
                      <div className="preset-swatches-row">
                        {avatarPresets.map(color => (
                          <button 
                            key={color} 
                            className={`swatch-btn ${avatarColor === color ? 'active' : ''}`} 
                            style={{ background: color }} 
                            onClick={() => selectPreset(color)}
                          />
                        ))}
                      </div>
                      
                      <div className="dropdown-divider"></div>
                      
                      <button className="dropdown-action-row" onClick={() => fileInputRef.current.click()}>
                        <ImageIcon size={14} /> 
                        <span>Upload custom image</span>
                      </button>
                      
                      <div className="dropdown-divider"></div>
                      
                      <button className="btn-close-dropdown" onClick={() => setShowAvatarMenu(false)}>
                        <X size={12} /> Close
                      </button>
                    </div>
                  )}
                  <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileUpload} />
                </div>
                <div className="avatar-actions">
                  <button className="btn-avatar-edit-v2 ghost-btn" onClick={() => setShowAvatarMenu(!showAvatarMenu)}>
                    {showAvatarMenu ? 'Editing...' : 'Edit Avatar'}
                  </button>
                  <p className="text-xs text-dim">{avatarType === 'initials' ? 'Using letter-based preset' : 'Custom photo uploaded'}</p>
                </div>
              </div>

              <div className="input-grid">
                <div className="input-group">
                  <label>Full Name</label>
                  <div className="input-wrapper">
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your name" />
                    <div className="input-icon-right"><Pencil size={14} /></div>
                  </div>
                </div>
                <div className="input-group">
                  <label>Email Address</label>
                  <div className="input-wrapper">
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <div className="input-icon-right"><Pencil size={14} /></div>
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
            <div className="status-pill-row">
              <div className="status-indicator">
                <div className="dot pulse-success"></div>
                <span className="status-text">Teachable Machine v2 — Active</span>
              </div>
            </div>
            
            <div className="setting-control">
              <div className="control-header">
                <label>Confidence Threshold</label>
                <div className="control-val-badge" style={{ background: `rgba(124, 58, 237, 0.2)`, color: `#a78bfa` }}>
                  {getConfidenceLabel(confidence).text} · {confidence}%
                </div>
              </div>
              <input type="range" min="0" max="100" value={confidence} onChange={(e) => setConfidence(e.target.value)} className="slider" />
              <p className="explainer">Detections below this threshold will be ignored by the guard.</p>
            </div>

            <div className="model-reupload">
              <button className="btn-secondary ghost-btn"><Upload size={16} /> Re-upload Model Artifacts</button>
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
                    style={{ '--accent-ring': color.hex }}
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
                <div className="toggle-row" key={idx} onClick={() => notif.set(!notif.state)}>
                  <div className="toggle-text"><span className="toggle-label">{notif.label}</span><p className="text-xs text-dim">{notif.desc}</p></div>
                  <button className={`toggle-switch ${notif.state ? 'on' : ''}`} onClick={(e) => { e.stopPropagation(); notif.set(!notif.state); }}></button>
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
            <div className="export-btn-group">
              <button className="btn-export" onClick={() => alert('Preparing JSON Export...')}><Download size={16} /> Export (JSON)</button>
              <button className="btn-export" onClick={() => alert('Preparing CSV Export...')}><Download size={16} /> Export (CSV)</button>
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
            <div className="modal-content verification-modal fade-in-scale">
              <button className="modal-close-btn" onClick={() => setIsVerifying(false)}><X size={20} /></button>
              
              {verifyState === 'success' ? (
                <div className="success-state-view">
                  <div className="check-ring">
                    <CheckCircle2 size={64} className="text-success" />
                  </div>
                  <h2>Email Updated!</h2>
                  <p>Your profile has been secured with your new address.</p>
                </div>
              ) : (
                <>
                  <div className="modal-icon-header">
                    <div className="mail-icon-circle">
                      <Mail size={32} />
                    </div>
                  </div>
                  
                  <h2>Confirm Email Update</h2>
                  <p className="modal-description">
                    We've sent a 4-digit code to <strong>{email}</strong>. Enter it below to secure your changes.
                  </p>
                  
                  <div className="otp-input-container">
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={otpRefs[idx]}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className={`otp-field ${digit ? 'filled' : ''}`}
                        autoFocus={idx === 0}
                      />
                    ))}
                  </div>
                  
                  <div className="modal-actions-v2">
                    <button 
                      className={`btn-verify-otp ${otp.join('').length === 4 ? 'ready pulse-trigger' : ''}`}
                      onClick={verifyOtp}
                      disabled={otp.join('').length < 4 || verifyState === 'verifying'}
                    >
                      {verifyState === 'verifying' ? 'Verifying...' : 'Complete Verification'}
                    </button>
                    
                    <div className="resend-section">
                      {resendTimer > 0 ? (
                        <p className="text-xs text-dim">Resend code in <span className="timer-val">{resendTimer}s</span></p>
                      ) : (
                        <button className="btn-resend-link" onClick={handleResend}>Didn't receive code? <span>Resend</span></button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Standard Confirms */}
        {showConfirm && (
          <div className="modal-overlay danger-backdrop">
            <div className="modal-content danger-modal fade-in-scale">
              <button className="modal-close-btn" onClick={() => setShowConfirm(null)}><X size={20} /></button>
              
              <div className="danger-icon-header">
                <AlertTriangle size={48} className="text-danger" />
              </div>
              
              <h2>Are you absolutely sure?</h2>
              <p className="modal-description">
                This action is irreversible and will permanently remove your data from our servers.
              </p>
              
              <div className="danger-modal-actions">
                <button className="btn-cancel-modal" onClick={() => setShowConfirm(null)}>Cancel</button>
                <button className="btn-danger-confirm" onClick={() => { alert('Action Confirmed'); setShowConfirm(null); }}>
                  {showConfirm === 'clear' ? 'Yes, Reset History' : 'Confirm Destruction'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
