import React from 'react';
import { Link } from 'react-router-dom';
import HostFooter from '../components/HostFooter';
import '../styles/HostPolicyPages.css';

const HostPrivacyPolicyPage = () => {
  return (
    <div className="host-policy-page">
      <nav className="navbar">
        <div className="navbar-logo">Visitor Management</div>
        <ul className="navbar-links">
          <li>
            <Link to="/host-dashboard" className="back-btn">
              ← Back to Host Dashboard
            </Link>
          </li>
        </ul>
      </nav>

      <div className="policy-container">
        <div className="policy-content">
          <h1>Privacy Policy</h1>
          <p className="last-updated">Last updated: August 5, 2025</p>

          <section>
            <h2>1. Information We Collect</h2>
            <p>The Visitor Management System collects and processes the following types of information:</p>
            <ul>
              <li><strong>Visitor Information:</strong> Name, email address, phone number, company affiliation, purpose of visit, photo ID details, and vehicle information</li>
              <li><strong>Host Information:</strong> Employee names, departments, contact details, and access permissions</li>
              <li><strong>Visit Records:</strong> Check-in/check-out times, visit duration, locations accessed, and digital signatures</li>
            </ul>
          </section>

          <section>
            <h2>2. How We Use Your Information</h2>
            <p>We use the collected information for the following purposes:</p>
            <ul>
              <li>Facilitating visitor check-in and check-out processes</li>
              <li>Maintaining security and safety records</li>
              <li>Sending notifications to hosts about visitor arrivals</li>
              <li>Generating reports for compliance and security purposes</li>
              <li>Improving our service quality and user experience</li>
            </ul>
          </section>

          <section>
            <h2>3. Data Security</h2>
            <p>We implement industry-standard security measures to protect your personal information:</p>
            <ul>
              <li>Encrypted data transmission and storage</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and authentication protocols</li>
              <li>Secure backup and recovery procedures</li>
            </ul>
          </section>

          <section>
            <h2>4. Data Retention</h2>
            <p>We retain visitor and host information only as long as necessary for:</p>
            <ul>
              <li>Legal compliance requirements</li>
              <li>Security and audit purposes</li>
              <li>Service provision and support</li>
            </ul>
            <p>Visitor photos and personal data are typically retained for 90 days unless required longer by law or security policies.</p>
          </section>

          <section>
            <h2>5. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal information</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data (subject to legal requirements)</li>
              <li>Opt-out of non-essential communications</li>
            </ul>
          </section>

          <section>
            <h2>6. Contact Information</h2>
            <div className="contact-info">
              <p><strong>Data Protection Officer:</strong> privacy@visitormanagementsystem.com</p>
              <p><strong>Support Team:</strong> support@visitormanagementsystem.com</p>
              <p><strong>Phone:</strong> +1 (555) 123-4567</p>
              <p><strong>Address:</strong> 123 Business Ave, Suite 100, City, State 12345</p>
            </div>
          </section>
        </div>
      </div>

      <HostFooter />
    </div>
  );
};

export default HostPrivacyPolicyPage;
