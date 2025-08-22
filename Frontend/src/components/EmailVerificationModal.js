import React, { useState } from 'react';
import axios from 'axios';
import '../styles/EmailVerificationModal.css';

const EmailVerificationModal = ({ planName, planAmount, planCurrency = 'INR', planBillingCycle = 'monthly', onSuccess, onCancel, onShowTrial }) => {
  const getCurrencySymbol = (code) => {
    const c = String(code || '').toUpperCase();
    switch (c) {
      case 'INR': return '₹';
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'JPY': return '¥';
      case 'CNY': return '¥';
      case 'AUD': return 'A$';
      case 'CAD': return 'C$';
      case 'SGD': return 'S$';
      case 'AED': return 'د.إ';
      default: return c || '₹';
    }
  };
  const currencySymbol = getCurrencySymbol(planCurrency);
  const period = String(planBillingCycle).toLowerCase() === 'yearly' || String(planBillingCycle).toLowerCase() === 'annual' ? 'per year' : 'per month';
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRegistrationActions, setShowRegistrationActions] = useState(false);
  const [showDevActions, setShowDevActions] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
  setError('');
  setShowRegistrationActions(false);
  setShowDevActions(false);
    
    try {
      // Validate email format first
      if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }
      
      // Check if email exists in the users table
      // Update the endpoint URL to point to your backend API
      const response = await axios.post('http://localhost:4000/api/users/verify-email', { email })
        .catch(err => {
          console.error('API error:', err);
          throw new Error('API not available');
        });
      
      if (response.data.exists) {
        // Email exists, proceed with payment
        localStorage.setItem('userEmail', email);
        onSuccess(email);
      } else {
        // Email doesn't exist, show trial registration option
        setError('Email not found. If you would like to register for a free trial, go to the registration page.');
        setShowRegistrationActions(true);
      }
    } catch (error) {
      console.error('Email verification error:', error);
      
      if (error.message === 'API not available') {
        // If API is not available, provide options to continue
        setError('Email verification service is not available. For testing purposes, you can continue with payment or try the free trial.');
        setShowDevActions(true);
      } else {
        setError('Unable to verify email. Please try again later.');
      }
    }
    
    setLoading(false);
  };
  
  return (
    <div className="email-verification-overlay">
      <div className="email-verification-modal">
        <button className="close-modal" onClick={onCancel}>&times;</button>
        <div className="evm-header">
          <div className="evm-icon">{currencySymbol}</div>
          <div>
            <h2>Subscribe to {planName} Plan</h2>
            <div className="evm-meta">Secure payment powered by Razorpay</div>
          </div>
        </div>
        <div className="evm-body">
          <p className="plan-price">{currencySymbol}{planAmount} {period}</p>

          <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Enter your email address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>
          
          {error && (
            <div className="error-message">
              {error}
              {showRegistrationActions && (
                <div className="error-action-buttons" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <a
                    href="/register"
                    className="register-link"
                    style={{ alignSelf: 'center' }}
                    onClick={() => { try { onCancel && onCancel(); } catch {}; }}
                  >
                    Go to Registration
                  </a>
                </div>
              )}
              {showDevActions && (
                <div className="error-action-buttons" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button
                    type="button"
                    className="register-trial-button"
                    style={{ flex: 1 }}
                    onClick={() => onSuccess(email)}
                  >
                    Continue to Payment
                  </button>
                  <button
                    type="button"
                    className="register-trial-button"
                    style={{ flex: 1, backgroundColor: '#27ae60' }}
                    onClick={() => { try { onCancel && onCancel(); } catch {}; try { onShowTrial && onShowTrial(); } catch {}; }}
                  >
                    Try Free Trial
                  </button>
                </div>
              )}
            </div>
          )}
          
          <div className="form-actions">
            <button 
              type="submit" 
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Continue to Payment'}
            </button>
            <button 
              type="button" 
              className="cancel-button"
              onClick={onCancel}
            >
              Cancel
            </button>
          </div>
          
          {/* Dev buttons removed as requested */}
        </form>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationModal;