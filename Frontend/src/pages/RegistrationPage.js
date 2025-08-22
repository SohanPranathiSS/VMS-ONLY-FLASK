import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerCompany } from '../utils/apiService'; // UPDATED
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import '../styles/RegistrationPage.css';

const RegistrationPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    companyName: '',
    mobileNumber: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(''); // Clear errors on new input
  };

  const validatePassword = (password) => {
    return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validatePassword(formData.password)) {
      setError('Password does not meet the requirements.');
      return;
    }

    setLoading(true);
    try {
      // UPDATED: Now calling the new registerCompany function
      await registerCompany(formData);
      setSuccess('Registration successful! Redirecting to login...');
      setShowToast(true);
      
      // Hide toast after 3 seconds and redirect
      setTimeout(() => {
        setShowToast(false);
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registration-page">
      {/* Toast Notification */}
      {showToast && (
        <div className="toast-notification">
          <div className="toast-content">
            <div className="toast-icon">✓</div>
            <div className="toast-message">
              <strong>Success!</strong>
              <p>Registration completed successfully. Redirecting to login...</p>
            </div>
          </div>
        </div>
      )}
      
      <Navbar 
        showAuthButtons={true}
        showMainLinks={true}
        isLoggedIn={false}
        showOnlyLogin={true}
      />
      <div className="registration-container">
        <form className="registration-form" onSubmit={handleSubmit}>
          <h2>Create Your Account</h2>
          {error && <p className="password-notification" style={{color: 'red'}}>{error}</p>}
          {success && <p className="password-notification" style={{color: 'green'}}>{success}</p>}
          
          <label htmlFor="email">Email <span className="required">*</span></label>
          <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
          
          <div className="name-fields">
            <div className="name-field">
              <label htmlFor="firstName">
                First name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="name-field">
              <label htmlFor="lastName">
                Last name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <label htmlFor="companyName">Company name <span className="required">*</span></label>
          <input
            type="text"
            id="companyName"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            placeholder="Enter your company name"
            required
          />

          <label htmlFor="mobileNumber">Mobile number</label>
          <input
            type="tel"
            id="mobileNumber"
            name="mobileNumber"
            value={formData.mobileNumber}
            onChange={handleChange}
            placeholder="Enter your mobile number"
          />

          <label htmlFor="password">Create password <span className="required">*</span></label>
          <div className="password-input-container">
            <input 
              type={showPassword ? "text" : "password"} 
              id="password" 
              name="password" 
              value={formData.password} 
              onChange={handleChange} 
              required 
            />
            <button 
              type="button" 
              className="password-toggle-btn" 
              onClick={togglePasswordVisibility}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
          <p className="password-hint">
            Must be 8+ characters and include an uppercase letter, a lowercase letter, and a number.
          </p>

          <div className="form-footer">
            <button type="submit" className="next-button" disabled={loading}>
              {loading ? 'Registering...' : 'Create Account'}
            </button>
          </div>
        </form>

        <div className="info-panel">
            {/* Info panel remains the same */}
            <h3>
            VMS saves <br />
            administrators <br />
            an average of <br />
            <span className="highlight">100 hours</span> <br />
            per year
          </h3>
          <p className="survey-note">Based on an VMS customer survey</p>

        </div>
      </div>
     
      <Footer />
    </div>
    
  );
};

export default RegistrationPage;
