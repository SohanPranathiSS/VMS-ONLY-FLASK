import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-column">
          <h4>Visitor Management</h4>
          <p>Secure. Smart. Seamless.</p>
        </div>
        <div className="footer-column">
          <h4>Product</h4>
          <ul>
            <li><Link to="/features">Features</Link></li>
            <li><a href="/pricing">Pricing</a></li>
            <li><Link to="/faqs">FAQs</Link></li>
          </ul>
        </div>
        <div className="footer-column">
          <h4>Company</h4>
          <ul>
            <li><Link to="/aboutus">About Us</Link></li>
            <li><Link to="/careers">Careers</Link></li>
            <li><Link to="/contactus">Contact</Link></li>
          </ul>
        </div>
        <div className="footer-column">
          <h4>Legal</h4>
          <ul>
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/terms">Terms of Service</Link></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Visitor Management System. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
