import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { checkEmailVerified, resetPasswordByEmail } from '../utils/apiService';
import '../styles/LoginPage.css';
import '../styles/ForgotPasswordPage.css';

const ForgotPasswordPage = () => {
  const [step, setStep] = useState('email'); // 'email' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [toast, setToast] = useState({ visible: false, text: '' });
  const redirectTimerRef = useRef(null);

  const onCheckEmail = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await checkEmailVerified(email);
      if (res?.emailVerified) {
        setStep('reset');
        setMessage('Email verified. Please set a new password.');
      } else {
        setError('Email not verified.');
      }
    } catch (err) {
      setError(err.message || 'Failed to verify email');
    } finally {
      setLoading(false);
    }
  };

  const onReset = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await resetPasswordByEmail(email, password, confirmPassword);
      setMessage('Password reset successful. Redirecting to login...');
      setToast({ visible: true, text: 'Password reset successful' });
      // Delay redirect to let user see the toast
      redirectTimerRef.current = setTimeout(() => {
        navigate('/login');
      }, 1500);
      return;
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  const toastStyle = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    background: '#28a745',
    color: '#fff',
    padding: '10px 14px',
    borderRadius: '4px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    zIndex: 9999
  };

  return (
    <div className="loginpage-outer">
      <Navbar showAuthButtons={true} showMainLinks={true} isLoggedIn={false} showOnlyRegister={false} />
      <div className="login-container">
        <h2 className="login-title">Forgot Password</h2>
        <p className="fp-subtext">
          {step === 'email'
            ? 'Enter your registered email. If it is verified, you can set a new password.'
            : 'Create a new password for your account.'}
        </p>

        {step === 'email' && (
          <form className="login-form" onSubmit={onCheckEmail}>
            <div className="fp-field">
              <label>Email:</label><br />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            {error && <p className="login-error" role="alert">{error}</p>}
            {message && <p className="fp-success" aria-live="polite">{message}</p>}
            <button type="submit" disabled={loading}>{loading ? 'Checking...' : 'Verify Email'}</button>
            <div className="fp-links">
              <a href="/login">Back to Login</a>
            </div>
          </form>
        )}

        {step === 'reset' && (
          <form className="login-form" onSubmit={onReset}>
            <div className="fp-field">
              <label>Email:</label><br />
              <input type="email" value={email} disabled />
            </div>
            <div className="fp-field">
              <label>New Password:</label><br />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <small className="fp-hint">Minimum 6 characters.</small>
            </div>
            <div className="fp-field">
              <label>Confirm Password:</label><br />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <div className="fp-toggle-row">
              <input
                id="fpShowPassword"
                type="checkbox"
                checked={showPassword}
                onChange={() => setShowPassword(!showPassword)}
              />
              <label htmlFor="fpShowPassword">Show password</label>
            </div>
            {error && <p className="login-error" role="alert">{error}</p>}
            {message && <p className="fp-success" aria-live="polite">{message}</p>}
            <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Reset Password'}</button>
            <div className="fp-links">
              <a href="/login">Back to Login</a>
            </div>
          </form>
        )}
      </div>
      <Footer />
      {toast.visible && (
        <div role="status" aria-live="polite" style={toastStyle}>
          {toast.text}
        </div>
      )}
    </div>
  );
};

export default ForgotPasswordPage;
