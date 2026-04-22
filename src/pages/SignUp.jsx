import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Camera, BarChart2, Bell, Eye, EyeOff } from 'lucide-react';
import { useUser } from '../context/UserContext';
import './Auth.css';

const SignUp = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  
  const { signup } = useUser();
  const navigate = useNavigate();

  const isStrongPassword = (pass) => {
    const minLength = 8;
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    return pass.length >= minLength && hasUpper && hasLower && hasNumber && hasSpecial;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (!isStrongPassword(password)) {
      setPasswordError('Password must be at least 8 characters long, include an uppercase letter, a number, and a special character.');
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError("Passwords don't match.");
      return;
    }
    
    setIsLoading(true);
    try {
      await signup(fullName, email, password);
      navigate('/dashboard');
    } catch (error) {
      alert("Error signing up");
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left-panel">
        <div className="auth-radial-glow"></div>
        <div className="auth-brand-content">
          <div className="auth-logo-icon">
            <ShieldCheck size={32} strokeWidth={2.5} />
          </div>
          <h1>DeepWorkGuard</h1>
          <p className="auth-tagline">Master your focus. Eliminate distractions.</p>
          
          <div className="auth-features">
            <div className="feature-pill">
              <Camera size={20} className="feature-pill-icon" />
              <span>Vision Guard</span>
            </div>
            <div className="feature-pill">
              <BarChart2 size={20} className="feature-pill-icon" />
              <span>Focus Analytics</span>
            </div>
            <div className="feature-pill">
              <Bell size={20} className="feature-pill-icon" />
              <span>Smart Alerts</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="auth-right-panel">
        <div className="auth-form-container fade-in">
          <div className="auth-form-header">
            <h2>Create your account</h2>
            <p>Start your deep work journey today</p>
          </div>
          
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-input-group">
              <label>Full Name</label>
              <div className="auth-input-wrapper">
                <input 
                  type="text" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  placeholder="Enter your name"
                  required 
                />
              </div>
            </div>
            
            <div className="auth-input-group">
              <label>Email address</label>
              <div className="auth-input-wrapper">
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="name@example.com"
                  required 
                />
              </div>
            </div>
            
            <div className="auth-input-group">
              <label>Password</label>
              <div className="auth-input-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }} 
                  placeholder="Create a strong password"
                  required 
                />
                {showPassword ? 
                  <EyeOff size={18} className="auth-input-icon" onClick={() => setShowPassword(false)} /> : 
                  <Eye size={18} className="auth-input-icon" onClick={() => setShowPassword(true)} />
                }
              </div>
              {passwordError && <p className="auth-error-text">{passwordError}</p>}
            </div>
            
            <div className="auth-input-group">
              <label>Confirm Password</label>
              <div className="auth-input-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  placeholder="Confirm your password"
                  required 
                />
              </div>
            </div>
            
            <button type="submit" className="auth-btn-primary" disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
            
            <div className="auth-divider">or continue with</div>
            
            <button type="button" className="auth-btn-google">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </form>
          
          <div className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
