import React, { useState, useEffect } from "react";
import api from "../services/api";
import StorageChart from "./StorageChart";

function ProfilePage() {
  const [profile, setProfile] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    profile_picture: null,
  });
  const [storage, setStorage] = useState(null);
  const [message, setMessage] = useState("");
  const [newProfilePic, setNewProfilePic] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Fetch profile and storage on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await api.get("/api/profile/");
        setProfile(profileRes.data);
        if (profileRes.data.profile_picture) {
          setPreviewUrl(profileRes.data.profile_picture);
        }

        const storageRes = await api.get("/api/storage/");
        setStorage(storageRes.data);
      } catch (error) {
        console.error("Failed to fetch data", error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl && newProfilePic) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl, newProfilePic]);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setNewProfilePic(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("first_name", profile.first_name || "");
    formData.append("last_name", profile.last_name || "");
    formData.append("email", profile.email || "");
    if (newProfilePic) {
      formData.append("profile_picture", newProfilePic);
    }

    try {
      const response = await api.patch("/api/profile/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfile(response.data);
      setMessage("Profile updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("Failed to update profile.");
      console.error("Update error", error);
    }
  };

  const storagePercentage = storage
    ? (storage.storage_used_mb / 1024) * 100
    : 0;

  return (
    <div className="profile-page">
      <h2>Profile Management</h2>

      <form onSubmit={handleSubmit} className="profile-form">
        <div className="profile-pic-container">
          <img
            src={previewUrl || "https://placehold.co/150x150?text=No+Image"}
            alt="Profile"
            className="profile-pic"
          />
          <input
            type="file"
            id="file-upload"
            onChange={handleFileChange}
            accept="image/*"
            style={{ display: "none" }}
          />
          <label htmlFor="file-upload" className="file-upload-label">
            Change Picture
          </label>
        </div>

        <div className="form-group">
          <label>Username</label>
          <input type="text" value={profile.username || ""} disabled />
        </div>

        <div className="form-group">
          <label>First Name</label>
          <input
            type="text"
            name="first_name"
            value={profile.first_name || ""}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Last Name</label>
          <input
            type="text"
            name="last_name"
            value={profile.last_name || ""}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={profile.email || ""}
            onChange={handleChange}
          />
        </div>

        <button type="submit" className="auth-button">
          Save Changes
        </button>

        {message && <p className="success-message">{message}</p>}
      </form>

      {storage && (
        <div className="storage-info">
          <h3>Storage Analytics</h3>
          
          {/* --- 1. CHART ADD KAREIN --- */}
          <div style={{ marginBottom: '30px', marginTop: '10px' }}>
             <StorageChart breakdown={storage.breakdown} />
          </div>
          {/* --------------------------- */}

          <div className="storage-bar-container">
            <div
              className="storage-bar"
              style={{ width: `${storagePercentage}%` }}
            ></div>
          </div>
          
          <p style={{ marginTop: '10px', fontWeight: 'bold' }}>
            {storage.total_used_mb} MB used of 1 GB
          </p>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
