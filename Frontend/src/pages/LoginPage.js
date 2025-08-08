import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../utils/apiService';

import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import '../styles/LoginPage.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Call the API service for login
      const { token, user } = await loginUser(email, password);

      // Store token and user details for session management
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      console.log('Login Successful:', user);

      // Navigate to the correct dashboard based on role
      if (user.role === 'admin') {
        console.log('Navigating to /admin');
        navigate('/admin');
      } else {
        console.log('Navigating to /host');
        navigate('/host');
      }

      // Reload the page after successful login
      window.location.reload();
    } catch (err) {
      setError(err.message || 'An unknown error occurred.');
      console.error('Login failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loginpage-outer">
      <Navbar 
        showAuthButtons={true}
        showMainLinks={true}
        isLoggedIn={false}
        showOnlyRegister={true}
      />
      <div className="login-container">
        <h2 className="login-title">Login</h2>
        <form className="login-form" onSubmit={handleSubmit}>
          <div>
            <label>Email:</label><br />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Password:</label><br />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
       <Footer />
    </div>
  );
};

export default LoginPage;