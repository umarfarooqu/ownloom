import React, { useState } from "react";
import api from "../services/api";
import { Link } from "react-router-dom";
import { toast } from 'react-hot-toast';
import './ForgotPassword.css';

function Login({ setToken }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await api.post("/api-token-auth/", {
        username,
        password,
      });
      toast.success('Login Successful! Welcome back.');
      setToken(response.data.token);
    } catch (err) {
      const errorMsg = "Failed to log in. Please check your username and password.";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  return (
    <div className="auth-box">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="auth-button">
          Login
        </button>
        <div className="forgot-password-link">
          <Link to="/forgot-password">Forgot Password?</Link>
        </div>
      </form>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}

export default Login;
