import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import '../styles/AuthCSS.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('All fields are required');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (error) throw error;

      if (data.user) {
        // 🔥 Save login session to localStorage
        localStorage.setItem("email", data.user.email);
        localStorage.setItem("fullName", data.user.user_metadata.full_name || "");
        localStorage.setItem("isLoggedIn", "true");
        navigate('/');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-wrapper login-mode">
        <div className="auth-card">
          <div className="auth-form-section">
            <div className="auth-form-content">
              <h1 className="auth-title">Welcome Back</h1>
              <p className="auth-subtitle">Login to your account</p>

              {error && <div className="auth-error">{error}</div>}

              <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  className="auth-submit-btn"
                  disabled={loading}
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>

              <div className="auth-footer">
                <p>Don't have an account? <Link to="/signup" className="auth-link">Sign Up</Link></p>
              </div>
            </div>
          </div>

          <div className="auth-image-section">
            <img 
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80" 
              alt="Login Illustration" 
              className="auth-image"
            />
            <div className="auth-image-overlay">
              <h2>Start Collaborating</h2>
              <p>Real-time whiteboard for teams</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;