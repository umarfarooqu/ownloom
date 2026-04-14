// frontend/src/components/ForgotPassword.jsx

import React, { useState, useEffect } from "react";
import api from "../services/api";
import { Link } from "react-router-dom";

// CSS files ko reuse karein
import "../App.css"; 
import "./ForgotPassword.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Auth page style apply karein
    document.body.classList.add("auth-page-active");
    return () => {
      document.body.classList.remove("auth-page-active");
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      // Yeh 'django-rest-passwordreset' ka default URL hai
      await api.post("/api/password-reset/", { email: email });
      setMessage(
        "Password reset link has been sent to your email. Please check your inbox (and spam folder)."
      );
    } catch (err) {
      if (err.response && err.response.status === 400) {
        setError("Error: This email address is not registered in our system.");
      } else {
        setError("An error occurred. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    // Hum 'AuthLayout' ke CSS ka istemal kar rahe hain
    <div className="auth-container">
      <div className="auth-branding">
        <div className="auth-branding-content">
          <h1>OwnLoom</h1>
          <p>Your Personal AI Cloud. Secure, Private, and Intelligent.</p>
        </div>
      </div>

      <div className="auth-form-section">
        <div className="auth-box">
          <h2>Forgot Password</h2>
          <form onSubmit={handleSubmit}>
            {!message && ( // Jab tak message na ho, tab tak form dikhayein
              <>
                <p className="auth-message">
                  Enter your registered email address. We will send you a link
                  to reset your password.
                </p>
                <div className="form-group">
                  <label>Email:</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="auth-button"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </>
            )}

            {/* Success ya Error message dikhayein */}
            {message && <p className="success-message">{message}</p>}
            {error && <p className="error-message">{error}</p>}
          </form>

          <div className="forgot-password-link">
            <Link to="/login">Back to Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;