import React from "react";
import { Link } from "react-router-dom";
import "./HomePage.css"; // We will create this CSS file next
import Navbar from "./Navbar";
import { FaTwitter, FaGithub, FaLinkedin } from "react-icons/fa";

function HomePage() {
  return (
    <div className="home-page-container">
      <Navbar />
      <header className="home-hero-section">
        <div className="home-hero-content">
          <h1>Own Your Data. Unleash Your AI.</h1>
          <p className="home-subtitle">
            OwnLoom is the self-hosted cloud platform that gives you complete
            control, privacy, and intelligent tools to manage your digital life.
          </p>
          <div className="home-hero-buttons">
            <Link to="/register" className="home-btn home-btn-primary">
              Get Started for Free
            </Link>
            <a href="#features" className="home-btn home-btn-secondary">
              Learn More
            </a>
          </div>
        </div>
      </header>
      <section id="features" className="home-features-section">
        <h2>Why Choose OwnLoom?</h2>
        <div className="home-features-grid">
          <div className="home-feature-card">
            <div className="home-feature-icon">🔐</div>
            <h3>Total Control & Privacy</h3>
            <p>
              Your files live on your server, not ours. Enjoy true data
              ownership and end-to-end privacy without compromise.
            </p>
          </div>
          <div className="home-feature-card">
            <div className="home-feature-icon">💡</div>
            <h3>Intelligent AI Features</h3>
            <p>
              Go beyond simple storage. Our AI automatically finds duplicates,
              tags your photos, and will soon power semantic search.
            </p>
          </div>
          <div className="home-feature-card">
            <div className="home-feature-icon">🚀</div>
            <h3>Simple & Powerful</h3>
            <p>
              Get a clean, modern interface packed with powerful features, all
              running on your own secure and private platform.
            </p>
          </div>
        </div>
      </section>
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-about">
            <h3>OwnLoom</h3>
            <p>Your Personal AI Cloud. Secure, Private, and Intelligent.</p>
          </div>
          <div className="footer-links">
            <h4>Quick Links</h4>
            <ul>
              <li>
                <a href="#features">Features</a>
              </li>
              <li>
                <Link to="/register">Sign Up</Link>
              </li>
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
          <div className="footer-social">
            <h4>Follow Us</h4>
            <div className="social-icons">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
              >
                <FaTwitter />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
              >
                <FaGithub />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
              >
                <FaLinkedin />
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 OwnLoom. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
