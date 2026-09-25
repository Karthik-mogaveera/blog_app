import React, { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import NotificationDropdown from './NotificationDropdown';
import {
  BookOpen,
  LayoutDashboard,
  ShieldCheck,
  Bell,
  LogOut,
  LogIn,
  UserPlus,
  Sun,
  Moon,
  Menu,
  X,
  PenSquare,
  Bookmark
} from 'lucide-react';

const Navbar = () => {
  const { user, isAdmin, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isAdminPage = location.pathname.startsWith('/admin');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="container nav-container">
        {/* Brand Logo */}
        <Link
          to="/"
          className="nav-logo"
          id="nav-brand-logo"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div className="nav-logo-icon">
            <BookOpen size={20} />
          </div>
          <span>Chronicle</span>
        </Link>

        {/* Desktop Center Navigation Links */}
        <nav className="nav-menu nav-desktop-menu">
          <NavLink
            to="/"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            id="nav-link-home"
            end
          >
            Articles
          </NavLink>

          {isAdmin && (
            <>
              <NavLink
                to="/admin/blogs"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                id="nav-link-admin-studio"
              >
                <LayoutDashboard size={16} />
                Blog Studio
              </NavLink>
              <NavLink
                to="/admin/comments"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                id="nav-link-admin-moderation"
              >
                <ShieldCheck size={16} />
                Moderation
              </NavLink>
            </>
          )}

          {user && (
            <>
              <NavLink
                to="/create-blog"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                id="nav-link-write"
              >
                <PenSquare size={16} />
                Write
              </NavLink>
              <NavLink
                to="/saved"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                id="nav-link-saved"
              >
                <Bookmark size={16} />
                Saved
              </NavLink>
              <NavLink
                to="/my-stories"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                id="nav-link-my-stories"
              >
                <BookOpen size={16} />
                My Stories
              </NavLink>
            </>
          )}
        </nav>

        {/* Right Actions & Controls */}
        <div className="nav-actions">
          {/* Light / Dark Mode Toggle (Always visible) */}
          <button
            type="button"
            className="theme-toggle-btn"
            id="theme-toggle-btn"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Notification Bell (Visible if logged in) */}
          {user && (
            <div className="notification-wrapper">
              <button
                type="button"
                className="notification-bell-btn"
                id="nav-notification-bell"
                onClick={() => setShowNotifications(!showNotifications)}
                title="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="unread-badge" id="nav-unread-count">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              <NotificationDropdown
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
              />
            </div>
          )}

          {/* Desktop-Only Actions */}
          <div className="nav-desktop-actions">
            {user ? (
              <>
                {/* User Profile Pill */}
                <div className="flex items-center gap-2" id="nav-user-pill">
                  <div className="avatar avatar-sm" title={user.username}>
                    {user.initials || user.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-col" style={{ lineHeight: 1.2 }}>
                    <span className="font-semibold text-sm">{user.username}</span>
                    {isAdmin && <span className="badge badge-admin">Admin</span>}
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="btn btn-ghost btn-sm"
                  id="nav-btn-logout"
                  title="Log out"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn btn-outline btn-sm" id="nav-btn-login">
                  <LogIn size={16} />
                  <span>Sign In</span>
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm" id="nav-btn-register">
                  <UserPlus size={16} />
                  <span>Get Started</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Hamburger Toggle Button */}
          <button
            type="button"
            className="nav-mobile-toggle"
            id="nav-mobile-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-down Drawer */}
      {isMobileMenuOpen && (
        <div className="nav-mobile-drawer" id="nav-mobile-drawer">
          <NavLink
            to="/"
            className={({ isActive }) => `nav-mobile-link ${isActive ? 'active' : ''}`}
            id="nav-mobile-link-home"
            onClick={() => setIsMobileMenuOpen(false)}
            end
          >
            <BookOpen size={18} />
            <span>Articles</span>
          </NavLink>

          {isAdmin && (
            <>
              <NavLink
                to="/admin/blogs"
                className={({ isActive }) => `nav-mobile-link ${isActive ? 'active' : ''}`}
                id="nav-mobile-link-admin-studio"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <LayoutDashboard size={18} />
                <span>Blog Studio</span>
              </NavLink>
              <NavLink
                to="/admin/comments"
                className={({ isActive }) => `nav-mobile-link ${isActive ? 'active' : ''}`}
                id="nav-mobile-link-admin-moderation"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <ShieldCheck size={18} />
                <span>Moderation</span>
              </NavLink>
            </>
          )}

          {user && (
            <>
              <NavLink
                to="/create-blog"
                className={({ isActive }) => `nav-mobile-link ${isActive ? 'active' : ''}`}
                id="nav-mobile-link-write"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <PenSquare size={18} />
                <span>Write Story</span>
              </NavLink>
              <NavLink
                to="/saved"
                className={({ isActive }) => `nav-mobile-link ${isActive ? 'active' : ''}`}
                id="nav-mobile-link-saved"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Bookmark size={18} />
                <span>Saved Articles</span>
              </NavLink>
              <NavLink
                to="/my-stories"
                className={({ isActive }) => `nav-mobile-link ${isActive ? 'active' : ''}`}
                id="nav-mobile-link-my-stories"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <BookOpen size={18} />
                <span>My Stories</span>
              </NavLink>
            </>
          )}

          <div className="nav-mobile-divider" />

          {user ? (
            <div className="nav-mobile-user-section">
              <div className="flex items-center gap-2" id="nav-mobile-user-pill">
                <div className="avatar avatar-sm">
                  {user.initials || user.username.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">{user.username}</span>
                  {isAdmin && <span className="badge badge-admin" style={{ alignSelf: 'flex-start' }}>Admin</span>}
                </div>
              </div>
              <button
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="btn btn-ghost btn-sm w-full"
                id="nav-mobile-btn-logout"
                style={{ justifyContent: 'flex-start', color: '#fb7185' }}
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                to="/login"
                className="btn btn-outline btn-sm w-full"
                id="nav-mobile-btn-login"
                onClick={() => setIsMobileMenuOpen(false)}
                style={{ justifyContent: 'center' }}
              >
                <LogIn size={16} />
                <span>Sign In</span>
              </Link>
              <Link
                to="/register"
                className="btn btn-primary btn-sm w-full"
                id="nav-mobile-btn-register"
                onClick={() => setIsMobileMenuOpen(false)}
                style={{ justifyContent: 'center' }}
              >
                <UserPlus size={16} />
                <span>Get Started</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
