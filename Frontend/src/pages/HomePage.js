import React from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import '../styles/HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const handleBookDemo = () => {
    navigate('/bookademo');
  };

  const handleFreeTrial = () => {
    navigate('/register');
  };

  return (
    <div className="home-container">
      <Navbar 
        showAuthButtons={true}
        showMainLinks={true}
        isLoggedIn={false}
      />
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-left">
            <p className="hero-subtitle">THE WORKPLACE PLATFORM FOR TECHNOLOGY COMPANIES </p>
            <h1 className="hero-title">Connect the dots<br />between your workforce and workplace</h1>
            <p className="hero-desc">Discover opportunities to cut costs and boost employee productivity—without sacrificing your security.</p>
            <button className="hero-cta" onClick={handleBookDemo}>Book a demo</button>
            <div className="hero-contact">
              <span>Talk to our sales team. </span>
              <a href="/contactus" className="contact-link">Contact us</a>
            </div>
          </div>
          <div className="hero-right">
            {/* Illustration placeholder, replace src with your SVG or image */}
            <img src="https://cdn.prod.website-files.com/64820bb890b5d776bb0c9faf/6509af0d0d50db5e1c359ca0_connect-the-dots.png" alt="Workplace Illustration" className="hero-illustration" />
          </div>
        </div>
        <div className="hero-logos">
          <img src="https://cdn.prod.website-files.com/64820bb890b5d776bb0c9faf/65098265b58c77281271ac6a_hulu.svg" alt="hulu" />
          <img src="https://cdn.prod.website-files.com/64820bb890b5d776bb0c9faf/650982631882b4cb7fac91ff_American%20Eagle.svg" alt="American Eagle" />
          <img src="https://cdn.prod.website-files.com/64820bb890b5d776bb0c9faf/650982627288de27c17f3063_Stripe.svg" alt="stripe" />
          <img src="https://cdn.prod.website-files.com/64820bb890b5d776bb0c9faf/65098263ae29f27a60d68bd7_Pinterest.svg" alt="Pinterest" />
          <img src="https://cdn.prod.website-files.com/64820bb890b5d776bb0c9faf/65098263ffea4dbff81b0e9f_l%27Oreal.svg" alt="LOREAL" />
        </div>
      </section>
      <section className="overview-section">
        <h2>What is the Visitor Management System?</h2>
        <div className="overview-section-content">
          <div className="overview-icon">
            {/* Modern visitor icon SVG */}
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="24" cy="24" r="24" fill="currentColor" opacity="0.13"/>
              <path d="M24 26c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7 3.582 7 8 7zm0 3c-5.33 0-16 2.668-16 8v3h32v-3c0-5.332-10.67-8-16-8z" fill="currentColor"/>
            </svg>
          </div>
          <div className="overview-text">
            <p>
              Our Visitor Management System is a <strong>secure, efficient, and user-friendly platform</strong> that streamlines the check-in/check-out process for visitors, employees, and contractors.<br /><br />
              Designed for organizations of all sizes, it improves workplace safety, automates guest interactions, and provides a seamless experience from registration to departure.
            </p>
          </div>
        </div>
      </section>

<section className="features-section">
  <h2>Key Features</h2>
  <div className="features-grid">
    <div className="feature-card">
      <h3>Real-time Check-In/Out</h3>
      <p>Track visitor activity with accurate check-in and check-out timestamps.</p>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '1rem' }}>
        <img 
          src="/assets/CheckInOut.png" 
          alt="Visitor Check-In" 
          style={{ width: '120px', height: 'auto', borderRadius: '10px', boxShadow: '0 2px 8px rgba(44,62,80,0.08)' }}
        />
      </div>
    </div>
    <div className="feature-card">
      <h3>Photo Capture</h3>
      <p>Capture visitor photos for verification and record-keeping.</p>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '1rem' }}>
        <img 
          src="/assets/PhotoCapture.png" 
          alt="Visitor Check-In" 
          style={{ width: '120px', height: 'auto', borderRadius: '10px', boxShadow: '0 2px 8px rgba(44,62,80,0.08)' }}
        />
      </div>
    </div>
    <div className="feature-card">
      <h3>Role-based Access</h3>
      <p>Admins, Hosts, and Visitors see only what they need based on roles.</p>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '1rem' }}>
        <img 
          src="/assets/RollBasedAccess.png" 
          alt="Visitor Check-In" 
          style={{ width: '120px', height: 'auto', borderRadius: '10px', boxShadow: '0 2px 8px rgba(44,62,80,0.08)' }}
        />
      </div>
    </div>
    <div className="feature-card">
      <h3>Email & SMS Notifications</h3>
      <p>Automatically notify hosts when their visitors arrive.</p>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '1rem' }}>
        <img 
          src="/assets/EmailNotification.png" 
          alt="Visitor Check-In" 
          style={{ width: '120px', height: 'auto', borderRadius: '10px', boxShadow: '0 2px 8px rgba(44,62,80,0.08)' }}
        />
      </div>
    </div>
    <div className="feature-card">
      <h3>Data Storage</h3>
      <p>Securely store visitor logs using localStorage or a backend database.</p>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '1rem' }}>
        <img 
          src="/assets/DataStorage.png" 
          alt="Visitor Check-In" 
          style={{ width: '120px', height: 'auto', borderRadius: '10px', boxShadow: '0 2px 8px rgba(44,62,80,0.08)' }}
        />
      </div>
    </div>
  </div>
