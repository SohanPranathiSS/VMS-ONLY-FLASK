import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import '../styles/BookDemoPage.css';

const BookDemoPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    preferred_date: '',
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
      const response = await fetch(`${apiBaseUrl}/book-demo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSubmitMessage('Demo booking successful! We will contact you soon.');
        setFormData({
          name: '',
          email: '',
          organization: '',
          preferred_date: '',
          message: ''
        });
      } else {
        const errorData = await response.json();
        setSubmitMessage(`Error: ${errorData.message || 'Failed to book demo'}`);
      }
    } catch (error) {
      console.error('Error submitting demo booking:', error);
      setSubmitMessage('Error: Failed to submit demo booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="bookdemo-container">
      <nav className="navbar">
        <div className="navbar-logo">Visitor Management</div>
        <ul className="navbar-links">
          <li><a href="/">Home</a></li>
          <li><Link to="/products">Products</Link></li>
          <li><Link to="/resources">Resources</Link></li>
          <li><Link to="/aboutus">About Us</Link></li>
          <li><Link to="/bookademo">Book a Demo</Link></li>
          <li><a href="/contactus">Contact Us</a></li>
          <li><a href="/register" className="register-btn">Registeration</a></li>
          <li><a href="/login" className="login-btn">Login</a></li>
        </ul>
      </nav>
      <header className="bookdemo-header">
        <h1>Book a Demo</h1>
        <p>Schedule a personalized demo to see how our Visitor Management System can benefit your organization.</p>
      </header>
      <section className="bookdemo-form-section">
        <form className="bookdemo-form" onSubmit={handleSubmit}>
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
          <label>Organization
            <input 
              type="text" 
              name="organization"
              value={formData.organization}
              onChange={handleInputChange}
              placeholder="Your Organization" 
              required
            />
          </label>
          <label>Preferred Date
            <input 
              type="date" 
              name="preferred_date"
              value={formData.preferred_date}
              onChange={handleInputChange}
              required
            />
          </label>
          <label>Message
            <textarea 
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="Tell us about your needs..." 
              rows="4"
            />
          </label>
          
          {submitMessage && (
            <div className={`submit-message ${submitMessage.includes('Error') ? 'error' : 'success'}`}>
              {submitMessage}
            </div>
          )}
          
          <button 
            type="submit" 
            className="hero-cta"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Booking Demo...' : 'Book Demo'}
          </button>
        </form>
      </section>
      
      <Footer />
    </div>
  );
};

export default BookDemoPage;
