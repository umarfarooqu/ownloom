// frontend/src/App.js
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import HomePage from "./components/HomePage";
import AuthLayout from "./components/AuthLayout";
import MainLayout from "./components/MainLayout";
import PublicSharePage from "./components/PublicSharePage";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import api from "./services/api";
import "./App.css";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [profilePicUrl, setProfilePicUrl] = useState(null);
  const [Data, setData] = useState([]);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    if (theme === "dark") {
      document.body.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [theme]);

  // Default profile pic URLs
  const defaultPic = "https://placehold.co/40x40?text=:)";
  const errorPic = "https://placehold.co/40x40?text=Err";

  // Fetch data from backend
  useEffect(() => {
    if (token) {
      fetch("http://localhost:8000/api/files/", {
        method: "GET",
        headers: {
          "Authorization": `Token ${token}`,
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        if (!response.ok) {
          if (response.status === 401) {
              console.error("Authentication failed. Please log in again.");
              handleSetToken(null); 
          }
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => setData(data))
      .catch((error) => console.error("Error fetching data:", error));
    }
  }, [token]);

  // Fetch profile pic if token exists
  useEffect(() => {
    if (token) {
      api
        .get("/api/profile/")
        .then((res) => {
          setProfilePicUrl(res.data.profile_picture || defaultPic);
        })
        .catch((err) => {
          console.error("Failed to fetch profile pic", err);
          setProfilePicUrl(errorPic);
        });
    }
  }, [token]);

  const handleSetToken = (newToken) => {
    if (newToken) {
      localStorage.setItem("token", newToken);
    } else {
      localStorage.removeItem("token");
      setProfilePicUrl(null);
    }
    setToken(newToken);
  };

  return (
    <Router>
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 3000,
          style: {
            // Yeh style aapke Dark/Light theme ke saath match karega
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-primary)',
          },
        }}
      />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/shared/:token" element={<PublicSharePage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/*"element={token ? (<MainLayout
                onLogout={() => handleSetToken(null)}
                profilePicUrl={profilePicUrl}
                currentTheme={theme}
                onChangeTheme={setTheme}
                />
            ) : (
              <AuthLayout onSetToken={handleSetToken} />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
