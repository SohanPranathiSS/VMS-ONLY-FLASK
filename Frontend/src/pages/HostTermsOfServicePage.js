import React from 'react';
import { Link } from 'react-router-dom';
import HostFooter from '../components/HostFooter';
import '../styles/HostPolicyPages.css';

const HostTermsOfServicePage = () => {
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
          <h1>Terms of Service</h1>
          <p className="last-updated">Last updated: August 5, 2025</p>

          <section>
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using the Visitor Management System, you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2>2. Service Description</h2>
            <p>
              The Visitor Management System provides a digital platform for managing visitor check-ins, 
              host notifications, and maintaining visitor records for organizations.
            </p>
            <h3>Key Features Include:</h3>
            <ul>
              <li>Digital visitor registration and check-in/out</li>
              <li>Host notification system</li>
              <li>Visitor badge printing and photo capture</li>
              <li>Access control and security monitoring</li>
              <li>Reporting and analytics dashboard</li>
            </ul>
          </section>

          <section>
            <h2>3. User Responsibilities</h2>
            <h3>Hosts:</h3>
            <ul>
              <li>Provide accurate information during registration</li>
              <li>Maintain confidentiality of login credentials</li>
              <li>Promptly check out visitors upon departure</li>
              <li>Report any security concerns immediately</li>
            </ul>
            <h3>Visitors:</h3>
            <ul>
              <li>Provide truthful and complete information</li>
              <li>Follow all facility security policies</li>
              <li>Wear visitor badges at all times</li>
              <li>Check out before leaving the premises</li>
            </ul>
          </section>

          <section>
            <h2>4. Prohibited Activities</h2>
            <p>Users may not:</p>
            <ul>
              <li>Access areas without proper authorization</li>
              <li>Share login credentials with unauthorized persons</li>
              <li>Attempt to circumvent security measures</li>
              <li>Use the system for any illegal or harmful activities</li>
              <li>Interfere with system operations or other users</li>
            </ul>
          </section>

          <section>
            <h2>5. Privacy and Data Protection</h2>
            <p>
              We are committed to protecting your privacy. Please review our Privacy Policy to understand 
              how we collect, use, and protect your information.
            </p>
          </section>

          <section>
            <h2>6. System Availability</h2>
            <p>
              While we strive to maintain 99.9% uptime, we cannot guarantee uninterrupted service. 
              Scheduled maintenance will be announced in advance when possible.
            </p>
          </section>

          <section>
            <h2>7. Limitation of Liability</h2>
            <p>
              The Visitor Management System is provided "as is" without warranties. We are not liable 
              for any damages arising from system use, including but not limited to data loss, 
              security breaches, or service interruptions.
            </p>
          </section>

          <section>
            <h2>8. Termination</h2>
            <p>
              We reserve the right to terminate or suspend access to the system for violations of 
              these terms or for any reason deemed necessary for security or compliance.
            </p>
          </section>

          <section>
            <h2>9. Changes to Terms</h2>
            <p>
              We may update these Terms of Service periodically. Continued use of the system 
              constitutes acceptance of any changes.
            </p>
          </section>

          <section>
            <h2>10. Contact Information</h2>
            <div className="contact-info">
              <p><strong>Legal Department:</strong> legal@visitormanagementsystem.com</p>
              <p><strong>Customer Support:</strong> support@visitormanagementsystem.com</p>
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

export default HostTermsOfServicePage;
