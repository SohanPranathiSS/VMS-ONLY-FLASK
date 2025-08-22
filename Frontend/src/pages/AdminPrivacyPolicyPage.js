import React from 'react';
import { Link } from 'react-router-dom';
import AdminFooter from '../components/AdminFooter';
import '../styles/AdminPolicyPages.css';

const AdminPrivacyPolicyPage = () => {
  return (
    <div className="admin-policy-page">
      <nav className="navbar">
        <div className="navbar-logo">Visitor Management</div>
        <ul className="navbar-links">
          <li><Link to="/admin-dashboard" className="back-btn">← Back to Dashboard</Link></li>
        </ul>
      </nav>

      <div className="policy-container">
        <div className="policy-content">
          <h1>Privacy Policy</h1>
          <p className="last-updated">Last updated: August 5, 2025</p>

          <section>
            <h2>1. Information We Collect</h2>
            <p>
              The Visitor Management System collects and processes the following types of information:
            </p>
            <ul>
              <li><strong>Visitor Information:</strong> Name, email address, phone number, company affiliation, purpose of visit, photo ID details, and vehicle information</li>
              <li><strong>Host Information:</strong> Employee names, departments, contact details, and access permissions</li>
              <li><strong>Visit Records:</strong> Check-in/check-out times, visit duration, locations accessed, and digital signatures</li>
              <li><strong>Security Data:</strong> CCTV footage, access logs, badge photos, and security incident reports</li>
              <li><strong>Technical Data:</strong> IP addresses, browser types, device information, and system usage logs</li>
            </ul>
          </section>

          <section>
            <h2>2. How We Use Your Information</h2>
            <p>We use collected information for the following purposes:</p>
            <ul>
              <li>Facility security and access control</li>
              <li>Visitor registration and badge generation</li>
              <li>Emergency evacuation and safety procedures</li>
              <li>Compliance with regulatory requirements</li>
              <li>Generating reports and analytics for facility management</li>
              <li>Improving system functionality and user experience</li>
            </ul>
          </section>

          <section>
            <h2>3. Data Storage and Security</h2>
            <p>
              We implement industry-standard security measures to protect your data:
            </p>
            <ul>
              <li>Encrypted data transmission using SSL/TLS protocols</li>
              <li>Secure database storage with regular backups</li>
              <li>Access controls and authentication mechanisms</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Employee training on data protection best practices</li>
            </ul>
          </section>

          <section>
            <h2>4. Data Retention</h2>
            <p>
              We retain visitor data for the following periods:
            </p>
            <ul>
              <li><strong>Visit Records:</strong> 12 months from visit date</li>
              <li><strong>Security Footage:</strong> 90 days (unless incident-related)</li>
              <li><strong>Incident Reports:</strong> 7 years for legal compliance</li>
              <li><strong>System Logs:</strong> 6 months for technical support</li>
            </ul>
          </section>

          <section>
            <h2>5. Data Sharing</h2>
            <p>
              We do not sell or rent personal information. Data may be shared only in the following circumstances:
            </p>
            <ul>
              <li>With authorized personnel for security purposes</li>
              <li>With law enforcement when legally required</li>
              <li>With emergency services during incidents</li>
              <li>With regulatory authorities for compliance audits</li>
            </ul>
          </section>

          <section>
            <h2>6. Your Rights</h2>
            <p>You have the following rights regarding your personal data:</p>
            <ul>
              <li><strong>Access:</strong> Request copies of your personal data</li>
              <li><strong>Correction:</strong> Request correction of inaccurate data</li>
              <li><strong>Deletion:</strong> Request deletion of your data (subject to legal requirements)</li>
              <li><strong>Portability:</strong> Request transfer of your data</li>
              <li><strong>Objection:</strong> Object to processing of your data</li>
            </ul>
          </section>

          <section>
            <h2>7. Cookies and Tracking</h2>
            <p>
              Our system uses essential cookies for:
            </p>
            <ul>
              <li>User authentication and session management</li>
              <li>System preferences and settings</li>
              <li>Security and fraud prevention</li>
              <li>Performance optimization</li>
            </ul>
          </section>

          <section>
            <h2>8. Third-Party Services</h2>
            <p>
              We may integrate with third-party services for:
            </p>
            <ul>
              <li>Email notifications</li>
              <li>SMS alerts</li>
              <li>Cloud storage and backups</li>
              <li>Analytics and reporting</li>
            </ul>
            <p>These services operate under their own privacy policies.</p>
          </section>

          <section>
            <h2>9. Children's Privacy</h2>
            <p>
              Our service is not intended for children under 13. We do not knowingly collect 
              personal information from children under 13 years of age.
            </p>
          </section>

          <section>
            <h2>10. Changes to Privacy Policy</h2>
            <p>
              We may update this privacy policy periodically. Changes will be posted on this page 
              with an updated revision date. Continued use of the system constitutes acceptance 
              of the updated policy.
            </p>
          </section>

          <section>
            <h2>11. Contact Information</h2>
            <p>
              For questions about this privacy policy or to exercise your rights, contact:
            </p>
            <div className="contact-info">
              <p><strong>Data Protection Officer</strong></p>
              <p>Email: privacy@visitormanagementsystem.com</p>
              <p>Phone: +1 (555) 123-4567</p>
              <p>Address: 123 Security Lane, Tech City, TC 12345</p>
            </div>
          </section>
        </div>
      </div>

      <AdminFooter />
    </div>
  );
};

export default AdminPrivacyPolicyPage;
