import React from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import '../styles/PrivacyPolicyPage.css';

const PrivacyPolicyPage = () => {
  return (
    <div className="privacy-container">
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
      <header className="privacy-hero">
        <div className="privacy-hero-content">
          <h1 className="privacy-hero-title">Privacy Policy</h1>
          <p className="privacy-hero-desc">Your privacy is important to us. This policy explains how we collect, use, and protect your information.</p>
          {/* <p className="last-updated">Last updated: August 4, 2025</p> */}
        </div>
      </header>

      {/* Privacy Policy Content */}
      <section className="privacy-content">
        <div className="privacy-container-inner">
          
          <div className="privacy-section">
            <h2>1. Information We Collect</h2>
            <h3>Personal Information</h3>
            <p>We collect personal information that you provide directly to us, including:</p>
            <ul>
              <li>Name and contact information (email, phone number)</li>
              <li>Company and job title information</li>
              <li>Visitor photos and identification data</li>
              <li>Check-in and check-out timestamps</li>
              <li>Purpose of visit and host information</li>
            </ul>

            <h3>Automatically Collected Information</h3>
            <p>We automatically collect certain information when you use our service:</p>
            <ul>
              <li>IP addresses and device information</li>
              <li>Browser type and operating system</li>
              <li>Usage patterns and preferences</li>
              <li>Log files and system activity</li>
            </ul>
          </div>

          <div className="privacy-section">
            <h2>2. How We Use Your Information</h2>
            <p>We use the collected information for the following purposes:</p>
            <ul>
              <li><strong>Service Provision:</strong> To provide and maintain our visitor management services</li>
              <li><strong>Security:</strong> To ensure workplace security and safety</li>
              <li><strong>Communication:</strong> To send notifications and updates related to visits</li>
              <li><strong>Compliance:</strong> To comply with legal obligations and regulations</li>
              <li><strong>Improvement:</strong> To analyze and improve our services</li>
              <li><strong>Support:</strong> To provide customer support and technical assistance</li>
            </ul>
          </div>

          <div className="privacy-section">
            <h2>3. Information Sharing and Disclosure</h2>
            <p>We do not sell, trade, or rent your personal information. We may share information in the following circumstances:</p>
            <ul>
              <li><strong>With Your Consent:</strong> When you explicitly agree to the sharing</li>
              <li><strong>Service Providers:</strong> With trusted third-party service providers who assist us</li>
              <li><strong>Legal Requirements:</strong> When required by law or legal process</li>
              <li><strong>Safety and Security:</strong> To protect rights, property, or safety</li>
              <li><strong>Business Transfers:</strong> In connection with mergers or acquisitions</li>
            </ul>
          </div>

          <div className="privacy-section">
            <h2>4. Data Security</h2>
            <p>We implement appropriate security measures to protect your information:</p>
            <ul>
              <li>Encryption of data in transit and at rest</li>
              <li>Access controls and authentication mechanisms</li>
              <li>Regular security audits and assessments</li>
              <li>Employee training on data protection</li>
              <li>Secure data centers and infrastructure</li>
            </ul>
            <p>However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.</p>
          </div>

          <div className="privacy-section">
            <h2>5. Data Retention</h2>
            <p>We retain your information for as long as necessary to:</p>
            <ul>
              <li>Provide our services to you</li>
              <li>Comply with legal obligations</li>
              <li>Resolve disputes and enforce agreements</li>
              <li>Maintain security and safety records</li>
            </ul>
            <p>Visitor data is typically retained for a period of 2-7 years, depending on local regulations and customer requirements.</p>
          </div>

          <div className="privacy-section">
            <h2>6. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the following rights:</p>
            <ul>
              <li><strong>Access:</strong> Request access to your personal information</li>
              <li><strong>Correction:</strong> Request correction of inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information</li>
              <li><strong>Portability:</strong> Request transfer of your data</li>
              <li><strong>Restriction:</strong> Request restriction of processing</li>
              <li><strong>Objection:</strong> Object to certain types of processing</li>
            </ul>
            <p>To exercise these rights, please contact us at <a href="mailto:apps@pranathiss.com">apps@pranathiss.com</a></p>
          </div>

          <div className="privacy-section">
            <h2>7. Cookies and Tracking</h2>
            <p>We use cookies and similar tracking technologies to:</p>
            <ul>
              <li>Maintain user sessions and preferences</li>
              <li>Analyze usage patterns and performance</li>
              <li>Provide personalized experiences</li>
              <li>Ensure security and prevent fraud</li>
            </ul>
            <p>You can control cookie settings through your browser preferences.</p>
          </div>

          <div className="privacy-section">
            <h2>8. International Data Transfers</h2>
            <p>Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place, including:</p>
            <ul>
              <li>Adequacy decisions by relevant authorities</li>
              <li>Standard contractual clauses</li>
              <li>Certification schemes and codes of conduct</li>
            </ul>
          </div>

          <div className="privacy-section">
            <h2>9. Children's Privacy</h2>
            <p>Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware of such collection, we will delete the information immediately.</p>
          </div>

          <div className="privacy-section">
            <h2>10. Changes to This Policy</h2>
            <p>We may update this privacy policy from time to time. We will notify you of any material changes by:</p>
            <ul>
              <li>Posting the updated policy on our website</li>
              <li>Sending email notifications to registered users</li>
              <li>Displaying prominent notices in our application</li>
            </ul>
            <p>Your continued use of our services constitutes acceptance of the updated policy.</p>
          </div>

          <div className="privacy-section">
            <h2>11. Contact Us</h2>
            <p>If you have questions about this privacy policy or our privacy practices, please contact us:</p>
            <div className="contact-info">
              <p><strong>Email:</strong> <a href="mailto:apps@pranathiss.com">apps@pranathiss.com</a></p>
              {/* <p><strong>Phone:</strong> +1 (800) 123-4567</p> */}
              <p><strong>Address:</strong> 15 Corporate Pl S #421, Piscataway, NJ 08854, United States.</p>
            </div>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PrivacyPolicyPage;
