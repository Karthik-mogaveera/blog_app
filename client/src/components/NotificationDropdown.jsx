import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { Bell, CheckCheck, MessageSquare, CornerDownRight } from 'lucide-react';

const NotificationDropdown = ({ isOpen, onClose }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleNotificationClick = async (n) => {
    if (!n.isRead) {
      await markAsRead(n._id || n.id);
    }
    onClose();
    if (n.blogId) {
      const blogId = n.blogId._id || n.blogId;
      navigate(`/blog/${blogId}`);
    }
  };

  return (
    <div className="notification-dropdown" ref={dropdownRef}>
      <div className="notification-header">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-primary" />
          <span className="font-bold text-sm">Notifications</span>
          {unreadCount > 0 && (
            <span className="badge badge-Technology" style={{ fontSize: '0.65rem' }}>
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="btn-ghost text-xs flex items-center gap-1 text-muted"
            title="Mark all as read"
          >
            <CheckCheck size={14} />
            Mark all read
          </button>
        )}
      </div>

      <div className="notification-list">
        {notifications.length === 0 ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id || n.id}
              className={`notification-item ${!n.isRead ? 'unread' : ''}`}
              onClick={() => handleNotificationClick(n)}
            >
              <div className="flex items-center gap-2">
                {n.type === 'reply' ? (
                  <CornerDownRight size={14} className="text-accent-cyan" />
                ) : (
                  <MessageSquare size={14} className="text-primary" />
                )}
                <span className="notification-msg">{n.message}</span>
              </div>
              <span className="notification-time">
                {new Date(n.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;
