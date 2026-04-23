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
import { useSettings, ENGINES } from '../context/SettingsContext';
import { useUser } from '../context/UserContext';
import './Settings.css';

const Settings = () => {
  const { 
    accentColor, setAccentColor, 
    theme, setTheme,
    aiProvider, setAiProvider,
    confidenceThreshold, setConfidenceThreshold,
    teachableUrl, setTeachableUrl,
    tmV2Urls, setTmV2Urls,
    roboflowConfig, setRoboflowConfig,
    apiUsage,
    modelV1,
    modelV2Image,
    modelV2Posture
  } = useSettings();

  const { userData, updateProfile } = useUser();
  
  const fileInputRef = useRef(null);
  
  // Local Profile state (for dirty checking/saving)
  const [fullName, setFullName] = useState(userData?.displayName || "User");
  const [email, setEmail] = useState(userData?.email || "user@example.com");

  // Local AI state
  const [confidence, setConfidence] = useState(confidenceThreshold);
  const [localTeachableUrl, setLocalTeachableUrl] = useState(teachableUrl);
  const [localRoboflow, setLocalRoboflow] = useState(roboflowConfig);

  // Avatar states - fallbacks if none in userData
  const currentAvatarType = userData?.avatarType || 'initials';
  const currentAvatarColor = userData?.avatarColor || '#7c3aed';
  const currentAvatarSource = userData?.avatarSource || null;

  const [initialData, setInitialData] = useState({ 
    name: userData?.displayName || "User", 
    email: userData?.email || "user@example.com",
    avatarType: currentAvatarType,
    avatarColor: currentAvatarColor
  });
  
  // Verification & Save states
  const [isVerifying, setIsVerifying] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [verifyState, setVerifyState] = useState('idle'); // 'idle' | 'verifying' | 'success'
  const [finalSaveState, setFinalSaveState] = useState('idle'); // 'idle' | 'success'
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  
  // Change Password states
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // AI/App state
  const [showConfirm, setShowConfirm] = useState(null);
  
  // Notification states
  const [notifSound, setNotifSound] = useState(true);
  const [notifDesktop, setNotifDesktop] = useState(true);
  const [notifSummary, setNotifSummary] = useState(false);
  const [showDeployOwn, setShowDeployOwn] = useState(false);
  const [isModelLive, setIsModelLive] = useState(false);

  const isDirty = useMemo(() => {
    return (
      fullName !== initialData.name || 
      email !== initialData.email || 
      currentAvatarType !== initialData.avatarType ||
      (currentAvatarType === 'initials' && currentAvatarColor !== initialData.avatarColor) ||
      confidence !== confidenceThreshold ||
      localTeachableUrl !== teachableUrl ||
      JSON.stringify(localRoboflow) !== JSON.stringify(roboflowConfig)
    );
  }, [fullName, email, initialData, currentAvatarType, currentAvatarColor, confidence, confidenceThreshold, localTeachableUrl, teachableUrl, localRoboflow, roboflowConfig]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        await updateProfile({ 
          avatarSource: reader.result, 
          avatarType: 'upload' 
        });
        setShowAvatarMenu(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const selectPreset = async (color) => {
    await updateProfile({ 
      avatarColor: color, 
      avatarType: 'initials' 
    });
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

  const isStrongPassword = (pass) => {
    const minLength = 8;
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    return pass.length >= minLength && hasUpper && hasLower && hasNumber && hasSpecial;
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (passwords.new !== passwords.confirm) {
      setPasswordError("New passwords don't match.");
      return;
    }

    if (!isStrongPassword(passwords.new)) {
      setPasswordError("New password must be at least 8 characters, with an uppercase letter, a number, and a special character.");
      return;
    }

    // Simulate API call
    setIsVerifying(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsVerifying(false);
    
    // Simulate success
    setPasswordSuccess(true);
    setTimeout(() => {
      setPasswordSuccess(false);
      setShowChangePassword(false);
      setPasswords({ current: '', new: '', confirm: '' });
    }, 2000);
  };

  const completeSave = async () => {
    setFinalSaveState('success');
    await updateProfile({
      displayName: fullName,
      email: email,
      avatarInitial: fullName.charAt(0).toUpperCase()
    });
    
    // Update AI Settings
    setConfidenceThreshold(confidence);
    setTeachableUrl(localTeachableUrl);
    setRoboflowConfig(localRoboflow);

    setInitialData({ name: fullName, email: email, avatarType: currentAvatarType, avatarColor: currentAvatarColor });
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
                      background: currentAvatarType === 'initials' ? `linear-gradient(135deg, ${currentAvatarColor}, #1e2035)` : 'none',
                      boxShadow: `0 4px 12px ${currentAvatarColor}40`
                    }}
                  >
                    {currentAvatarType === 'initials' ? (
                      <span className="initials-text">{fullName.charAt(0)}</span>
                    ) : (
                      <img src={currentAvatarSource} alt="Profile" className="avatar-img-actual" />
                    )}
                  </div>
                  {showAvatarMenu && (
                    <div className="avatar-dropdown-v3 glass-effect fade-in-down">
                      <div className="dropdown-label">Pick avatar color</div>
                      <div className="preset-swatches-row">
                        {avatarPresets.map(color => (
                          <button 
                            key={color} 
                            className={`swatch-btn ${currentAvatarColor === color ? 'active' : ''}`} 
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
                  <p className="text-xs text-dim">{currentAvatarType === 'initials' ? 'Using letter-based preset' : 'Custom photo uploaded'}</p>
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

        {/* Section 2: AI Core */}
        <section className="settings-section">
          <div className="section-info">
            <h3><Cpu size={18} /> AI Core</h3>
            <p>Select your vision engine and configure detection parameters.</p>
          </div>
          <div className="section-content">
            <div className="setting-control">
              <label className="mb-3 d-block">Detection Engine</label>
              <div className="engine-card-grid">
                {Object.values(ENGINES).map(engine => (
                  <div 
                    key={engine.id} 
                    className={`engine-selector-card ${aiProvider === engine.id ? 'active' : ''}`}
                    onClick={() => setAiProvider(engine.id)}
                  >
                    <div className="engine-card-header">
                      <span className="engine-icon">{engine.icon}</span>
                      <div className="engine-meta">
                        <span className="engine-name">{engine.name}</span>
                        <span className="engine-label-small">{engine.label}</span>
                      </div>
                    </div>
                    <div className="engine-card-body">
                      <div className="engine-stat-row">
                        <span className="stat-dot"></span>
                        <span>{engine.classes.length} classes</span>
                      </div>
                      <div className="engine-stat-row">
                        <span className="stat-dot"></span>
                        <span>{engine.interval === 100 ? 'Real-time' : 'High accuracy'}</span>
                      </div>
                      <div className="engine-stat-row">
                        <span className="stat-dot"></span>
                        <span>{engine.requiresAPI ? 'Needs Internet' : 'Offline Engine'}</span>
                      </div>
                    </div>
                    <div className="engine-card-footer">
                      {aiProvider === engine.id ? (
                        <span className="active-badge"><Check size={12} /> Active</span>
                      ) : engine.requiresAPI ? (
                        <span className="api-key-prompt">API Key Needed</span>
                      ) : (
                        <span className="select-text">Select Engine</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="status-pill-row">
              <div className="status-indicator">
                <div className={`dot ${aiProvider === 'Fast Mode' || aiProvider === 'Balanced Mode' ? 'pulse-success' : 'pulse-info'}`}></div>
                <span className="status-text">
                  {aiProvider === 'Fast Mode' ? 'Teachable Machine v1 — Ready' : 
                   aiProvider === 'Balanced Mode' ? 'Teachable Machine v2 — Connected' : 
                   'Roboflow API — Connected'}
                </span>
              </div>
            </div>

            <div className="engine-details-container">
              {aiProvider === 'Fast Mode' || aiProvider === 'Balanced Mode' ? (
                <div className="mode-details-v4 fade-in">
                  <div className="mode-desc-box">
                    <p className="explainer mb-4">
                      Currently using <b>{aiProvider === 'Fast Mode' ? 'TM v1' : 'TM v2'} Browser-Based Inference</b> optimized for {aiProvider === 'Fast Mode' ? 'zero-latency' : 'expanded detection'}.
                    </p>
                    
                  <div className="model-diagnostics-v2 mt-4">
                    <span className="stat-label-tiny mb-2 d-block">vision stream verification</span>
                    <div className="diagnostic-grid">
                      <div className="diagnostic-item">
                        <div className="diag-header">
                          <span className="diag-name">IMAGE MODEL (V2)</span>
                          <span className={`diag-status ${modelV2Image ? 'active' : 'dead'}`}>
                            {modelV2Image ? 'CONNECTED' : 'WAITING'}
                          </span>
                        </div>
                        <div className="diag-url-snippet">{tmV2Urls.image}</div>
                        <div className="diag-classes-count">
                          {modelV2Image ? `${modelV2Image.getClassLabels?.()?.length || '?'} classes detected` : 'Scanning...'}
                        </div>
                      </div>
                      <div className="diagnostic-item">
                        <div className="diag-header">
                          <span className="diag-name">POSTURE MODEL (V2)</span>
                          <span className={`diag-status ${modelV2Posture ? 'active' : 'dead'}`}>
                            {modelV2Posture ? 'CONNECTED' : 'WAITING'}
                          </span>
                        </div>
                        <div className="diag-url-snippet">{tmV2Urls.posture}</div>
                        <div className="diag-classes-count">
                          {modelV2Posture ? `${modelV2Posture.getClassLabels?.()?.length || '?'} classes detected` : 'Scanning...'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="classes-section mt-4">
                    <span className="stat-label-tiny mb-2 d-block">ACTIVE DETECTION PIXELS</span>
                    <div className="classes-badge-group">
                      {ENGINES[aiProvider === 'Fast Mode' ? 'TM_V1' : 'TM_V2'].classes.map(cls => (
                        <span key={cls} className="mode-badge">{cls}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
                <div className="mode-details-v4 fade-in">
                  <div className="precision-stats-grid">
                    <div className="stat-card-v2">
                      <span className="stat-label-tiny">CLASSES DETECTED</span>
                      <span className="stat-value-large">8+</span>
                    </div>
                    <div className="stat-card-v2">
                      <span className="stat-label-tiny">API USAGE</span>
                      <div className="usage-value-row">
                        <span className="stat-value-large">{apiUsage.used}</span>
                        <span className="stat-value-muted">/ {apiUsage.total}</span>
                      </div>
                      <span className="reset-timer-tag">Resets in {apiUsage.resetsIn} days</span>
                    </div>
                  </div>

                  <div className="usage-progress-v2 mt-4">
                    <div className="usage-bar-bg">
                      <div className="usage-bar-fill" style={{ width: `${(apiUsage.used / apiUsage.total) * 100}%` }}></div>
                    </div>
                  </div>
                  
                  <div className="deploy-custom-section mt-4">
                    {isModelLive ? (
                      <div className="model-live-status fade-in">
                        <div className="dot pulse-success"></div>
                        <span className="status-text-v2">Your custom model will be live in a few moments...</span>
                      </div>
                    ) : !showDeployOwn ? (
                      <button className="btn-secondary ghost-btn btn-xs" onClick={() => setShowDeployOwn(true)}>
                        Want to deploy your own model?
                      </button>
                    ) : (
                      <div className="custom-model-form fade-in">
                        <div className="input-group">
                          <label className="stat-label-tiny">ROBOFLOW API KEY</label>
                          <div className="input-wrapper-v2">
                            <input 
                              type="password" 
                              value={localRoboflow.apiKey} 
                              onChange={(e) => setLocalRoboflow({...localRoboflow, apiKey: e.target.value})} 
                              placeholder="••••••••••••••••" 
                            />
                            <button className="btn-save-key" onClick={() => {
                              setRoboflowConfig(localRoboflow);
                              setIsModelLive(true);
                              setShowDeployOwn(false);
                            }}>
                              Update
                            </button>
                          </div>
                        </div>
                        <button className="btn-cancel-deploy mt-2" onClick={() => setShowDeployOwn(false)}>Cancel</button>
                      </div>
                    )}
                  </div>
                  
                  <p className="explainer mt-4">Model: <b>DeepWork AI v1</b> · <span className="text-success">76% mAP</span></p>
                </div>
              )}
            </div>

            {/* Comparison Table */}
            <div className="comparison-table-wrapper mt-5">
              <h4 className="table-title mb-3">Engine Comparison</h4>
              <div className="comparison-table glass-effect">
                <div className="table-row table-header">
                  <div className="cell cell-feature">DETECTION CLASS</div>
                  <div className="cell cell-v1">v1 Fast</div>
                  <div className="cell cell-v2 highlight">v2 Balanced</div>
                  <div className="cell cell-precision">Precision</div>
                </div>
                {[
                  { label: 'Focused', v1: true, v2: true, prec: true },
                  { label: 'Phone Detected', v1: true, v2: true, prec: true },
                  { label: 'Looking Away', v1: true, v2: true, prec: true },
                  { label: 'Away from Desk', v1: true, v2: true, prec: true },
                  { label: 'Yawning', v1: false, v2: true, prec: true },
                  { label: 'Multiple People', v1: false, v2: true, prec: true },
                  { label: 'Slouching', v1: false, v2: true, prec: true },
                  { label: 'Earbuds / Headphones', v1: false, v2: false, prec: true },
                  { label: 'Smartwatch', v1: false, v2: false, prec: true },
                  { label: 'Eyes Closed', v1: false, v2: false, prec: true },
                ].map((row, i) => (
                  <div key={i} className="table-row">
                    <div className="cell cell-feature">{row.label}</div>
                    <div className="cell cell-v1">{row.v1 ? <Check size={14} className="text-success" /> : <X size={14} className="text-dim" />}</div>
                    <div className="cell cell-v2 highlight">{row.v2 ? <Check size={14} className="text-purple" /> : <X size={14} className="text-dim" />}</div>
                    <div className="cell cell-precision">{row.prec ? <Check size={14} className="text-emerald" /> : <X size={14} className="text-dim" />}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="setting-control mt-4">
              <div className="control-header">
                <label>Inference Confidence</label>
                <div className="control-val-badge" style={{ background: `rgba(124, 58, 237, 0.2)`, color: `#a78bfa` }}>
                  {getConfidenceLabel(confidence).text} · {confidence}%
                </div>
              </div>
              <input type="range" min="0" max="100" value={confidence} onChange={(e) => setConfidence(e.target.value)} className="slider" />
              <p className="explainer">Minimum score required to trigger a distraction alert.</p>
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

        {/* Section 5: Security & Privacy */}
        <section className="settings-section">
          <div className="section-info">
            <h3><Lock size={18} /> Security & Privacy</h3>
            <p>Manage your password, data exports, and sensitive logs.</p>
          </div>
          <div className="section-content">
            <div className="setting-control" style={{ marginBottom: '24px' }}>
              <label>Password Authentication</label>
              <button 
                className="btn-secondary ghost-btn" 
                onClick={() => setShowChangePassword(true)}
              >
                Change Password
              </button>
            </div>
            
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

        {/* Change Password Modal */}
        {showChangePassword && (
          <div className="modal-overlay">
            <div className="modal-content fade-in-scale" style={{ width: '420px', textAlign: 'left', padding: '36px' }}>
              <button className="modal-close-btn" onClick={() => setShowChangePassword(false)}><X size={20} /></button>
              
              {!passwordSuccess ? (
                <>
                  <div className="modal-icon-header" style={{ marginBottom: '24px' }}>
                    <div className="icon-circle" style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed' }}>
                      <Lock size={24} />
                    </div>
                  </div>
                  
                  <h2 style={{ fontSize: '22px', marginBottom: '8px', color: '#fff' }}>Change Password</h2>
                  <p style={{ color: 'var(--text-dim)', marginBottom: '24px', fontSize: '14px' }}>
                    Ensure your account is using a long, random password to stay secure.
                  </p>
                  
                  <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="auth-input-group">
                      <label style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.7)', marginBottom: '6px', display: 'block' }}>Current Password</label>
                      <input 
                        type="password" 
                        value={passwords.current} 
                        onChange={(e) => setPasswords({...passwords, current: e.target.value})} 
                        style={{ width: '100%', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '12px 16px', color: '#fff', fontSize: '14px' }}
                        required 
                      />
                    </div>
                    
                    <div className="auth-input-group">
                      <label style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.7)', marginBottom: '6px', display: 'block' }}>New Password</label>
                      <input 
                        type="password" 
                        value={passwords.new} 
                        onChange={(e) => setPasswords({...passwords, new: e.target.value})} 
                        style={{ width: '100%', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '12px 16px', color: '#fff', fontSize: '14px' }}
                        required 
                      />
                    </div>
                    
                    <div className="auth-input-group">
                      <label style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.7)', marginBottom: '6px', display: 'block' }}>Confirm New Password</label>
                      <input 
                        type="password" 
                        value={passwords.confirm} 
                        onChange={(e) => setPasswords({...passwords, confirm: e.target.value})} 
                        style={{ width: '100%', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '12px 16px', color: '#fff', fontSize: '14px' }}
                        required 
                      />
                    </div>
                    
                    {passwordError && <p className="auth-error-text" style={{ margin: '0' }}>{passwordError}</p>}
                    
                    <div className="danger-modal-actions" style={{ marginTop: '16px' }}>
                      <button type="button" className="btn-cancel-modal" onClick={() => setShowChangePassword(false)}>Cancel</button>
                      <button type="submit" className="btn-danger-confirm" style={{ flex: 2, margin: 0, background: '#7c3aed', borderColor: '#7c3aed' }} disabled={isVerifying}>
                        {isVerifying ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="success-state-view">
                  <div className="check-ring">
                    <CheckCircle2 size={64} className="text-success" />
                  </div>
                  <h2>Password Updated!</h2>
                  <p>Your new password is now active.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
