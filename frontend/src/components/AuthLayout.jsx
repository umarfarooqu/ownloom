import React, { useEffect } from "react";
import { Routes, Route, NavLink, Navigate, Link } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import "../App.css"; 

function AuthLayout({ onSetToken }) {
  useEffect(() => {
    document.body.classList.add("auth-page-active");
    return () => {
      document.body.classList.remove("auth-page-active");
    };
  }, []);

  return (
    <div className="auth-container">
      <div className="auth-branding">
        <div className="auth-branding-content">
          <h1>OwnLoom</h1>
          <p>Your Personal AI Cloud. Secure, Private, and Intelligent.</p>
        </div>
      </div>

      {/* Panel 2: Form Section */}
      <div className="auth-form-section">
        <nav className="auth-nav">
          <NavLink
            to="/login"
            className={({ isActive }) =>
              `auth-nav-link ${isActive ? "auth-nav-active" : ""}`
            }
          >
            Login
          </NavLink>
          <NavLink
            to="/register"
            className={({ isActive }) =>
              `auth-nav-link ${isActive ? "auth-nav-active" : ""}`
            }
          >
            Register
          </NavLink>
        </nav>

        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login setToken={onSetToken} />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </div>
  );
}

export default AuthLayout;
