import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import '../styles/FAQsPage.css';

const FAQsPage = () => {
  const [openFAQ, setOpenFAQ] = useState(null);

  const faqs = [
    {
      question: "How does the visitor check-in process work?",
      answer: "Visitors can check-in through our user-friendly interface by providing their name, contact information, and the person they're visiting. The system captures their photo, prints a visitor badge, and automatically notifies the host."
    },
    {
      question: "Is my data secure?",
      answer: "Yes, absolutely. We use industry-standard encryption to protect all data. All visitor information is stored securely and we comply with major data protection regulations including GDPR and CCPA."
    },
    {
      question: "Can I customize the visitor badge design?",
      answer: "Yes, you can customize visitor badges with your company logo, colors, and specific information fields. Our system supports various badge formats and printing options."
    },
    {
      question: "How do hosts get notified when their visitors arrive?",
      answer: "Hosts receive instant notifications via email and SMS when their visitors check-in. They can also access a real-time dashboard to see all their expected and arrived visitors."
    },
    {
      question: "Can the system handle multiple locations?",
      answer: "Yes, our system supports multi-location management. You can manage visitors across different office locations from a single centralized dashboard with location-specific settings."
    },
    {
      question: "What happens if a visitor is on the blacklist?",
      answer: "If a visitor is on your security blacklist, the system will immediately alert security personnel and prevent the visitor from completing the check-in process."
    },
    {
      question: "Do you offer integration with other systems?",
      answer: "Yes, we provide RESTful APIs for seamless integration with existing security systems, HR platforms, and access control systems. Our technical team can assist with custom integrations."
    },
    {
      question: "How can I generate visitor reports?",
      answer: "You can generate comprehensive reports from the admin dashboard. Reports include visitor logs, peak visit times, frequent visitors, security incidents, and custom date range reports."
    },
    {
      question: "Is there a mobile app available?",
      answer: "Currently, our system is web-based and fully responsive, working seamlessly on all devices including tablets and smartphones. A dedicated mobile app is in development."
    },
    {
      question: "What support options are available?",
      answer: "We offer 24/7 customer support via email, phone, and live chat. Our support team includes technical specialists who can help with setup, troubleshooting, and best practices."
    },
    {
      question: "Can visitors pre-register for their visit?",
      answer: "Yes, visitors can pre-register through our online portal or via QR codes. This speeds up the check-in process and allows for better visitor management and planning."
    },
    {
      question: "How much does the system cost?",
      answer: "We offer flexible pricing plans based on your organization's size and needs. Contact our sales team for a personalized quote and to discuss which plan is best for your requirements."
    }
  ];

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <div className="faqs-container">
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
      <header className="faqs-hero">
        <div className="faqs-hero-content">
          <h1 className="faqs-hero-title">Frequently Asked Questions</h1>
          <p className="faqs-hero-desc">Find answers to common questions about our Visitor Management System.</p>
        </div>
      </header>

      {/* FAQs Section */}
      <section className="faqs-section">
        <div className="faqs-container-inner">
          <div className="faqs-list">
            {faqs.map((faq, index) => (
              <div key={index} className={`faq-item ${openFAQ === index ? 'active' : ''}`}>
                <div className="faq-question" onClick={() => toggleFAQ(index)}>
                  <h3>{faq.question}</h3>
                  <span className="faq-toggle">{openFAQ === index ? '−' : '+'}</span>
                </div>
                {openFAQ === index && (
                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="faqs-contact">
        <div className="faqs-contact-content">
          <h2>Still have questions?</h2>
          <p>Can't find the answer you're looking for? Our support team is here to help.</p>
          <div className="faqs-contact-buttons">
            <Link to="/contactus" className="hero-cta">Contact Support</Link>
            <Link to="/bookademo" className="hero-cta secondary">Book a Demo</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FAQsPage;
