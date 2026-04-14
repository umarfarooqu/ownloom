import React from "react";
import { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import api from "../services/api";
import logo from "../assets/images/OwnLoom.svg";//add logo file
import {
  FaPlus,
  FaFolderPlus,
  FaFileUpload,
  FaHdd,
  FaStar,
  FaTrash,
  FaClock,
  FaBan,
  FaShareSquare
} from "react-icons/fa";
import "./Sidebar.css";

function Sidebar({ onNewFolderClick }) {
  const [storageUsed, setStorageUsed] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const totalStorage = 2048; // 2GB in MB
  const dropdownRef = useRef(null);

  // Fetch storage usage
  useEffect(() => {
    api
      .get("/api/storage/")
      .then((res) => setStorageUsed(res.data.storage_used_mb))
      .catch((err) => console.error("Failed to fetch storage", err));
  }, []);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const storagePercentage = (storageUsed / totalStorage) * 100;

  return (
    <div className="sidebar">
      {/* --- NAYA LOGO SECTION --- */}
      <div className="sidebar-logo">
        <img src={logo} alt="OwnLoom Logo" />
        <span className="hlo"></span>
      </div>

      {/* --- New Button with Dropdown --- */}
      <div className="sidebar-new-button" ref={dropdownRef}>
        <button onClick={() => setDropdownOpen(!dropdownOpen)}>
          <FaPlus /> New
        </button>
        {dropdownOpen && (
          <div className="new-dropdown-menu">
            <button className="dropdown-item"onClick={() => document.getElementById('file-input').click()}>
              <FaFileUpload /> File Upload
            </button>
            <div className="dropdown-divider"></div>
            <button className="dropdown-item"onClick={onNewFolderClick}>
              <FaFolderPlus /> New Folder
            </button>
          </div>
        )}
      </div>

      {/* --- Navigation Links --- */}
      <nav className="sidebar-nav">
        <ul>
          <li>
            <NavLink
              to="/drive"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
            >
              <FaHdd /> My Drive
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/recent"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
            >
              <FaClock /> Recent
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/shared"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
            >
              <FaShareSquare /> Shared
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/favorites"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
            >
              <FaStar /> Favorites
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/trash"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
            >
              <FaTrash /> Trash
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/spam"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
            >
              <FaBan /> Spam
            </NavLink>
          </li>
        </ul>
      </nav>

      {/* --- Storage Indicator --- */}
      <div className="sidebar-storage">
        <p>Storage</p>
        <div className="storage-bar-container">
          <div
            className="storage-bar"
            style={{ width: `${storagePercentage}%` }}
          ></div>
        </div>
        <span>{storageUsed.toFixed(2)} MB of 2 GB used</span>
      </div>
    </div>
  );
}

export default Sidebar;
