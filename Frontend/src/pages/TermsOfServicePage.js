import React from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import '../styles/TermsOfServicePage.css';

const TermsOfServicePage = () => {
  return (
    <div className="terms-container">
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
      <header className="terms-hero">
        <div className="terms-hero-content">
          <h1 className="terms-hero-title">Terms of Service</h1>
          <p className="terms-hero-desc">Please read these terms carefully before using our Visitor Management System.</p>
          {/* <p className="last-updated">Last updated: August 4, 2025</p> */}
        </div>
      </header>

      {/* Terms Content */}
      <section className="terms-content">
        <div className="terms-container-inner">

          <div className="terms-section">
            <h2>1. Acceptance of Terms</h2>
            <p>By accessing and using the Visitor Management System ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.</p>
          </div>

          <div className="terms-section">
            <h2>2. Description of Service</h2>
            <p>Our Visitor Management System is a cloud-based software solution that enables organizations to:</p>
            <ul>
              <li>Register and check-in visitors electronically</li>
              <li>Capture visitor photos and information</li>
              <li>Generate visitor badges and notifications</li>
              <li>Maintain security logs and records</li>
              <li>Manage host notifications and communications</li>
              <li>Generate reports and analytics</li>
            </ul>
          </div>

          <div className="terms-section">
            <h2>3. User Accounts and Registration</h2>
            <h3>Account Creation</h3>
            <p>To use certain features of the Service, you must register for an account. You agree to:</p>
            <ul>
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and update your account information</li>
              <li>Maintain the security of your password</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>

            <h3>Account Types</h3>
            <p>We offer different account types with varying access levels:</p>
            <ul>
              <li><strong>System Admin:</strong> Full system administration privileges</li>
              <li><strong>Admin:</strong> Organization-level administration</li>
              <li><strong>Host:</strong> Limited to managing own visitors</li>
              <li><strong>Visitor:</strong> Check-in and check-out capabilities</li>
            </ul>
          </div>

          <div className="terms-section">
            <h2>4. Acceptable Use Policy</h2>
            <p>You agree not to use the Service to:</p>
            <ul>
              <li>Violate any laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Transmit harmful or malicious code</li>
              <li>Attempt unauthorized access to our systems</li>
              <li>Interfere with the proper functioning of the Service</li>
              <li>Use the Service for any illegal or unauthorized purpose</li>
              <li>Harass, abuse, or harm others</li>
              <li>Collect personal information without consent</li>
            </ul>
          </div>

          <div className="terms-section">
            <h2>5. Data and Privacy</h2>
            <h3>Your Data</h3>
            <p>You retain ownership of all data you input into the Service. We act as a data processor and will:</p>
            <ul>
              <li>Process data only as instructed by you</li>
              <li>Implement appropriate security measures</li>
              <li>Not use your data for our own purposes</li>
              <li>Return or delete data upon termination</li>
            </ul>

            <h3>Data Protection</h3>
            <p>We comply with applicable data protection laws including GDPR, CCPA, and other regional regulations. See our <Link to="/privacy">Privacy Policy</Link> for detailed information.</p>
          </div>

          <div className="terms-section">
            <h2>6. Service Availability and Support</h2>
            <h3>Uptime</h3>
            <p>We strive to maintain 99.9% uptime but do not guarantee uninterrupted service. Scheduled maintenance will be announced in advance.</p>

            <h3>Support</h3>
            <p>We provide technical support during business hours (9 AM - 6 PM EST, Monday-Friday). Premium support options are available for enterprise customers.</p>
          </div>

          <div className="terms-section">
            <h2>7. Fees and Payment</h2>
            <h3>Subscription Fees</h3>
            <p>Use of the Service requires payment of subscription fees as outlined in your service agreement. Fees are:</p>
            <ul>
              <li>Billed monthly or annually as selected</li>
              <li>Due in advance of service period</li>
              <li>Non-refundable except as required by law</li>
              <li>Subject to change with 30 days notice</li>
            </ul>

            <h3>Late Payment</h3>
            <p>Accounts with overdue payments may be suspended until payment is received. A late fee may be applied to overdue accounts.</p>
          </div>

          <div className="terms-section">
            <h2>8. Intellectual Property</h2>
            <h3>Our Rights</h3>
            <p>The Service and its original content, features, and functionality are owned by us and are protected by copyright, trademark, and other laws.</p>

            <h3>License Grant</h3>
            <p>We grant you a limited, non-exclusive, non-transferable license to use the Service in accordance with these Terms.</p>

            <h3>Restrictions</h3>
            <p>You may not:</p>
            <ul>
              <li>Copy, modify, or create derivative works</li>
              <li>Reverse engineer or decompile the Service</li>
              <li>Remove proprietary notices or labels</li>
              <li>Use our trademarks without permission</li>
            </ul>
          </div>

          <div className="terms-section">
            <h2>9. Termination</h2>
            <h3>Termination by You</h3>
            <p>You may terminate your account at any time by contacting us. Upon termination:</p>
            <ul>
              <li>Your access to the Service will cease</li>
              <li>Your data will be retained for 30 days for recovery</li>
              <li>After 30 days, your data will be permanently deleted</li>
            </ul>

            <h3>Termination by Us</h3>
            <p>We may terminate or suspend your account if you:</p>
            <ul>
              <li>Violate these Terms of Service</li>
              <li>Fail to pay fees when due</li>
              <li>Engage in prohibited activities</li>
              <li>Pose a security risk</li>
            </ul>
          </div>

          <div className="terms-section">
            <h2>10. Disclaimers and Limitations</h2>
            <h3>Service Disclaimer</h3>
            <p>The Service is provided "as is" without warranties of any kind, either express or implied, including but not limited to:</p>
            <ul>
              <li>Implied warranties of merchantability</li>
              <li>Fitness for a particular purpose</li>
              <li>Non-infringement</li>
              <li>Uninterrupted or error-free operation</li>
            </ul>

            <h3>Limitation of Liability</h3>
            <p>Our liability for damages is limited to the amount paid by you for the Service in the 12 months preceding the claim. We are not liable for:</p>
            <ul>
              <li>Indirect, incidental, or consequential damages</li>
              <li>Loss of profits, data, or business opportunities</li>
              <li>Damages resulting from third-party actions</li>
              <li>Force majeure events</li>
            </ul>
          </div>

          <div className="terms-section">
            <h2>11. Indemnification</h2>
            <p>You agree to indemnify and hold us harmless from claims arising from:</p>
            <ul>
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any rights of another</li>
              <li>Content you submit to the Service</li>
            </ul>
          </div>

          <div className="terms-section">
            <h2>12. Governing Law and Disputes</h2>
            <h3>Governing Law</h3>
            <p>These Terms are governed by the laws of the State of California, without regard to conflict of law principles.</p>

            <h3>Dispute Resolution</h3>
            <p>Disputes will be resolved through binding arbitration in accordance with the rules of the American Arbitration Association, except that either party may seek injunctive relief in court.</p>
          </div>

          <div className="terms-section">
            <h2>13. Changes to Terms</h2>
            <p>We may modify these Terms at any time. We will notify you of material changes by:</p>
            <ul>
              <li>Posting updated Terms on our website</li>
              <li>Sending email notification to your registered address</li>
              <li>Displaying notices within the Service</li>
            </ul>
            <p>Continued use of the Service after changes constitutes acceptance of the new Terms.</p>
          </div>

          <div className="terms-section">
            <h2>14. Contact Information</h2>
            <p>For questions about these Terms of Service, please contact us:</p>
            <div className="contact-info">
              <p><strong>Email:</strong> <a href="mailto:apps@pranathiss.com">apps@pranathiss.com</a></p>
              {/* <p><strong>Phone:</strong> +1 (800) 123-4567</p> */}
              <p><strong>Address:</strong> 15 Corporate Pl S #421,
              Piscataway, NJ 08854, United States.</p>
            </div>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TermsOfServicePage;
