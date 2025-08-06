import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/AdminFooter.css';

const AdminFooter = () => {
  return (
    <footer className="admin-footer">
      <div className="admin-footer-content">
        <div className="admin-footer-links">
          <Link to="/admin/privacy-policy" className="admin-footer-link">Privacy Policy</Link>
          <span className="admin-footer-separator">|</span>
          <Link to="/admin/terms-of-service" className="admin-footer-link">Terms of Service</Link>
        </div>
        <div className="admin-footer-copyright">
          © 2025 Visitor Management System. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default AdminFooter;
