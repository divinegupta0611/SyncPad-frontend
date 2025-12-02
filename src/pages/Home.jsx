import React, { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ArrowRight, Users, Zap, Globe, Play } from 'lucide-react';
import '../styles/HomeCSS.css';
import NavBar from '../components/NavBar';
const Home = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  useEffect(() => {
    setIsVisible(true);
    
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const features = [
    {
      icon: <Users size={28} />,
      title: "Real-time Collaboration",
      description: "Work together seamlessly with your team in real-time with zero lag"
    },
    {
      icon: <Zap size={28} />,
      title: "Lightning Fast",
      description: "Instant updates and smooth performance with optimized synchronization"
    },
    {
      icon: <Globe size={28} />,
      title: "Access Anywhere",
      description: "Work from any device, anywhere in the world with cloud sync"
    }
  ];

  return (
    <div className="home-container">
      {/* Animated Background */}
      <div className="background-elements">
        <div 
          className="bg-circle-1"
          style={{
            left: `${10 + mousePosition.x * 0.02}%`,
            top: `${10 + mousePosition.y * 0.02}%`,
          }}
        />
        <div 
          className="bg-circle-2"
          style={{
            right: `${10 + mousePosition.x * 0.01}%`,
            bottom: `${10 + mousePosition.y * 0.01}%`,
          }}
        />
      </div>

      {/* Navigation */}
      <NavBar/>


      {/* Hero Section */}
      <main className="main-content">
        <div className="hero-section">
          <h1 className="hero-title">
            Collaborate
            <span className="hero-title-gradient">Visually</span>
          </h1>
          
          <p className="hero-description">
            Transform your ideas into reality with our intuitive collaborative whiteboard. 
            Create, share, and innovate together in real-time with zero latency.
          </p>

          <div className="hero-buttons">
            {isLoggedIn ? (
              <Link to="/room" className="btn-hero-primary">
                <span>Start Creating</span>
                <ArrowRight size={22} />
              </Link>
            ) : (
              <p className="text-red-500 text-lg font-semibold">
                Signup to get started
              </p>
            )}
          </div>
        </div>

        {/* Whiteboard Preview */}
        <div className="preview-section">
          <div className="whiteboard-preview">
            <div className="preview-header">
              <div className="preview-dots">
                <div className="preview-dot dot-red"></div>
                <div className="preview-dot dot-yellow"></div>
                <div className="preview-dot dot-green"></div>
              </div>
              <div className="preview-title">
                <span>Untitled Board - Live Collaboration</span>
              </div>
            </div>
            
            <div className="preview-canvas">
              {/* Simulated whiteboard elements */}
              <div className="canvas-element" style={{
                top: '40px',
                left: '40px',
                width: '150px',
                height: '100px',
                backgroundColor: '#fed7aa',
              }}></div>
              <div className="canvas-element" style={{
                top: '80px',
                right: '80px',
                width: '120px',
                height: '120px',
                backgroundColor: '#fde68a',
                borderRadius: '50%',
                animationDelay: '0.5s',
              }}></div>
              <div className="canvas-element" style={{
                bottom: '60px',
                left: '100px',
                width: '200px',
                height: '10px',
                backgroundColor: '#fbbf24',
                borderRadius: '5px',
                animationDelay: '1s',
              }}></div>
              <div className="canvas-element" style={{
                bottom: '40px',
                left: '100px',
                width: '140px',
                height: '10px',
                backgroundColor: '#fbbf24',
                borderRadius: '5px',
                animationDelay: '1.5s',
              }}></div>
              
              {/* Floating cursors */}
              <div className="cursor" style={{
                top: '120px',
                left: '160px',
                backgroundColor: '#f59e0b',
              }}>
                <div className="cursor-label" style={{ color: '#f59e0b' }}>Alex</div>
              </div>
              <div className="cursor" style={{
                top: '200px',
                right: '160px',
                backgroundColor: '#fbbf24',
                animationDelay: '0.5s',
              }}>
                <div className="cursor-label" style={{ color: '#fbbf24' }}>Sarah</div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="features-section">
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">
                  {feature.icon}
                </div>
                <h3 className="feature-title">
                  {feature.title}
                </h3>
                <p className="feature-description">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <p>&copy; 2025 SyncPad. Made with ❤️ for creative minds.</p>
        </div>
      </footer>
      
      <Outlet />
    </div>
  );
};

export default Home;