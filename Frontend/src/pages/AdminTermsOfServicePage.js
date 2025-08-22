import React from 'react';
import { Link } from 'react-router-dom';
import AdminFooter from '../components/AdminFooter';
import '../styles/AdminPolicyPages.css';

const AdminTermsOfServicePage = () => {
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
          <h1>Terms of Service</h1>
          <p className="last-updated">Last updated: August 5, 2025</p>

          <section>
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using the Visitor Management System ("Service"), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Service.
            </p>
          </section>

          <section>
            <h2>2. Service Description</h2>
            <p>
              The Visitor Management System is a comprehensive platform designed to:
            </p>
            <ul>
              <li>Manage visitor registration and check-in/check-out processes</li>
              <li>Generate visitor badges and access credentials</li>
              <li>Track visitor movements and maintain security logs</li>
              <li>Provide reporting and analytics capabilities</li>
              <li>Ensure compliance with security protocols</li>
            </ul>
          </section>

          <section>
            <h2>3. User Responsibilities</h2>
            <h3>3.1 Administrator Responsibilities</h3>
            <ul>
              <li>Maintain accurate system configuration and user permissions</li>
              <li>Ensure proper training of staff members using the system</li>
              <li>Regularly review and update security protocols</li>
              <li>Comply with data protection and privacy regulations</li>
              <li>Report security incidents promptly</li>
            </ul>

            <h3>3.2 Host Responsibilities</h3>
            <ul>
              <li>Verify visitor identity and purpose of visit</li>
              <li>Escort visitors as required by security protocols</li>
              <li>Ensure proper check-out procedures are followed</li>
              <li>Report any suspicious activities or security concerns</li>
            </ul>

            <h3>3.3 Visitor Responsibilities</h3>
            <ul>
              <li>Provide accurate and truthful information during registration</li>
              <li>Follow all facility rules and security procedures</li>
              <li>Wear visitor badges at all times while on premises</li>
              <li>Complete check-out procedures before leaving</li>
            </ul>
          </section>

          <section>
            <h2>4. Account Security</h2>
            <p>
              Users are responsible for maintaining the security of their accounts:
            </p>
            <ul>
              <li>Use strong, unique passwords</li>
              <li>Do not share login credentials</li>
              <li>Log out properly after each session</li>
              <li>Report suspected unauthorized access immediately</li>
              <li>Keep contact information current</li>
            </ul>
          </section>

          <section>
            <h2>5. Prohibited Activities</h2>
            <p>
              The following activities are strictly prohibited:
            </p>
            <ul>
              <li>Attempting to bypass security measures</li>
              <li>Accessing data without proper authorization</li>
              <li>Interfering with system operations</li>
              <li>Using the system for illegal activities</li>
              <li>Sharing confidential information inappropriately</li>
              <li>Reverse engineering or copying system components</li>
            </ul>
          </section>

          <section>
            <h2>6. Data Protection and Privacy</h2>
            <p>
              We are committed to protecting user data:
            </p>
            <ul>
              <li>Personal data is collected and processed in accordance with our Privacy Policy</li>
              <li>Security measures are implemented to protect data integrity</li>
              <li>Access to data is restricted to authorized personnel only</li>
              <li>Data retention policies are strictly followed</li>
            </ul>
          </section>

          <section>
            <h2>7. System Availability</h2>
            <p>
              While we strive for maximum uptime, we cannot guarantee:
            </p>
            <ul>
              <li>Uninterrupted access to the system</li>
              <li>Error-free operation at all times</li>
              <li>Compatibility with all devices or browsers</li>
            </ul>
            <p>
              Scheduled maintenance will be communicated in advance when possible.
            </p>
          </section>

          <section>
            <h2>8. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law:
            </p>
            <ul>
              <li>We are not liable for indirect, incidental, or consequential damages</li>
              <li>Our total liability is limited to the amount paid for the service</li>
              <li>We are not responsible for third-party actions or data breaches beyond our control</li>
              <li>Users assume responsibility for their use of the system</li>
            </ul>
          </section>

          <section>
            <h2>9. Intellectual Property</h2>
            <p>
              The Visitor Management System and its contents are protected by intellectual property laws:
            </p>
            <ul>
              <li>All software, designs, and documentation are proprietary</li>
              <li>Users receive a limited license to use the system</li>
              <li>Unauthorized copying or distribution is prohibited</li>
              <li>User-generated content remains the property of the user</li>
            </ul>
          </section>

          <section>
            <h2>10. Termination</h2>
            <p>
              These terms remain in effect until terminated:
            </p>
            <ul>
              <li>Either party may terminate the agreement with notice</li>
              <li>We may suspend access for violations of these terms</li>
              <li>Upon termination, user access will be revoked</li>
              <li>Data export options may be available before termination</li>
            </ul>
          </section>

          <section>
            <h2>11. Compliance and Legal Requirements</h2>
            <p>
              Users must comply with:
            </p>
            <ul>
              <li>Local, state, and federal laws</li>
              <li>Industry-specific regulations</li>
              <li>Data protection and privacy laws</li>
              <li>Security and safety protocols</li>
            </ul>
          </section>

          <section>
            <h2>12. Updates and Modifications</h2>
            <p>
              We reserve the right to:
            </p>
            <ul>
              <li>Update the system with new features or security patches</li>
              <li>Modify these terms with appropriate notice</li>
              <li>Change pricing or service levels</li>
              <li>Discontinue features that are no longer supported</li>
            </ul>
          </section>

          <section>
            <h2>13. Dispute Resolution</h2>
            <p>
              Any disputes arising from these terms will be:
            </p>
            <ul>
              <li>First addressed through good faith negotiation</li>
              <li>Subject to binding arbitration if necessary</li>
              <li>Governed by the laws of the jurisdiction where the service is provided</li>
            </ul>
          </section>

          <section>
            <h2>14. Contact Information</h2>
            <p>
              For questions about these Terms of Service, contact:
            </p>
            <div className="contact-info">
              <p><strong>Legal Department</strong></p>
              <p>Email: legal@visitormanagementsystem.com</p>
              <p>Phone: +1 (555) 123-4567</p>
              <p>Address: 123 Security Lane, Tech City, TC 12345</p>
            </div>
          </section>

          <section>
            <h2>15. Severability</h2>
            <p>
              If any provision of these terms is found to be unenforceable, the remaining provisions will continue in full force and effect.
            </p>
          </section>
        </div>
      </div>

      <AdminFooter />
    </div>
  );
};

export default AdminTermsOfServicePage;
