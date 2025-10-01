import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import WalletInfo from "./WalletInfo";
import "./Navbar.css";
import ImageUpload from "./ImageUpload";

const Navbar: React.FC = () => {
  const { isLoggedIn, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showWallet, setShowWallet] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!isLoggedIn) return null;

  const navigationItems = [
    { label: "Chat", path: "/", icon: "" },
    { label: "Dashboard", path: "/dashboard", icon: "" },
    { label: "Agent Launcher", path: "/agent", icon: "" },
    { label: "Leaderboard", path: "/leaderboard", icon: "🏆" },
  ];

  return (
    <>
      <div className="navbar-floating-container">
        {/* Left - Account Info */}
        <div
          className="navbar-account-floating"
          onClick={() => setShowWallet(true)}
        >
          <div className="user-avatar">
            {user?.email?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="user-info">
            <div className="user-name">
              {user?.email?.split("@")[0] || "User"}
            </div>
            <div className="user-wallet">
              {user?.accountName?.slice(0, 6)}...
              {user?.accountName?.slice(-4) || ""}
            </div>
          </div>
        </div>

        {/* Center - Navigation Pills */}
        <div className="navbar-center-pill">
          <div className="nav-tabs-pill">
            {navigationItems.map((item) => (
              <button
                key={item.path}
                className={`nav-tab-pill ${
                  location.pathname === item.path ? "active" : ""
                }`}
                onClick={() => navigate(item.path)}
              >
                <span className="nav-tab-icon">{item.icon}</span>
                <span className="nav-tab-label">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right - Actions */}
        <div className="navbar-actions-floating">
          <button
            className="navbar-action-btn wallet-btn"
            onClick={() => setShowWallet(true)}
          >
            Wallet
          </button>
          <button
            className="navbar-action-btn upload-btn"
            onClick={() => setShowUploadModal(true)}
          >
            Upload Image
          </button>
          <button
            className="navbar-action-btn logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Wallet Modal */}
      {showWallet && (
        <div className="wallet-overlay">
          <div
            className="wallet-overlay-backdrop"
            onClick={() => setShowWallet(false)}
          />
          <div
            className={`wallet-overlay-content ${
              showWallet ? "wallet-overlay-content-visible" : ""
            }`}
          >
            <WalletInfo />
            <button
              className="wallet-overlay-close"
              onClick={() => setShowWallet(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showUploadModal && (
        <div className="wallet-overlay">
          <div
            className="wallet-overlay-backdrop"
            onClick={() => setShowUploadModal(false)}
          />
          <div
            className={`wallet-overlay-content ${
              showUploadModal ? "wallet-overlay-content-visible" : ""
            }`}
          >
            <ImageUpload />
            <button
              className="wallet-overlay-close"
              onClick={() => setShowUploadModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
