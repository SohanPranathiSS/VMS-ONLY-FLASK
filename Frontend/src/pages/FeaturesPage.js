import React from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import '../styles/FeaturesPage.css';

const FeaturesPage = () => {
  return (
    <div className="features-container">
      <nav className="navbar">
       <div className="navbar-logo">
          <img src="/assets/CompanyLogo5.png" alt="Visitor Management" className="logo-image" style={{ height: '40px', width: 'auto' }} />
        </div>
        <ul className="navbar-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/products">Products</Link></li>
          <li><Link to="/resources">Resources</Link></li>
          <li><Link to="/aboutus">About Us</Link></li>
          <li><Link to="/pricing">Pricing</Link></li>
          <li><Link to="/bookademo">Book a Demo</Link></li>
          <li><Link to="/contactus">Contact Us</Link></li>
          <li><Link to="/register" className="register-btn">Registration</Link></li>
          <li><Link to="/login" className="login-btn">Login</Link></li>
        </ul>
      </nav>

      {/* Hero Section */}
      <header className="features-hero">
        <div className="features-hero-content">
          <h1 className="features-hero-title">Powerful Features</h1>
          <p className="features-hero-desc">Discover all the capabilities that make our Visitor Management System the perfect choice for your organization.</p>
        </div>
      </header>

      {/* Core Features Section */}
      <section className="features-section">
        <div className="features-container-inner">
          <h2>Core Features</h2>
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">
                <svg width="48" height="48" fill="#007bff" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <h3>Real-time Check-In/Out</h3>
              <p>Track visitor activity with accurate timestamps. Monitor who's in your building at any given moment with live status updates.</p>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <svg width="48" height="48" fill="#28a745" viewBox="0 0 24 24">
                  <path d="M9 2l3 3 3-3 1.5 1.5L14.5 5.5 17 8l-3 3 3 3-2.5 2.5L12 14.5 9.5 16.5 7 14l3-3-3-3 2-2z"/>
                </svg>
              </div>
              <h3>Photo Capture</h3>
              <p>Automatically capture visitor photos during registration for enhanced security and easy identification of guests.</p>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <svg width="48" height="48" fill="#dc3545" viewBox="0 0 24 24">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                </svg>
              </div>
              <h3>Role-based Access Control</h3>
              <p>Different access levels for admins, hosts, and visitors. Each user sees only what they need based on their role.</p>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <svg width="48" height="48" fill="#ffc107" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
              </div>
              <h3>Email & SMS Notifications</h3>
              <p>Automatically notify hosts when their visitors arrive. Keep everyone informed with real-time alerts.</p>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <svg width="48" height="48" fill="#6f42c1" viewBox="0 0 24 24">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
              </div>
              <h3>Secure Data Storage</h3>
              <p>All visitor logs and data are securely stored with encryption. Maintain compliance with data protection regulations.</p>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <svg width="48" height="48" fill="#17a2b8" viewBox="0 0 24 24">
                  <path d="M3,5A2,2 0 0,1 5,3H19A2,2 0 0,1 21,5V19A2,2 0 0,1 19,21H5C3.89,21 3,20.1 3,19V5M12,7A2,2 0 0,0 10,9A2,2 0 0,0 12,11A2,2 0 0,0 14,9A2,2 0 0,0 12,7M12,17C15,17 16,15.5 16,14C16,12.5 15,12 12,12C9,12 8,12.5 8,14C8,15.5 9,17 12,17Z"/>
                </svg>
              </div>
              <h3>Badge Printing</h3>
              <p>Generate professional visitor badges instantly. Customize badges with your company logo and visitor information.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Features Section */}
      <section className="advanced-features-section">
        <div className="features-container-inner">
          <h2>Advanced Features</h2>
          <div className="advanced-features-list">
            <div className="advanced-feature">
              <h4>QR Code Check-in</h4>
              <p>Enable contactless check-in with QR codes. Visitors can pre-register and check-in by scanning a code.</p>
            </div>
            <div className="advanced-feature">
              <h4>Blacklist Management</h4>
              <p>Maintain a security blacklist to prevent unauthorized individuals from entering your premises.</p>
            </div>
            <div className="advanced-feature">
              <h4>Multi-location Support</h4>
              <p>Manage visitors across multiple office locations from a single centralized dashboard.</p>
            </div>
            <div className="advanced-feature">
              <h4>Custom Fields</h4>
              <p>Add custom fields to capture specific information relevant to your organization's needs.</p>
            </div>
            <div className="advanced-feature">
              <h4>Reporting & Analytics</h4>
              <p>Generate detailed reports on visitor patterns, peak times, and security incidents.</p>
            </div>
            <div className="advanced-feature">
              <h4>Integration Ready</h4>
              <p>RESTful API for seamless integration with your existing security and HR systems.</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FeaturesPage;
