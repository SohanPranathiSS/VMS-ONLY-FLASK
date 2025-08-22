import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';

const Navbar = ({ 
  showAuthButtons = true, 
  showMainLinks = true, 
  onLogout = null,
  isLoggedIn = false,
  userRole = null,
  showOnlyLogin = false,
  showOnlyRegister = false,
  dashboardTitle = null,
  showDashboardTitle = false
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
    closeMenu();
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          {isLoggedIn ? (
            <div className="logo-container">
              <img 
                src="/assets/CompanyLogo5.png" 
                alt="Visitor Management" 
                className="logo-image"
              />
            </div>
          ) : (
            <Link to="/" onClick={closeMenu}>
              <img 
                src="/assets/CompanyLogo5.png" 
                alt="Visitor Management" 
                className="logo-image"
              />
            </Link>
          )}
        </div>

        {/* Hamburger Menu Button */}
        <button 
          className={`hamburger-menu ${isMenuOpen ? 'active' : ''}`}
          onClick={toggleMenu}
          aria-label="Toggle navigation menu"
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>

        {/* Navigation Links */}
        <ul className={`navbar-links ${isMenuOpen ? 'active' : ''}`}>
          {showDashboardTitle && dashboardTitle && (
            <li className="dashboard-title-mobile">
              <span className="dashboard-title-text">{dashboardTitle}</span>
            </li>
          )}
          
          {showMainLinks && (
            <>
              <li>
                <Link to="/" onClick={closeMenu}>Home</Link>
              </li>
              <li>
                <Link to="/products" onClick={closeMenu}>Products</Link>
              </li>
              <li>
                <Link to="/resources" onClick={closeMenu}>Resources</Link>
              </li>
              <li>
                <Link to="/aboutus" onClick={closeMenu}>About Us</Link>
              </li>
              <li>
                <Link to="/pricing" onClick={closeMenu}>Pricing</Link>
              </li>
              <li>
                <Link to="/bookademo" onClick={closeMenu}>Book a Demo</Link>
              </li>
              <li>
                <Link to="/contactus" onClick={closeMenu}>Contact Us</Link>
              </li>
            </>
          )}

          {showAuthButtons && !isLoggedIn && (
            <>
              {(!showOnlyLogin && !showOnlyRegister) && (
                <>
                  <li>
                    <Link to="/register" className="register-btn" onClick={closeMenu}>
                      Registration
                    </Link>
                  </li>
                  <li>
                    <Link to="/login" className="login-btn" onClick={closeMenu}>
                      Login
                    </Link>
                  </li>
                </>
              )}
              
              {showOnlyLogin && (
                <li>
                  <Link to="/login" className="login-btn" onClick={closeMenu}>
                    Login
                  </Link>
                </li>
              )}
              
              {showOnlyRegister && (
                <li>
                  <Link to="/register" className="register-btn" onClick={closeMenu}>
                    Registration
                  </Link>
                </li>
              )}
            </>
          )}

          {isLoggedIn && (
            <li>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </li>
          )}
        </ul>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <div className="mobile-menu-overlay" onClick={closeMenu}></div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
