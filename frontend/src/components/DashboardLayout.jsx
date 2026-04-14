import React, { useState, useEffect, useRef } from "react";
import api from "../services/api";

function DashboardLayout() {
  const [content, setContent] = useState({ subfolders: [], files: [] });
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  const fetchContent = async (folderId = null) => {
    setLoading(true);
    setError("");
    const url = folderId ? `/api/dashboard/${folderId}/` : "/api/dashboard/";
    try {
      const response = await api.get(url);
      setContent({
        subfolders: response.data.subfolders || [],
        files: response.data.files || [],
      });
      setBreadcrumbs(response.data.breadcrumbs || []);
      setCurrentFolder(response.data.current_folder_id);
    } catch (err) {
      setError("Failed to fetch content. Please try refreshing.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent(); // Fetch root content on initial load
  }, []);

  const handleCreateFolder = async () => {
    const folderName = prompt("Enter new folder name:");
    if (folderName) {
      try {
        await api.post("/api/folders/", {
          name: folderName,
          parent_folder: currentFolder,
        });
        fetchContent(currentFolder); // Refresh content
      } catch (error) {
        alert("Failed to create folder. It might already exist.");
        console.error(error);
      }
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("filename", file.name);
    if (currentFolder) {
      formData.append("folder", currentFolder);
    }

    try {
      await api.post("/api/files/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      fetchContent(currentFolder);
    } catch (err) {
      alert("Upload failed. The file may already exist.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = (itemId, itemType) => {
    // ... (Keep the existing handleDelete function)
  };

  if (loading) return <div className="loading-message">Loading content...</div>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="dashboard-content">
      <header className="dashboard-header">
        <input type="search" placeholder="Search" className="search-bar" />
        <div className="header-actions">
          <button>Invite members</button>
          <span>🔔</span>
          <button className="upgrade-btn">Click to upgrade</button>
        </div>
      </header>

      <div className="action-toolbar">
        <button onClick={() => fileInputRef.current.click()}>
          📤 Upload or drop
        </button>
        <button>➕ Create</button>
        <button onClick={handleCreateFolder}>📁 Create folder</button>
        <button>🔗 Share</button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </div>
      {/* --- NEW BREADCRUMBS SECTION --- */}
      <nav className="breadcrumbs">
        <span onClick={() => fetchContent(null)} className="breadcrumb-link">
          Home
        </span>
        {breadcrumbs.map((crumb) => (
          <span key={crumb.id}>
            {" / "}
            <span
              onClick={() => fetchContent(crumb.id)}
              className="breadcrumb-link"
            >
              {crumb.name}
            </span>
          </span>
        ))}
      </nav>
      {/* --- END OF NEW SECTION --- */}

      <div className="file-grid-container">
        {content.subfolders.map((folder) => (
          <div
            key={`folder-${folder.id}`}
            className="grid-item"
            onDoubleClick={() => fetchContent(folder.id)}
          >
            <div className="icon folder-icon">📁</div>
            <span className="name">{folder.name}</span>
          </div>
        ))}
        {content.files.map((file) => (
          <div key={`file-${file.id}`} className="grid-item">
            <div className="icon file-icon">📄</div>
            <span className="name">{file.filename}</span>
          </div>
        ))}
      </div>

      {content.subfolders.length === 0 && content.files.length === 0 && (
        <div className="empty-folder-view">
          <div className="empty-folder-icon">🗂️</div>
          <h3>Drop anything here or create a folder</h3>
          <button onClick={() => fileInputRef.current.click()}>Upload</button>
        </div>
      )}
    </div>
  );
}

export default DashboardLayout;
