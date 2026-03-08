import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import './Auth.css';

function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isSignup) {
        await authAPI.signup(formData);
        alert('Account created! Please login.');
        setIsSignup(false);
      } else {
        const { data } = await authAPI.login(formData);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>💰 Expense Tracker</h2>
        <p className="subtitle">AI-Powered Financial Management</p>
        
        {error && <div className="error">{error}</div>}
        
        <div className="tabs">
          <div className={!isSignup ? 'tab active' : 'tab'} onClick={() => setIsSignup(false)}>Login</div>
          <div className={isSignup ? 'tab active' : 'tab'} onClick={() => setIsSignup(true)}>Sign Up</div>
        </div>
        
        <form onSubmit={handleSubmit}>
          {isSignup && (
            <>
              <input
                type="text"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </>
          )}
          <input
            type="text"
            placeholder="Username"
            value={formData.username}
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />
          <button type="submit">{isSignup ? 'Create Account' : 'Login'}</button>
        </form>
      </div>
    </div>
  );
}

export default Login;
