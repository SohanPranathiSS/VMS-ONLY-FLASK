import React from 'react';
import { Link } from 'react-router-dom';
import './HostFooter.css';

const HostFooter = () => {
  return (
    <footer className="host-footer">
      <div className="host-footer-content">
        <div className="host-footer-links">
          <Link to="/host/privacy-policy" className="host-footer-link">Privacy Policy</Link>
          <Link to="/host/terms-of-service" className="host-footer-link">Terms of Service</Link>
        </div>
        <div className="host-footer-copyright">
          © 2025 Visitor Management System. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default HostFooter;