</section>
<section className="usecases-section">
  <h2>Who Is It For?</h2>
  <div className="usecases-grid">
    <div className="usecase-card">
      <h3>Corporate Offices</h3>
      <p>Manage employee guests, delivery personnel, and scheduled visitors with ease.</p>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '1rem' }}>
        <img 
          src="/assets/Corporate.png" 
          alt="Visitor Check-In" 
          style={{ width: '120px', height: 'auto', borderRadius: '10px', boxShadow: '0 2px 8px rgba(44,62,80,0.08)' }}
        />
      </div>
    </div>
    <div className="usecase-card">
      <h3>Co-Working Spaces</h3>
      <p>Automate check-in for members and guests across multiple locations.</p>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '1rem' }}>
        <img 
          src="/assets/Working.png" 
          alt="Visitor Check-In" 
          style={{ width: '120px', height: 'auto', borderRadius: '10px', boxShadow: '0 2px 8px rgba(44,62,80,0.08)' }}
        />
      </div>
    </div>
    <div className="usecase-card">
      <h3>Educational Institutions</h3>
      <p>Enhance security by tracking student, parent, and staff visitors.</p>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '1rem' }}>
        <img 
          src="/assets/Campus.png" 
          alt="Visitor Check-In" 
          style={{ width: '120px', height: 'auto', borderRadius: '10px', boxShadow: '0 2px 8px rgba(44,62,80,0.08)' }}
        />
      </div>
    </div>
    <div className="usecase-card">
      <h3>Government Buildings</h3>
      <p>Ensure authorized access and maintain visit records for compliance.</p>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '1rem' }}>
        <img 
          src="/assets/Govt.png" 
          alt="Visitor Check-In" 
          style={{ width: '120px', height: 'auto', borderRadius: '10px', boxShadow: '0 2px 8px rgba(44,62,80,0.08)' }}
        />
      </div>
    </div>
  </div>
</section>


<section className="testimonials-section">
  <h2>What Our Users Say</h2>
  <div className="testimonials-grid">
    <div className="testimonial-card">
      <div className="overview-icon">
       <img
          src="https://imageio.forbes.com/specials-images/imageserve/65ccd50c4de75918d26599cc/0x0.jpg?format=jpg&crop=813,812,x108,y0,safe&width=100"
          alt="User profile"
          className="overview-image"
        />
      </div>
      <p>&ldquo;This Visitor Management System has streamlined the way we handle Visitor check-ins and scheduling. Its precision, security, and ease of use make it an essential tool for our organization&rdquo;</p>
      <strong>- Praveen Andapalli</strong>
      <i>SPG CEO at Vitel Global & Varun Digital Media</i>
    </div>

    <div className="testimonial-card">
      <div className="overview-icon">
        <img
          src="https://media.licdn.com/dms/image/v2/D5603AQGFfRgUGks88Q/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1707503275609?e=1755734400&v=beta&t=g6EgQiCZnz9YqsfzaX2e3ktG9ivyZ04gnSGboGWo-Fw"
          alt="User profile"
          className="overview-image"
        />
      </div>
      <p>&ldquo;As CTO of Pranthsis, I rely on our Visitor Management System for seamless client demos and internal syncs. It’s reliable, secure, and incredibly easy to use.&rdquo;</p>
      <strong>- Shatru Naik</strong>
      <i>CTO at Pranthsis</i>
    </div>

    <div className="testimonial-card">
      <div className="overview-icon">
        <img
          src="https://bharatpayroll.s3.amazonaws.com/public/pss_bharatpayroll_db/employee_images/Sridhar_Sir_9jfm2u3y5q.PNG"
          alt="User profile"
          className="overview-image"
        />
      </div>
      <p>&ldquo;Our organization relies on the Visitor Management System to coordinate high-level meetings. Its smart automation and seamless integrations have significantly boosted our productivity.&rdquo;</p>
      <strong>- Ambati Sridhar</strong>
      <i>Varun Digital Media Director at VitelGlobal Communications Pvt Ltd</i>
    </div>
  </div>
</section>

<section className="cta-section">
  <h2>Ready to Modernize Your Front Desk?</h2>
  <p>Start your free trial or schedule a demo today to experience the power of a smart visitor management system.</p>
  <div className="cta-buttons">
    <button className="hero-cta" onClick={handleFreeTrial}>Start Your Free Trial</button>
    <button className="hero-cta secondary" onClick={handleBookDemo}>Book a Demo</button>
  </div>
</section>

<Footer />

    </div>
  );
};

export default HomePage;
