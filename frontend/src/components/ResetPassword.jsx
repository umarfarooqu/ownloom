// frontend/src/components/ResetPassword.jsx

import React, { useState, useEffect } from "react";
import api from "../services/api";
// 'useParams' token ko URL se nikalne ke liye aur 'Link' login par wapas jaane ke liye
import { useParams, Link } from "react-router-dom";

// CSS files ko reuse karein
import "../App.css"; 
import "./ForgotPassword.css";

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // URL se token nikaalein (e.g., /reset-password/ABCDE12345)
  const { token } = useParams();

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

    // Check karein ki dono password match karte hain
    if (password !== passwordConfirm) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      // Yeh 'django-rest-passwordreset' ka default confirmation URL hai
      await api.post("/api/password-reset/confirm/", {
        token: token,
        password: password,
      });
      setMessage(
        "Your password has been reset successfully! You can now log in."
      );
    } catch (err) {
      if (err.response && err.response.data && err.response.data.token) {
        setError("Error: This reset link is invalid or has expired.");
      } else if (err.response.data.password) {
        setError(`Error: ${err.response.data.password[0]}`); // Show password validation error
      } else {
        setError("An error occurred. Please try again.");
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
          <h2>Reset Your Password</h2>
          <form onSubmit={handleSubmit}>
            {!message && ( // Jab tak success message na ho, tab tak form dikhayein
              <>
                <p className="auth-message">
                  Enter your new password below.
                </p>
                <div className="form-group">
                  <label>New Password:</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Confirm New Password:</label>
                  <input
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="auth-button"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Reset Password"}
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

export default ResetPassword;