import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/AboutUsPage.css';

const AboutUsPage = () => {
  return (
    <div className="aboutus-container">
      <Navbar showAuthButtons={true} />

      {/* Hero Section */}
      <header className="aboutus-hero">
        <div className="aboutus-hero-content">
          <h1 className="aboutus-hero-title">About Us</h1>
          <p className="aboutus-hero-desc">Building secure, smart, and seamless visitor management solutions for modern workplaces.</p>
        </div>
      </header>

      {/* Info Cards Section */}
      <section className="aboutus-cards-section">
        <div className="aboutus-cards-grid">
          <div className="aboutus-card">
            <div className="aboutus-card-icon mission">
              <svg width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="24" r="24" fill="#007bff" opacity="0.13"/><path d="M24 26c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7 3.582 7 8 7zm0 3c-5.33 0-16 2.668-16 8v3h32v-3c0-5.332-10.67-8-16-8z" fill="#007bff"/></svg>
            </div>
            <h2>Our Mission</h2>
            <p>To empower organizations with innovative technology that streamlines visitor experiences and enhances workplace security.</p>
          </div>
          <div className="aboutus-card">
            <div className="aboutus-card-icon team">
              <svg width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="24" r="24" fill="#28a745" opacity="0.13"/><path d="M24 26c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7 3.582 7 8 7zm0 3c-5.33 0-16 2.668-16 8v3h32v-3c0-5.332-10.67-8-16-8z" fill="#28a745"/></svg>
            </div>
            <h2>Our Team</h2>
            <p>Our passionate team of developers, designers, and support staff is committed to delivering the best possible product and service to our clients.</p>
          </div>
          <div className="aboutus-card">
            <div className="aboutus-card-icon contact">
              <svg width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="24" r="24" fill="#ffc107" opacity="0.13"/><path d="M24 26c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7 3.582 7 8 7zm0 3c-5.33 0-16 2.668-16 8v3h32v-3c0-5.332-10.67-8-16-8z" fill="#ffc107"/></svg>
            </div>
            <h2>Contact</h2>
            <p>Have questions? <Link to="/contactus" className="aboutus-link">Contact us</Link> to learn more about our solutions.</p>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default AboutUsPage;
