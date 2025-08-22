import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import '../styles/CareersPage.css';

const CareersPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    experience: '',
    message: '',
    resume: null
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      resume: e.target.files[0]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Just log the data - not storing in database as requested
    console.log('Application submitted:', formData);
    alert('Thank you for your application! We will review it and get back to you soon.');
    
    // Reset form and close modal
    setFormData({
      name: '',
      email: '',
      phone: '',
      experience: '',
      message: '',
      resume: null
    });
    setIsModalOpen(false);
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };
  const jobOpenings = [
    {
      title: "Prompt Engineer Internship",
      department: "Engineering",
      location: "Hyderabad, Telangana",
      type: "Full-time",
      description: "Basic understanding of Generative AI concepts (ChatGPT, text-to-image, etc.)"
    },
    {
      title: "Sr. Python Developer",
      department: "Product",
      location: "Noida, Uttarpradesh",
      type: "Full-time",
      description: "Design database schemas or worked on large database schema projects."
    },
    {
      title: "Sr. Data Scientist",
      department: "Engineering",
      location: "yderabad, Telangana",
      type: "Full-time",
      description: "Strong experience in developing and deploying ML/DL models. NLP: Expertise in working with NLP frameworks such as Hugging Face Transformers, SpaCy, NLTK, etc."
    },
    
  ];

  const benefits = [
    {
      title: "Competitive Salary",
      description: "We offer competitive compensation packages with equity options for all employees."
    },
    {
      title: "Health & Wellness",
      description: "Comprehensive health, dental, and vision insurance. Mental health support and wellness programs."
    },
    {
      title: "Flexible Work",
      description: "Remote-first culture with flexible working hours. Work from anywhere in the world."
    },
    {
      title: "Professional Development",
      description: "Annual learning budget, conference attendance, and mentorship programs to grow your career."
    },
    {
      title: "Time Off",
      description: "Unlimited PTO policy and company-wide holiday breaks. Work-life balance is important to us."
    },
    {
      title: "Great Team",
      description: "Join a diverse, inclusive, and collaborative team of passionate professionals."
    }
  ];

  return (
    <div className="careers-container">
      <nav className="navbar">
        <div className="navbar-logo">
          <img src="/assets/CompanyLogo5.png" alt="Visitor Management" className="logo-image" style={{ height: '40px', width: 'auto' }} />
        </div>
        <ul className="navbar-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/products">Products</Link></li>
          <li><Link to="/resources">Resources</Link></li>
          <li><Link to="/aboutus">About Us</Link></li>
          <li><Link to="/bookademo">Book a Demo</Link></li>
          <li><Link to="/pricing">Pricing</Link></li>
          <li><Link to="/contactus">Contact Us</Link></li>
          <li><Link to="/register" className="register-btn">Registration</Link></li>
          <li><Link to="/login" className="login-btn">Login</Link></li>
        </ul>
      </nav>

      {/* Hero Section */}
      <header className="careers-hero">
        <div className="careers-hero-content">
          <h1 className="careers-hero-title">Join Our Team</h1>
          <p className="careers-hero-desc">Help us build the future of visitor management. Join a team of passionate innovators creating secure, smart, and seamless solutions.</p>
        </div>
      </header>

      {/* Company Culture Section */}
      <section className="careers-culture">
        <div className="careers-container-inner">
          <h2>Why Work With Us?</h2>
          <p className="culture-intro">We're building more than just software – we're creating solutions that make workplaces safer and more efficient. Our team values innovation, collaboration, and making a real impact.</p>
          
          <div className="benefits-grid">
            {benefits.map((benefit, index) => (
              <div key={index} className="benefit-card">
                <h3>{benefit.title}</h3>
                <p>{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Job Openings Section */}
      <section className="careers-jobs">
        <div className="careers-container-inner">
          <h2>Current Openings</h2>
          <div className="jobs-list">
            {jobOpenings.map((job, index) => (
              <div key={index} className="job-card">
                <div className="job-header">
                  <h3>{job.title}</h3>
                  <span className="job-type">{job.type}</span>
                </div>
                <div className="job-meta">
                  <span className="job-department">{job.department}</span>
                  <span className="job-location">{job.location}</span>
                </div>
                <p className="job-description">{job.description}</p>
                <button className="apply-btn" onClick={openModal}>Apply Now</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Process Section */}
      <section className="careers-process">
        <div className="careers-container-inner">
          <h2>Our Hiring Process</h2>
          <div className="process-steps">
            <div className="process-step">
              <div className="step-number">1</div>
              <h4>Apply</h4>
              <p>Submit your application through our job portal or send your resume to apps@pranathiss.com</p>
            </div>
            <div className="process-step">
              <div className="step-number">2</div>
              <h4>Initial Screen</h4>
              <p>Our HR team will review your application and conduct an initial phone/video screening</p>
            </div>
            <div className="process-step">
              <div className="step-number">3</div>
              <h4>Technical Interview</h4>
              <p>For technical roles, you'll have a technical interview with our engineering team</p>
            </div>
            <div className="process-step">
              <div className="step-number">4</div>
              <h4>Team Interview</h4>
              <p>Meet with your potential team members and manager to ensure a good cultural fit</p>
            </div>
            <div className="process-step">
              <div className="step-number">5</div>
              <h4>Offer</h4>
              <p>If you're a great fit, we'll extend an offer and welcome you to the team!</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="careers-contact">
        <div className="careers-contact-content">
          <h2>Don't see the right role?</h2>
          <p>We're always looking for talented people to join our team. Send us your resume and tell us how you'd like to contribute.</p>
          <div className="careers-contact-info">
            <p>Email us at: <a href="mailto:apps@pranathiss.com">apps@pranathiss.com</a></p>
          </div>
        </div>
      </section>

      {/* Application Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-content">
                <h2>Submit Your Application</h2>
                <p>Join our team of innovative professionals</p>
              </div>
              <button className="close-btn" onClick={closeModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={handleSubmit} className="application-form">
                <div className="form-section">
                  <h3 className="section-title">Personal Information</h3>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="name">Full Name <span className="required">*</span></label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="email">Email Address <span className="required">*</span></label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="your.email@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="phone">Phone Number <span className="required">*</span></label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+1 (555) 123-4567"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="experience">Years of Experience <span className="required">*</span></label>
                      <select
                        id="experience"
                        name="experience"
                        value={formData.experience}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select experience level</option>
                        <option value="0-1">0-1 years</option>
                        <option value="2-3">2-3 years</option>
                        <option value="4-5">4-5 years</option>
                        <option value="6-8">6-8 years</option>
                        <option value="9-12">9-12 years</option>
                        <option value="13+">13+ years</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3 className="section-title">Additional Information</h3>
                  
                  <div className="form-group">
                    <label htmlFor="message">Cover Letter / Message</label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      rows="4"
                      placeholder="Tell us about your experience, skills, and why you're interested in this position..."
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="resume">Resume <span className="required">*</span></label>
                    <div className="file-upload-container">
                      <input
                        type="file"
                        id="resume"
                        name="resume"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx"
                        className="file-input"
                        required
                      />
                      <label htmlFor="resume" className="file-upload-label">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15M17 8L12 3M12 3L7 8M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>Choose File</span>
                      </label>
                      {formData.resume && (
                        <div className="file-selected">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span>{formData.resume.name}</span>
                        </div>
                      )}
                    </div>
                    <small className="file-help">Accepted formats: PDF, DOC, DOCX (Max 10MB)</small>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="cancel-btn" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Submit Application
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default CareersPage;
