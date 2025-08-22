import React, { useState } from 'react';
import axios from 'axios';
import '../styles/TrialRegistrationModal.css';

const TrialRegistrationModal = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Validate required fields
      if (!formData.name || !formData.email || !formData.company) {
        setError('Name, email, and company name are required');
        setLoading(false);
        return;
      }
      
      try {
        // Register for trial
        const response = await axios.post('/api/users/register-trial', formData);
        
        if (response.data.success) {
          onSuccess(formData.email);
        } else {
          setError(response.data.message || 'Failed to register. Please try again.');
        }
      } catch (apiError) {
        console.warn('API not available:', apiError);
        
        // For development, simulate successful registration
        console.log('Development mode: Simulating successful trial registration');
        
        // Create a success message for development mode
        setError('');
        
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.innerHTML = `
          <p>✅ Development Mode: Trial registration simulated successfully!</p>
          <p>In production, we would create your account in the database.</p>
        `;
        successMessage.style.backgroundColor = '#d4edda';
        successMessage.style.color = '#155724';
        successMessage.style.padding = '10px';
        successMessage.style.borderRadius = '4px';
        successMessage.style.marginBottom = '20px';
        
        // Find form
        const form = document.querySelector('.trial-registration-modal form');
        if (form) {
          // Insert success message at the top of the form
          form.insertBefore(successMessage, form.firstChild);
          
          // Create a continue button
          const continueButton = document.createElement('button');
          continueButton.innerText = 'Continue to App';
          continueButton.className = 'submit-button';
          continueButton.style.marginTop = '10px';
          continueButton.style.backgroundColor = '#27ae60';
          continueButton.onclick = (e) => {
            e.preventDefault();
            onSuccess(formData.email);
          };
          
          successMessage.appendChild(continueButton);
          
          // Hide form fields
          document.querySelectorAll('.form-group, .form-actions').forEach(el => {
            el.style.display = 'none';
          });
        }
      }
    } catch (error) {
      console.error('Trial registration error:', error);
      setError(error.response?.data?.message || 'Unable to register. Please try again later.');
    }
    
    setLoading(false);
  };
  
  return (
    <div className="trial-registration-overlay">
      <div className="trial-registration-modal">
        <button className="close-modal" onClick={onCancel}>&times;</button>
        <h2>Register for a 7-Day Free Trial</h2>
        <p className="trial-info">Experience all features with no commitment</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name*</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email Address*</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john@example.com"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="company">Company Name*</label>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              placeholder="Acme Inc."
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="phone">Phone Number (Optional)</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 (555) 123-4567"
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-button"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Start Free Trial'}
            </button>
          </div>
          
          <p className="terms-note">
            By registering, you agree to our <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>.
          </p>
        </form>
      </div>
    </div>
  );
};

export default TrialRegistrationModal;
