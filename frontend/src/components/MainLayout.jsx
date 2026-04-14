import React, { useState, useEffect, useRef } from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";
import api from "../services/api";
// Component Imports
import Sidebar from "./Sidebar";
import FileDashboard from "./FileDashboard";
import ProfilePage from "./ProfilePage";
import TrashPage from "./TrashPage"
import FavoritesPage from "./FavoritesPage";
import RecentFilesPage from "./RecentFilesPage";
import SpamPage from "./SpamPage";
import ShareModal from "./ShareModal";
import SharedPage from "./SharedPage";
// CSS Imports
import "../App.css";
import "./ShareModal.css";
// Icon Imports
import { FaSearch, FaSlidersH, FaFilePdf, FaFileImage, FaFileAlt, FaTimesCircle, FaMoon, FaSun, FaMicrophone } from "react-icons/fa";

function AppHeader({ onLogout, profilePicUrl, searchQuery, setSearchQuery, onFilterClick, isFilterOpen, filterMenuRef, filterType, setFilterType, currentTheme, onChangeTheme }) {

  const [isListening, setIsListening] = useState(false); 

  const handleFilterSelect = (type) => {
    setFilterType(type); 
    onFilterClick();
  };

  const handleThemeToggle = () => {
    onChangeTheme(currentTheme === "light" ? "dark" : "light");
  };
  
  const startVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Voice search is not supported in this browser. Try Chrome.");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US'; // Aap 'hi-IN' bhi kar sakti hain Hindi ke liye
    
    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript); // Jo bola woh search box mein daal do
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error("Voice recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <header className="app-header">
      <div className="header-left">
      </div>
      <div className="header-search-container" ref={filterMenuRef}>
        <FaSearch className="search-icon" />
        <input
          type="search"
          placeholder={isListening ? "Listening..." : "Search in OwnLoom"}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button 
            className={`voice-search-btn ${isListening ? 'listening' : ''}`} 
            onClick={startVoiceSearch}
            title="Search by Voice"
        >
          <FaMicrophone />
        </button>

        <button className="filter-button" onClick={onFilterClick}>
          <FaSlidersH />
        </button>

        {isFilterOpen && (
          <div className="filter-dropdown">
            <p>Filter by File Type</p>
            <div className="filter-option" onClick={() => handleFilterSelect('pdf')}>
              <FaFilePdf />
              <span>PDFs</span>
            </div>
            <div className="filter-option" onClick={() => handleFilterSelect('image')}>
              <FaFileImage />
              <span>Images</span>
            </div>
            <div className="filter-option" onClick={() => handleFilterSelect('document')}>
              <FaFileAlt />
              <span>Documents</span>
            </div>
            <div className="dropdown-divider"></div>
            <div className="filter-option" onClick={() => handleFilterSelect(null)}>
              <FaTimesCircle />
              <span>Clear Filter</span>
            </div>
          </div>
        )}

      </div>
      <nav>
        <Link to="/drive" className="header-link">Dashboard</Link>
        <Link to="/profile" className="header-link">Profile</Link>
        <button onClick={handleThemeToggle} className="theme-toggle-btn-header">
          {currentTheme === "light" ? <FaMoon /> : <FaSun />}
        </button>
        <button onClick={onLogout} className="auth-button logout-button">Logout</button>
        {profilePicUrl && (<img src={profilePicUrl}alt="Profile"className="header-profile-pic"/>)}
        
      </nav>
    </header>
  );
}

function MainLayout({ onLogout, profilePicUrl, token, currentTheme, onChangeTheme}) {

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterMenuRef = useRef(null);
  const [filterType, setFilterType] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareFileId, setShareFileId] = useState(null);

  const handleShareClick = (fileId) => {
    setShareFileId(fileId); 
    setIsShareModalOpen(true); 
  };

  const handleFilterClick = () => {
    setIsFilterOpen(prev => !prev); 
  };
  useEffect(() => {
    function handleClickOutside(event) {
      if (filterMenuRef.current && !filterMenuref.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [filterMenuRef]);

  return (
    <div className="app-container">
      <Sidebar onNewFolderClick={() => setIsModalOpen(true)}
      currentTheme={currentTheme}
      onChangeTheme={onChangeTheme} />
      <div className="content-wrapper">
        <AppHeader onLogout={onLogout} 
                   profilePicUrl={profilePicUrl}
                   onFilterClick={handleFilterClick} 
                   setSearchQuery={setSearchQuery}
                   searchQuery={searchQuery} 
                   filterMenuRef={filterMenuRef} 
                   isFilterOpen={isFilterOpen} 
                   filterType={filterType}
                   setFilterType={setFilterType}
                   currentTheme={currentTheme}     
                   onChangeTheme={onChangeTheme}
                  />
        <main className="app-content">
          <Routes>
            <Route
              path="/drive"element={<FileDashboard token={token}isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} searchQuery={searchQuery}filterType={filterType}handleShareClick={handleShareClick}/>} 
              />
            <Route path="/profile" element={<ProfilePage />} />
            {/* amu */}
            <Route path="/trash" element={<TrashPage />}/>
            <Route path="/favorites" element={<FavoritesPage handleShareClick={handleShareClick} />} />
            <Route path="/recent" element={<RecentFilesPage handleShareClick={handleShareClick}/>} />
            <Route path="/spam" element={<SpamPage />} />
            <Route path="*" element={<Navigate to="/drive" />} />
            <Route path="/shared" element={<SharedPage handleShareClick={handleShareClick} />} />
          </Routes>
        </main>
      </div>
      <ShareModal 
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        fileId={shareFileId}
      />
    </div>
  );
}

export default MainLayout;
