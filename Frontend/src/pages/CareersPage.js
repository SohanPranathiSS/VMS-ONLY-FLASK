import React from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import '../styles/CareersPage.css';

const CareersPage = () => {
  const jobOpenings = [
    {
      title: "Full Stack Developer",
      department: "Engineering",
      location: "Remote / San Francisco, CA",
      type: "Full-time",
      description: "Join our engineering team to build and enhance our visitor management platform using React, Node.js, and modern web technologies."
    },
    {
      title: "Product Manager",
      department: "Product",
      location: "New York, NY",
      type: "Full-time",
      description: "Lead product strategy and roadmap for our visitor management solutions. Work closely with engineering and design teams."
    },
    {
      title: "UI/UX Designer",
      department: "Design",
      location: "Remote / Los Angeles, CA",
      type: "Full-time",
      description: "Design intuitive and beautiful user experiences for our visitor management platform. Experience with enterprise software preferred."
    },
    {
      title: "Sales Representative",
      department: "Sales",
      location: "Chicago, IL",
      type: "Full-time",
      description: "Drive new business growth by selling our visitor management solutions to enterprise clients. Previous SaaS sales experience required."
    },
    {
      title: "Customer Success Manager",
      department: "Customer Success",
      location: "Remote",
      type: "Full-time",
      description: "Ensure customer satisfaction and drive adoption of our platform. Help customers achieve their visitor management goals."
    },
    {
      title: "DevOps Engineer",
      department: "Engineering",
      location: "Austin, TX",
      type: "Full-time",
      description: "Manage and scale our cloud infrastructure. Experience with AWS, Docker, and Kubernetes preferred."
    }
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
        <div className="navbar-logo">Visitor Management</div>
        <ul className="navbar-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/products">Products</Link></li>
          <li><Link to="/resources">Resources</Link></li>
          <li><Link to="/aboutus">About Us</Link></li>
          <li><Link to="/bookademo">Book a Demo</Link></li>
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
                <button className="apply-btn">Apply Now</button>
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
              <p>Submit your application through our job portal or send your resume to careers@visitormanagement.com</p>
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
            <p>Email us at: <a href="mailto:careers@visitormanagement.com">careers@visitormanagement.com</a></p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CareersPage;
