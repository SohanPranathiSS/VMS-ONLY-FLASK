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
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(''); // Clear errors on new input
  };

  const validatePassword = (password) => {
    return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password);
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
          <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required />
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
