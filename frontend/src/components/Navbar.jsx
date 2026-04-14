// frontend/src/components/Navbar.js

import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/images/OwnLoom.svg"; // Ensure you have a logo image in the assets folder

import "./Navbar.css"; // We will create this CSS file next

function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-logo">
        <Link to="/">
          <img src={logo} alt="OwnLoom Logo" className="logo-image" />
          OwnLoom
        </Link>
      </div>
      <div className="nav-links">
        <a href="#features">Features</a>
        {/* You can add real pages for these later */}
        <a href="#pricing">Pricing</a>
        <a href="#contact">Contact</a>
      </div>
      <div className="nav-actions">
        <Link to="/login" className="login-link">
          Login
        </Link>
        <Link to="/register" className="btn btn-cta">
          Get Started
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;
