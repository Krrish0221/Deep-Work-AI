import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import { useUser } from '../context/UserContext';
import './Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { resetPassword } = useUser();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await resetPassword(email);
      setIsSent(true);
    } catch (error) {
      alert("Error sending reset link");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-centered">
      <div className="auth-radial-glow"></div>
      
      <div className="forgot-password-card fade-in">
        <Link to="/login" className="back-link">
          <ArrowLeft size={16} /> Back to login
        </Link>
        
        {!isSent ? (
          <>
            <div className="forgot-header">
              <div className="forgot-icon-wrapper">
                <ShieldCheck size={32} strokeWidth={2.5} />
              </div>
              <h2>Forgot your password?</h2>
              <p>Enter your email and we'll send a reset link.</p>
            </div>
            
            <form className="auth-form" onSubmit={handleSubmit}>
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
                  <Mail size={18} className="auth-input-icon" style={{ pointerEvents: 'none' }} />
                </div>
              </div>
              
              <button type="submit" className="auth-btn-primary" disabled={isLoading} style={{ marginTop: '16px' }}>
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </>
        ) : (
          <div className="success-message">
            <div className="success-icon-wrapper">
              <CheckCircle2 size={32} />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Check your inbox!</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
              We sent a password reset link to <br />
              <strong style={{ color: '#fff' }}>{email}</strong>
            </p>
            <button className="auth-btn-primary" onClick={() => setIsSent(false)} style={{ marginTop: '24px' }}>
              Send again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
