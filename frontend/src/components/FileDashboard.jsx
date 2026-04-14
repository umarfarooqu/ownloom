import React, { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import FileUpload from "./FileUpload";
import FileItem from "./FileItem";
import CreateFolderModal from "./CreateFolderModal";
import "./FileItem.css";
import { FaFolder, FaEdit, FaTrash, FaStar,FaList, FaTh, FaSortAmountDown} from "react-icons/fa";
import FolderItem from "./FolderItem";
import SetVaultPasswordModal from "./SetVaultPasswordModal";
import UnlockVaultModal from "./UnlockVaultModal";
import QuickAccess from "./QuickAccess";
import DetailsPanel from "./DetailsPanel";
import ContextMenu from "./ContextMenu";
import FilePreviewModal from "./FilePreviewModal";

function FileDashboard({ token, isModalOpen, setIsModalOpen, searchQuery,  filterType, handleShareClick}) {
  // --- States ---
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [editing, setEditing] = useState({ id: null, type: null, name: "" });
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [unlockedVaults, setUnlockedVaults] = useState({});
  const [unlockModalInfo, setUnlockModalInfo] = useState({ isOpen: false, folder: null, file: null });
  // --- Navigation State ---
  const [history, setHistory] = useState([{ id: null, name: "My Drive" }]);
  const currentFolder = history[history.length - 1];
  const currentFolderId = currentFolder.id;
  const isCurrentFolderVault = currentFolder.is_vault;
  const [viewMode, setViewMode] = useState('list');
  const [contextMenu, setContextMenu] = useState(null); 
  const [previewFile, setPreviewFile] = useState(null); // File object
  const [previewUrl, setPreviewUrl] = useState(null);
  const [sortBy, setSortBy] = useState("date"); 
  const [showSortMenu, setShowSortMenu] = useState(false);

  const handleContextMenu = (e, item, type) => {
    e.preventDefault(); 
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item: { ...item, type } 
    });
  };

  const handleOpenFile = async (file) => {
    // 1. Vault Check
    if (isCurrentFolderVault && !unlockedVaults[currentFolderId]) {
       handleUnlockNeeded(file);
       return;
    }

    try {
      // 2. File Download (Blob fetch)
      // Toast notification add kar sakte hain: toast.loading("Opening...")
      const urlToFetch = `/api/files/${file.id}/open/`;
      const response = await api.get(urlToFetch, { responseType: 'blob' });
      const blob = response.data;
      const url = URL.createObjectURL(blob);
      
      // --- YAHAN FIX HAI ---
      
      // Check karein ki file ka type kya hai
      const ext = file.filename.split('.').pop().toLowerCase();
      const previewableTypes = [
        'jpg', 'jpeg', 'png', 'gif', 'webp', // Images
        'pdf', // PDF
        'txt', 'json', 'js', 'py', 'css', 'html', 'md', // Text/Code
        'mp3', 'wav', 'ogg', // Audio
        'mp4', 'webm' // Video
      ];

      if (previewableTypes.includes(ext)) {
          // 3a. Agar Preview possible hai -> Sirf Modal Set karein
          setPreviewFile(file);
          setPreviewUrl(url);
          // New Tab mein open NAHI karna hai
      } else {
          // 3b. Agar Preview possible NAHI hai (e.g. Zip/Word) -> Download/Open in New Tab
          window.open(url, "_blank", "noopener,noreferrer");
      }

    } catch (err) {
      console.error("Error opening file:", err);
      alert("Cannot open file.");
    }
  };

  const sortItems = (items) => {
    return [...items].sort((a, b) => {
      if (sortBy === "name") {
        return (a.name || a.filename).localeCompare(b.name || b.filename);
      }
      if (sortBy === "size") {
        // Folders ka size nahi hota, unhe neeche rakhein
        const sizeA = a.size || 0;
        const sizeB = b.size || 0;
        return sizeB - sizeA; // Largest first
      }
      if (sortBy === "date") {
        // Newest first
        const dateA = new Date(a.upload_date || a.created_at);
        const dateB = new Date(b.upload_date || b.created_at);
        return dateB - dateA;
      }
      return 0;
    });
  };

  // Sorted Lists
  const sortedFolders = sortItems(folders);
  const sortedFiles = sortItems(files);

  const closePreview = () => {
    if (previewUrl) {
        URL.revokeObjectURL(previewUrl); 
    }
    setPreviewFile(null);
    setPreviewUrl(null);
  };

  const handleMenuAction = (action, item) => {
    switch(action) {
        case 'open':
            if (item.type === 'folder') fetchContents(item.id);
            else {handleOpenFile(item); }
            break;
        case 'make_vault':
            handleMakeVaultClick(item); 
            break;
        case 'details':
            handleShowDetails(item);
            break;
        case 'rename':
            setEditing({ id: item.id, type: item.type, name: item.filename || item.name });
            break;
        case 'share':
            handleShareClick(item.id);
            break;
        case 'delete':
            if(item.type === 'folder') handleDeleteFolder(item.id, item.name);
            else handleDeleteFile(item.id);
            break;
        case 'favorite':
            handleToggleFavorite(item.id, item.type, item.is_favorite);
            break;
        case 'spam':
            handleToggleSpam(item.id);
            break;
        case 'download':
            handleOpenFile(item);
            break;
        default:
            break;
    }
  };
 
  const handleMakeVaultClick = (folder) => {
    setSelectedFolder(folder);
    setIsVaultModalOpen(true);
  };

  const handleShowDetails = async (file) => {
    setSelectedFile(file); 
    
    try {
      const response = await api.get(`/api/files/${file.id}/`);
      
      setSelectedFile(response.data); 
      
    } catch (err) {
      console.error("Failed to fetch fresh file details", err);
      setSelectedFile(file);
    }
  };

  const handleVaultCreated = (vaultFolderId) => {
    setFolders((prev) =>
      prev.map((f) =>
        f.id === vaultFolderId ? { ...f, is_vault: true } : f
      )
    );
  };
  
  const handleToggleFavorite = async (id, type, currentStatus) => {
        try {
            await api.post(`/api/${type}s/${id}/favorite/`);
            // UI ko update karein
            if (type === 'file') {
                setFiles(prev => prev.map(f => f.id === id ? { ...f, is_favorite: !currentStatus } : f));
            } else if (type === 'folder') {
                setFolders(prev => prev.map(f => f.id === id ? { ...f, is_favorite: !currentStatus } : f));
            }
        } catch (err) {
            alert(`Failed to toggle favorite status for ${type}.`);
            console.error(err);
        }
    };

  const handleToggleSpam = async (fileId) => {
    // Optimistic UI update: file ko list se turant hata dein
    const originalFiles = [...files];
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    
    try {
      // Backend 'FileMoveToSpamView' ko call karein
      await api.post(`/api/files/${fileId}/spam/`);
      // Hum toast notification yahan add kar sakte hain
      // toast.success('File moved to Spam'); 
    } catch (err) {
      alert("Failed to move file to Spam.");
      setFiles(originalFiles); // Error hone par file wapas le aayein
    }
  };

  // --- Data Fetching ---
  const fetchContents = useCallback(async (folderId) => {
    setLoading(true);
    setError("");
    try {
      const url = folderId
        ? `/api/browse/${folderId}/`
        : "/api/browse/";
      const response = await api.get(url);
      setFolders(response.data.folders || []);
      setFiles(response.data.files || []);
      if (!folderId) {
        setHistory([{ id: null, name: "My Drive" }]);
      }

    } catch (err) {
      setError("Failed to fetch contents. You may need to log in again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Navigation Handlers ---
  const handleFolderClick = (folder) => {
    if (editing.id === folder.id) return;
    if (folder.is_vault && !unlockedVaults[folder.id]) {
      setUnlockModalInfo({ isOpen: true, folder: folder, file: null });
    } else {
      setHistory((prev) => [...prev, folder]);
    }
  };

  const handleBreadcrumbClick = (index) => {
    setHistory((prev) => prev.slice(0, index + 1));
  };

  // --- Folder & File Actions ---
  const handleCreateFolder = async (folderName) => {
    const tempId = `temp-${Date.now()}`;
    const newFolder = { id: tempId, name: folderName };
    setFolders((prev) => [...prev, newFolder]);
    setIsModalOpen(false);

    try {
      const response = await api.post("/api/folders/", {
        name: folderName,
        parent_folder: currentFolderId,
      });
      setFolders((prev) =>
        prev.map((f) => (f.id === tempId ? response.data : f))
      );
    } catch (err) {
      alert("Failed to create folder. A folder with this name may already exist.");
      setFolders((prev) => prev.filter((f) => f.id !== tempId));
    }
  };

  const handleDeleteFolder = async (folderId, folderName) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${folderName}"?\nALL content inside will be permanently deleted.`
      )
    ) {
      const originalFolders = [...folders];
      setFolders((prev) => prev.filter((f) => f.id !== folderId));
      try {
        await api.delete(`/api/folders/${folderId}/`);
      } catch (err) {
        alert("Failed to delete folder.");
        setFolders(originalFolders);
      }
    }
  };
//amu
  const handleDeleteFile = async (fileId) => {
    const originalFiles = [...files];
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    try {
      await api.post(`/api/files/${fileId}/trash/`);
    } catch (err) {
      alert("Failed to move file to trash.");
      setFiles(originalFiles);
    }
  };

  const handleRename = async (id, type, newNameFromChild) => {
    const stateUpdater = type === "folder" ? setFolders : setFiles;
    
    const newName = newNameFromChild.trim();
    let originalName = "";

    if (type === 'folder') {
        originalName = folders.find(f => f.id === id)?.name;
    } else {
        originalName = files.find(f => f.id === id)?.filename;
    }

    setEditing({ id: null, type: null, name: "" });

    if (!newName || newName === originalName) {
      return; 
    }

    stateUpdater((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, name: newName, filename: newName } : i
      )
    );

    // 6. Ab API call karein
    try {
      // --- YEH HAI ASLI FIX ---
      // File ke liye 'filename' aur Folder ke liye 'name' bhejein
      const payload = (type === 'folder') ? { name: newName } : { filename: newName };
      await api.patch(`/api/${type}s/${id}/`, payload);
      // --- FIX YAHAN KHATAM HOTA HAI ---

    } catch (err) {
      alert("Failed to rename.");
      // Rollback
      stateUpdater((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, name: originalName, filename: originalName } : i
        )
      );
    }
  };
  
  const handleSelectItem = (id, type) => {
    const itemId = `${type}-${id}`;
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((i) => i !== itemId)
        : [...prev, itemId]
    );
  };

  const handleBatchDelete = async () => {
    if (
      window.confirm(
        `Are you sure you want to delete ${selectedItems.length} selected items?`
      )
    ) {
      const originalFiles = [...files];
      const originalFolders = [...folders];
      const folderIdsToDelete = selectedItems
        .filter((i) => i.startsWith("folder"))
        .map((i) => parseInt(i.split("-")[1]));
      const fileIdsToDelete = selectedItems
        .filter((i) => i.startsWith("file"))
        .map((i) => parseInt(i.split("-")[1]));

      setFolders((prev) =>
        prev.filter((f) => !folderIdsToDelete.includes(f.id))
      );
      setFiles((prev) => prev.filter((f) => !fileIdsToDelete.includes(f.id)));
      setSelectedItems([]);

      try {
        await Promise.all([
          ...folderIdsToDelete.map((id) => api.delete(`/api/folders/${id}/`)),
          ...fileIdsToDelete.map((id) => api.delete(`/api/files/${id}/`)),
        ]);
      } catch (err) {
        alert("Failed to delete some items.");
        setFiles(originalFiles);
        setFolders(originalFolders);
      }
    }
  };

  const handleSearch = useCallback(async (query, type) => {
    setLoading(true);
    setError("");
    try {
      let url = `/api/search/?q=${query || []}`;
      if (type) {
        url += `&type=${type}`;
      }
      const response = await api.get(url);
      setFolders(response.data.folders || []);
      setFiles(response.data.files || []);
      setHistory([{ id: null, name: `Search results for "${query}"` }]);
    } catch (err) { setError("Search failed."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!searchQuery && !filterType) {
        fetchContents(currentFolderId);
      } else {
        handleSearch(searchQuery, filterType);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, filterType, currentFolderId, handleSearch, fetchContents]);

  const handleUnlockNeeded = (file) => {
    const vaultFolder = currentFolder; 
    
    if (unlockedVaults[vaultFolder.id]) {
      openEncryptedFile(file, unlockedVaults[vaultFolder.id]);
    } else {
      setUnlockModalInfo({ isOpen: true, folder: vaultFolder, file: file });
    }
  };
  
  const handleUnlockSuccess = (password) => {
    const { folder, file } = unlockModalInfo;

    setUnlockedVaults((prev) => ({ ...prev, [folder.id]: password }));
    setUnlockModalInfo({ isOpen: false, folder: null, file: null });

    if (file) {
      openEncryptedFile(file, password);
    } else {
      setHistory((prev) => [...prev, folder]);
    }
  };

  const openEncryptedFile = async (file, password) => {
    try {
      const urlToFetch = `/api/files/${file.id}/open/?vault_pass=${encodeURIComponent(password)}`;
      
      const res = await api.get(urlToFetch, { responseType: 'blob' });
      const blob = res.data;
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      if (err.response && err.response.status === 403) {
          alert("Error: Invalid vault password. Please refresh and try again.");
          setUnlockedVaults((prev) => ({ ...prev, [currentFolder.id]: null }));
      } else {
          alert("Cannot open file. It may be corrupt or the password is wrong.");
      }
    }
  };

  // --- Render ---
  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <>
    <div className="file-dashboard">
      {!currentFolderId && !searchQuery && (
        <QuickAccess />
      )}
      <div className="action-boxes-container">
        <FileUpload
          onUploadSuccess={fetchContents}
          currentFolderId={currentFolderId}
          token={token} // Pass token to upload
        />
        {/* <div
          className="action-box create-folder-box"
          onClick={() => setIsModalOpen(true)}
        >
          <FaFolder className="folder-icon-large" style ={{color: "#FFC107"}} />
          <h3>Create a New Folder</h3>
        </div> */}
      </div>

      <CreateFolderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateFolder}
      />
      <hr style={{ margin: "20px 0" }} />

      <div className="controls-header">
        <div className="breadcrumbs">
          {history.map((folder, index) => (
            <span key={folder.id || "root"} className="breadcrumb-item">
              <button
                onClick={() => handleBreadcrumbClick(index)}
                className="breadcrumb-link"
              >
                {folder.name}
              </button>
              {index < history.length - 1 && (
                <span className="breadcrumb-separator">&gt;</span>
              )}
            </span>
          ))}
        </div>

        <div style={{ position: 'relative', marginRight: '10px' }}>
                <button 
                    className="view-btn" 
                    onClick={() => setShowSortMenu(!showSortMenu)}
                    title="Sort By"
                    style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                    <FaSortAmountDown /> 
                    <span style={{ fontSize: '0.9rem' }}>Sort</span>
                </button>

                {showSortMenu && (
                    <div className="filter-dropdown" style={{ right: 0, width: '150px', top: '110%' }}>
                        <p>Sort By</p>
                        <div className="filter-option" onClick={() => { setSortBy("name"); setShowSortMenu(false); }}>
                            <span>Name (A-Z)</span>
                        </div>
                        <div className="filter-option" onClick={() => { setSortBy("date"); setShowSortMenu(false); }}>
                            <span>Date (Newest)</span>
                        </div>
                        <div className="filter-option" onClick={() => { setSortBy("size"); setShowSortMenu(false); }}>
                            <span>Size (Largest)</span>
                        </div>
                    </div>
                )}
            </div>

        <SetVaultPasswordModal
        isOpen={isVaultModalOpen}
        onClose={() => setIsVaultModalOpen(false)}
        folder={selectedFolder}
        onVaultCreated={handleVaultCreated}
        />
        <UnlockVaultModal
        isOpen={unlockModalInfo.isOpen}
        onClose={() => setUnlockModalInfo({ isOpen: false, folder: null, file: null })}
        folder={unlockModalInfo.folder}
        onUnlockSuccess={handleUnlockSuccess}
        />

        <div className="view-toggle">
          <button 
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="List view"
          >
            <FaList />
          </button>
          <button 
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid view"
          >
            <FaTh />
          </button>
        </div>

        {selectedItems.length > 0 && (
          <button
            onClick={handleBatchDelete}
            className="action-button delete batch-delete"
          >
            <FaTrash /> Delete {selectedItems.length} Selected
          </button>
        )}
      </div>

      <div className={`file-browser-container ${viewMode}`}>
        <div className="file-list">
          {sortedFolders.map((folder) => (
             <div 
               key={folder.id}
               onContextMenu={(e) => handleContextMenu(e, folder, 'folder')}
               style={{ display: 'contents' }} 
             >
            <FolderItem
              folder={folder}
              isSelected={selectedItems.includes(`folder-${folder.id}`)}
              onSelect={handleSelectItem}
              onDoubleClick={handleFolderClick}
              onRename={handleRename}
              onDelete={handleDeleteFolder}
              onToggleFavorite={handleToggleFavorite}
              onMakeVault={handleMakeVaultClick}
              editing={editing}
              setEditing={setEditing}
            />
          </div>
          ))}

          {sortedFiles.map((file) => (
            <div 
             key={file.id}
             onContextMenu={(e) => handleContextMenu(e, file, 'file')}
             style={{ display: 'contents' }}
            >
            <FileItem
              file={file}
              token={token} 
              onDelete={() => handleDeleteFile(file.id)}
              isSelected={selectedItems.includes(`file-${file.id}`)}
              onSelect={handleSelectItem}
              editing={editing}
              setEditing={setEditing}
              onRename={handleRename}
              onToggleFavorite={handleToggleFavorite}
              onShare={handleShareClick}
              isInVault={isCurrentFolderVault}
              onUnlockNeeded={handleUnlockNeeded}
              onToggleSpam={handleToggleSpam}
              onShowDetails={handleShowDetails}
            />
          </div>
          ))}

          {folders.length === 0 && files.length === 0 && (
            <div className="empty-folder-message">
              <p>This folder is empty.</p>
            </div>
          )}
        </div>
      </div>
    </div>
    <DetailsPanel 
        file={selectedFile} 
        onClose={() => setSelectedFile(null)} 
      />
    <ContextMenu 
        position={contextMenu ? {x: contextMenu.x, y: contextMenu.y} : null}
        item={contextMenu ? contextMenu.item : null}
        onClose={() => setContextMenu(null)}
        onAction={handleMenuAction}
      />
    <FilePreviewModal 
        isOpen={!!previewFile}
        onClose={closePreview}
        file={previewFile}
        fileUrl={previewUrl}
      />
    </>
  );
}

export default FileDashboard;
