import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/ContactUsPage.css';

const ContactUsPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000/api';
      const response = await fetch(`${apiBaseUrl}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSubmitMessage('Message sent successfully! We will get back to you soon.');
        setFormData({
          name: '',
          email: '',
          message: ''
        });
      } else {
        const errorData = await response.json();
        setSubmitMessage(`Error: ${errorData.message || 'Failed to send message'}`);
      }
    } catch (error) {
      console.error('Error submitting contact form:', error);
      setSubmitMessage('Error: Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="contactus-container">
      <Navbar showAuthButtons={true} />

      {/* Hero Section */}
      <header className="contactus-hero">
        <div className="contactus-hero-content">
          <h1 className="contactus-hero-title">Contact Us</h1>
          <p className="contactus-hero-desc">We'd love to hear from you! Reach out with your questions, feedback, or support needs.</p>
        </div>
      </header>

      {/* Two-Column Section */}
      <section className="contactus-main-section">
        <div className="contactus-main-grid">
          <form className="contactus-form" onSubmit={handleSubmit}>
            <label>Name
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Your Name" 
                required 
              />
            </label>
            <label>Email
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Your Email" 
                required 
              />
            </label>
            <label>Message
              <textarea 
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="How can we help you?" 
                rows="4" 
                required
              />
            </label>
            
            {submitMessage && (
              <div className={`submit-message ${submitMessage.includes('Error') ? 'error' : 'success'}`}>
                {submitMessage}
              </div>
            )}
            
            <button 
              type="submit" 
              className="contactus-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
          <div className="contactus-info-card">
            <div className="contactus-info-icon">
              <svg width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="24" r="24" fill="#007bff" opacity="0.13"/><path d="M24 26c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7 3.582 7 8 7zm0 3c-5.33 0-16 2.668-16 8v3h32v-3c0-5.332-10.67-8-16-8z" fill="#007bff"/></svg>
            </div>
            <h2>Contact Details</h2>
            <p>Email: <a href="mailto:support@visitormanagement.com">apps@pranathiss.com</a></p>
            {/* <p>Phone: +1 (800) 123-4567</p> */}
            <p>Address: 15 Corporate Pl S #421,
              Piscataway, NJ 08854, United States.</p>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default ContactUsPage;
