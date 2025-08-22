
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/ProductPage.css';

const ProductPage = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const productDetails = {
    vms: {
      title: "Visitor Management System (VMS)",
      features: [
        "Real-time visitor check-in and check-out tracking",
        "Photo capture and ID card scanning for enhanced security",
        "QR code generation for pre-registered visitors",
        "Role-based access control (Admin, Host, Visitor dashboards)",
        "Automated email and SMS notifications to hosts",
        "Comprehensive visitor analytics and reporting",
        "Blacklist management for enhanced security",
        "Multi-company support with data isolation",
        "Mobile-responsive design for all devices",
        "Export capabilities for visitor logs and reports"
      ],
      benefits: [
        "Enhanced security and visitor tracking",
        "Streamlined visitor experience",
        "Improved operational efficiency",
        "Compliance with security regulations",
        "Real-time insights and analytics"
      ],
      pricing: "Starting from $99/month"
    },
    crm: {
      title: "Customer Relationship Management (CRM)",
      features: [
        "Contact and lead management with detailed profiles",
        "Sales pipeline tracking and opportunity management",
        "Email marketing automation and campaign management",
        "Customer interaction history and communication logs",
        "Advanced analytics and sales forecasting",
        "Integration with popular business tools",
        "Custom fields and workflow automation",
        "Mobile CRM app for on-the-go access",
        "Team collaboration and task management",
        "Customer segmentation and targeting"
      ],
      benefits: [
        "Increased sales conversion rates",
        "Better customer relationship management",
        "Automated marketing processes",
        "Data-driven decision making",
        "Improved team productivity"
      ],
      pricing: "Starting from $49/month per user"
    },
    ai: {
      title: "AI Agents",
      features: [
        "24/7 intelligent customer support automation",
        "Natural language processing for human-like conversations",
        "Multi-channel support (web, mobile, social media)",
        "Learning from interactions to improve responses",
        "Integration with existing helpdesk systems",
        "Customizable AI personality and responses",
        "Advanced sentiment analysis and escalation",
        "Multi-language support for global customers",
        "Real-time human handoff when needed",
        "Comprehensive analytics and performance metrics"
      ],
      benefits: [
        "Reduced customer support costs by 60%",
        "Instant response to customer queries",
        "Improved customer satisfaction scores",
        "24/7 availability without human intervention",
        "Scalable support for growing businesses"
      ],
      pricing: "Starting from $199/month"
    },
    rag: {
      title: "Retrieval Augmented Generation (RAG)",
      features: [
        "Intelligent document analysis and indexing",
        "Contextual question answering from knowledge base",
        "Real-time information retrieval and synthesis",
        "Support for multiple document formats (PDF, Word, etc.)",
        "Semantic search capabilities across large datasets",
        "Custom knowledge base creation and management",
        "API integration for third-party applications",
        "Multi-language document processing",
        "Version control for knowledge base updates",
        "Advanced security and access controls"
      ],
      benefits: [
        "Instant access to relevant information",
        "Improved decision-making with accurate data",
        "Reduced time spent searching for information",
        "Enhanced knowledge management processes",
        "Scalable solution for growing data needs"
      ],
      pricing: "Starting from $299/month"
    }
  };

  const handleCardClick = (productKey) => {
    setSelectedProduct(productKey);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedProduct(null);
  };

  return (
    
    <div className="product-container">
      <Navbar showAuthButtons={true} />

      {/* Hero Section */}
      <header className="product-hero">
        <div className="product-hero-content">
          <h1 className="product-hero-title">Our Products</h1>
          <p className="product-hero-desc">Discover our comprehensive suite of business solutions and AI-powered tools.</p>
        </div>
      </header>

      {/* Products Section */}
      <section className="product-features-section">
        <div className="product-features-grid">
          <div className="product-feature-card" onClick={() => handleCardClick('vms')}>
            <div className="product-feature-icon">
              <svg width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="20" fill="#007bff" opacity="0.13"/><path d="M20 8c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12S26.627 8 20 8zm0 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S10 25.523 10 20 14.477 10 20 10zm-3 7v6l5-3-5-3z" fill="#007bff"/></svg>
            </div>
            <h2>Visitor Management System (VMS)</h2>
            <p>Complete visitor tracking solution with real-time check-in/out, photo capture, QR code scanning, role-based dashboards, automated notifications, and comprehensive reporting for enhanced security and seamless visitor experience.</p>
            <div className="card-click-hint">Click to learn more</div>
          </div>
          
          <div className="product-feature-card" onClick={() => handleCardClick('crm')}>
            <div className="product-feature-icon">
              <svg width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="20" fill="#28a745" opacity="0.13"/><path d="M16 16c0-2.209 1.791-4 4-4s4 1.791 4 4-1.791 4-4 4-4-1.791-4-4zm8 0c0-2.209 1.791-4 4-4s4 1.791 4 4-1.791 4-4 4-4-1.791-4-4zm-16 0c0-2.209 1.791-4 4-4s4 1.791 4 4-1.791 4-4 4-4-1.791-4-4z" fill="#28a745"/></svg>
            </div>
            <h2>Customer Relationship Management (CRM)</h2>
            <p>Powerful CRM platform to manage customer interactions, track sales pipelines, automate marketing campaigns, analyze customer behavior, and drive business growth with comprehensive customer data management and analytics.</p>
            <div className="card-click-hint">Click to learn more</div>
          </div>
          
          <div className="product-feature-card" onClick={() => handleCardClick('ai')}>
            <div className="product-feature-icon">
              <svg width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="20" fill="#ffc107" opacity="0.13"/><path d="M20 6c-7.732 0-14 6.268-14 14s6.268 14 14 14 14-6.268 14-14S27.732 6 20 6zm0 2c6.627 0 12 5.373 12 12s-5.373 12-12 12S8 26.627 8 20 13.373 8 20 8zm-2 6v8h4v-8h-4z" fill="#ffc107"/></svg>
            </div>
            <h2>AI Agents</h2>
            <p>Intelligent AI-powered virtual assistants that automate customer support, handle routine inquiries, provide 24/7 assistance, learn from interactions, and seamlessly integrate with existing systems to enhance productivity and customer satisfaction.</p>
            <div className="card-click-hint">Click to learn more</div>
          </div>
          
          <div className="product-feature-card" onClick={() => handleCardClick('rag')}>
            <div className="product-feature-icon">
              <svg width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="20" fill="#17a2b8" opacity="0.13"/><path d="M12 6v2h16V6H12zm4 4v2h8v-2h-8zm-2 4v2h12v-2H14zm-2 4v2h16v-2H12zm2 4v2h12v-2h-12z" fill="#17a2b8"/></svg>
            </div>
            <h2>Retrieval Augmented Generation (RAG)</h2>
            <p>Advanced AI system that combines information retrieval with generative AI to provide accurate, contextual responses. Perfect for knowledge management, document analysis, intelligent search, and creating dynamic content from your data sources.</p>
            <div className="card-click-hint">Click to learn more</div>
          </div>
        </div>
      </section>

      {/* Product Details Modal */}
      {showModal && selectedProduct && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{productDetails[selectedProduct].title}</h2>
              <button className="modal-close" onClick={closeModal}>
                <svg width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="product-section">
                <h3>Key Features</h3>
                <ul>
                  {productDetails[selectedProduct].features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
              <div className="product-section">
                <h3>Benefits</h3>
                <ul>
                  {productDetails[selectedProduct].benefits.map((benefit, index) => (
                    <li key={index}>{benefit}</li>
                  ))}
                </ul>
              </div>
              <div className="product-section">
                <h3>Pricing</h3>
                <p className="pricing">{productDetails[selectedProduct].pricing}</p>
              </div>
              <div className="modal-actions">
                <button className="btn-demo" onClick={() => window.location.href = '/bookademo'}>
                  Book a Demo
                </button>
                <button className="btn-contact" onClick={() => window.location.href = '/contactus'}>
                  Contact Sales
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
};

export default ProductPage;
