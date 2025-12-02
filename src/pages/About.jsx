import React from 'react';
import NavBar from '../components/NavBar';
import '../styles/AboutCSS.css';

const About = () => {
  return (
    <div className="about-page">
      <NavBar />
      
      <div className="about-container">
        <div className="about-hero">
          <h1 className="about-title">About SyncPad</h1>
          <p className="about-tagline">Real-time collaboration made simple</p>
        </div>

        <div className="about-content">
          <section className="about-section">
            <div className="about-card">
              <div className="card-icon">🎨</div>
              <h2>What is SyncPad?</h2>
              <p>
                SyncPad is a powerful real-time collaborative whiteboard platform that enables teams to work together seamlessly. 
                Draw, write, and create together in real-time, no matter where you are.
              </p>
            </div>

            <div className="about-card">
              <div className="card-icon">⚡</div>
              <h2>Real-time Collaboration</h2>
              <p>
                Experience instant synchronization as multiple users draw and interact on the same canvas. 
                See changes happen live with minimal latency and smooth performance.
              </p>
            </div>

            <div className="about-card">
              <div className="card-icon">🛠️</div>
              <h2>Powerful Tools</h2>
              <p>
                Access a complete toolkit including shapes, drawing tools, text editing, and more. 
                Customize colors, adjust sizes, and create professional diagrams with ease.
              </p>
            </div>
          </section>

          <section className="about-features">
            <h2 className="features-title">Key Features</h2>
            <div className="features-grid">
              <div className="feature-item">
                <span className="feature-icon">✏️</span>
                <h3>Drawing Tools</h3>
                <p>Pen, shapes, text, and more</p>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🎨</span>
                <h3>Customization</h3>
                <p>Colors, sizes, and styles</p>
              </div>
              <div className="feature-item">
                <span className="feature-icon">👥</span>
                <h3>Multi-user</h3>
                <p>Collaborate with teams</p>
              </div>
              <div className="feature-item">
                <span className="feature-icon">💾</span>
                <h3>Auto-save</h3>
                <p>Never lose your work</p>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📱</span>
                <h3>Responsive</h3>
                <p>Works on all devices</p>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🚀</span>
                <h3>Fast & Reliable</h3>
                <p>Low latency updates</p>
              </div>
            </div>
          </section>

          <section className="about-cta">
            <h2>Ready to Start Collaborating?</h2>
            <p>Join thousands of teams using SyncPad for their creative work</p>
            <a href="/signup" className="cta-button">Get Started Free</a>
          </section>
        </div>
      </div>
    </div>
  );
};

export default About;