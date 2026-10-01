import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ConfirmationModal from '../components/ConfirmationModal';
import Pagination from '../components/Pagination';
import {
  Users,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserX,
  UserCheck,
  Trash2,
  Calendar,
  BookOpen,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Filter,
  RefreshCw,
  Mail,
  User as UserIcon,
  ChevronDown,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  RotateCcw,
  Shield
} from 'lucide-react';

const AdminUsersPage = () => {
  const { user: currentUser, token, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    totalReaders: 0
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'suspended'
  const [roleFilter, setRoleFilter] = useState('all'); // 'all', 'reader', 'admin'
  const [sortFilter, setSortFilter] = useState('newest'); // 'newest', 'oldest', 'username_asc', 'username_desc', 'most_blogs', 'most_comments'
  const [activityFilter, setActivityFilter] = useState('all'); // 'all', 'writers', 'commenters', 'inactive'
  const [showFilters, setShowFilters] = useState(false);

  // Active filters counting
  const activeFiltersCount =
    (statusFilter !== 'all' ? 1 : 0) +
    (roleFilter !== 'all' ? 1 : 0) +
    (sortFilter !== 'newest' ? 1 : 0) +
    (activityFilter !== 'all' ? 1 : 0);
  const hasActiveFilters = activeFiltersCount > 0 || Boolean(searchQuery.trim());

  // Action states
  const [actionLoading, setActionLoading] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [userToToggle, setUserToToggle] = useState(null);

  const fetchUsers = useCallback(
    async (targetPage = 1, overrideSearch = null) => {
      setLoading(true);
      setError('');
      try {
        const queryParams = new URLSearchParams({
          page: targetPage,
          limit: pagination.limit
        });
        const query = overrideSearch !== null ? overrideSearch : searchQuery;
        if (query && query.trim()) queryParams.set('search', query.trim());
        if (statusFilter !== 'all') queryParams.set('status', statusFilter);
        if (roleFilter !== 'all') queryParams.set('role', roleFilter);
        if (sortFilter !== 'newest') queryParams.set('sort', sortFilter);
        if (activityFilter !== 'all') queryParams.set('activity', activityFilter);

        const res = await fetch(`/api/users/admin/all?${queryParams.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success) {
          setUsers(data.users || []);
          if (data.stats) setStats(data.stats);
          if (data.pagination) setPagination(data.pagination);
        } else {
          setError(data.message || 'Failed to load user directory.');
        }
      } catch (err) {
        setError('Network error fetching user directory.');
      } finally {
        setLoading(false);
      }
    },
    [token, searchQuery, statusFilter, roleFilter, sortFilter, activityFilter, pagination.limit]
  );

  useEffect(() => {
    if (!isAdmin) {
      navigate('/login');
      return;
    }
    fetchUsers(1);
  }, [isAdmin, navigate, fetchUsers]);

  // Handle Search Form Submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers(1);
  };

  // Reset all filters to default
  const handleResetAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setRoleFilter('all');
    setSortFilter('newest');
    setActivityFilter('all');
  };

  // Toggle user suspension status
  const handleStatusToggle = async () => {
    if (!userToToggle) return;
    const targetId = userToToggle._id || userToToggle.id;
    const newStatus = userToToggle.status === 'suspended' ? 'active' : 'suspended';

    setActionLoading(targetId);
    try {
      const res = await fetch(`/api/users/admin/${targetId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();

      if (data.success) {
        setUsers((prev) =>
          prev.map((u) =>
            (u._id === targetId || u.id === targetId) ? { ...u, status: newStatus } : u
          )
        );
        // Refresh counts
        setStats((prev) => ({
          ...prev,
          activeUsers: newStatus === 'active' ? prev.activeUsers + 1 : prev.activeUsers - 1,
          suspendedUsers: newStatus === 'suspended' ? prev.suspendedUsers + 1 : prev.suspendedUsers - 1
        }));

        setFeedback({
          type: 'success',
          message: data.message || `User status changed to ${newStatus}.`
        });
        setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
      } else {
        setFeedback({ type: 'error', message: data.message || 'Failed to update user status.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Error updating user status.' });
    } finally {
      setActionLoading(null);
      setUserToToggle(null);
    }
  };

  // Confirm delete user
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    const targetId = userToDelete._id || userToDelete.id;

    setActionLoading(targetId);
    try {
      const res = await fetch(`/api/users/admin/${targetId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        setUsers((prev) => prev.filter((u) => u._id !== targetId && u.id !== targetId));
        setStats((prev) => ({
          ...prev,
          totalUsers: Math.max(0, prev.totalUsers - 1),
          activeUsers: userToDelete.status !== 'suspended' ? Math.max(0, prev.activeUsers - 1) : prev.activeUsers,
          suspendedUsers: userToDelete.status === 'suspended' ? Math.max(0, prev.suspendedUsers - 1) : prev.suspendedUsers,
          totalReaders: userToDelete.role === 'reader' ? Math.max(0, prev.totalReaders - 1) : prev.totalReaders
        }));
        setUserToDelete(null);
        setFeedback({
          type: 'success',
          message: data.message || 'User and content successfully purged.'
        });
        setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
      } else {
        setFeedback({ type: 'error', message: data.message || 'Failed to delete user.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Network error deleting user.' });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 6rem' }}>
      {/* Top Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
          <div
            style={{
              padding: '0.5rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(99, 102, 241, 0.12)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Users size={22} />
          </div>
          <h1
            id="admin-users-title"
            style={{ fontSize: '2rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}
          >
            Reader Directory & Moderation
          </h1>
        </div>
        <p className="text-secondary" style={{ fontSize: '0.95rem', margin: 0 }}>
          Manage user accounts, inspect community activity, suspend abusive readers, and oversee user access.
        </p>
      </div>

      {/* Feedback Banner */}
      {feedback.message && (
        <div
          id="admin-users-feedback"
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            background:
              feedback.type === 'error'
                ? 'rgba(244, 63, 94, 0.12)'
                : 'rgba(16, 185, 129, 0.12)',
            color: feedback.type === 'error' ? '#fb7185' : '#10b981',
            border: `1px solid ${
              feedback.type === 'error' ? 'rgba(244, 63, 94, 0.3)' : 'rgba(16, 185, 129, 0.3)'
            }`
          }}
        >
          {feedback.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span style={{ fontSize: '0.925rem', fontWeight: 500 }}>{feedback.message}</span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div
          style={{
            padding: '1rem',
            background: 'rgba(244, 63, 94, 0.1)',
            color: '#fb7185',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Statistics Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem'
        }}
      >
        <div
          className="card"
          id="stat-total-users"
          style={{
            padding: '1.25rem 1.5rem',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Total Registered
            </span>
            <Users size={18} style={{ color: 'var(--primary)' }} />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {stats.totalUsers}
          </div>
        </div>

        <div
          className="card"
          id="stat-active-users"
          style={{
            padding: '1.25rem 1.5rem',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Active Accounts
            </span>
            <UserCheck size={18} style={{ color: '#10b981' }} />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#10b981' }}>
            {stats.activeUsers}
          </div>
        </div>

        <div
          className="card"
          id="stat-suspended-users"
          style={{
            padding: '1.25rem 1.5rem',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Suspended
            </span>
            <UserX size={18} style={{ color: '#f43f5e' }} />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f43f5e' }}>
            {stats.suspendedUsers}
          </div>
        </div>

        <div
          className="card"
          id="stat-total-readers"
          style={{
            padding: '1.25rem 1.5rem',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Reader Community
            </span>
            <BookOpen size={18} style={{ color: '#8b5cf6' }} />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#8b5cf6' }}>
            {stats.totalReaders}
          </div>
        </div>

        <div
          className="card"
          id="stat-admin-users"
          style={{
            padding: '1.25rem 1.5rem',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Administrators
            </span>
            <ShieldCheck size={18} style={{ color: '#ec4899' }} />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#ec4899' }}>
            {Math.max(0, (stats.totalUsers || 0) - (stats.totalReaders || 0))}
          </div>
        </div>
      </div>

      {/* Search & Filters Toolbar */}
      <div className="admin-toolbar-card" id="admin-users-toolbar">
        <form onSubmit={handleSearchSubmit}>
          <div className="admin-search-row">
            {/* Search Input Wrap */}
            <div className="admin-search-input-wrap">
              <Search size={17} className="admin-search-icon" />
              <input
                type="text"
                id="input-search-users"
                className="admin-search-input"
                placeholder="Search by username, email, or bio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  id="btn-clear-search"
                  className="admin-search-clear-btn"
                  onClick={() => {
                    setSearchQuery('');
                    fetchUsers(1, '');
                  }}
                  title="Clear search query"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Filter Toggle Button */}
            <button
              type="button"
              id="btn-apply-filters"
              data-testid="btn-filter-toggle"
              className={`admin-filter-toggle-btn ${showFilters || activeFiltersCount > 0 ? 'active' : ''}`}
              onClick={() => setShowFilters((prev) => !prev)}
              aria-expanded={showFilters}
              title="Toggle directory filter options"
            >
              <Filter size={16} />
              <span>Filter</span>
              {activeFiltersCount > 0 && (
                <span className="admin-filter-badge" id="badge-active-filters-count">
                  {activeFiltersCount}
                </span>
              )}
              <ChevronDown
                size={14}
                style={{
                  transform: showFilters ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease'
                }}
              />
            </button>

            {/* Search Submit Button */}
            <button
              type="submit"
              id="btn-search-users"
              className="btn btn-primary btn-sm"
              style={{ padding: '0.65rem 1.15rem' }}
            >
              <Search size={15} />
              <span>Search</span>
            </button>

            {/* Refresh Directory Button */}
            <button
              type="button"
              id="btn-refresh-users"
              className="btn btn-secondary btn-icon"
              onClick={() => fetchUsers(pagination.page)}
              title="Refresh directory"
              style={{ padding: '0.65rem' }}
            >
              <RefreshCw size={15} className={loading ? 'spin' : ''} />
            </button>
          </div>

          {/* Expandable Filter Options Drawer */}
          {showFilters && (
            <div className="admin-filter-drawer" id="admin-filter-drawer">
              <div className="admin-filter-drawer-header">
                <div className="admin-filter-drawer-title">
                  <SlidersHorizontal size={16} style={{ color: 'var(--primary)' }} />
                  <span>Filter Directory</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                    (Select options to refine the table)
                  </span>
                </div>
                {hasActiveFilters && (
                  <button
                    type="button"
                    id="btn-reset-filters"
                    className="btn btn-ghost btn-sm"
                    onClick={handleResetAllFilters}
                    style={{ fontSize: '0.8rem', gap: '0.35rem', color: 'var(--text-muted)' }}
                  >
                    <RotateCcw size={13} />
                    Reset All Filters
                  </button>
                )}
              </div>

              <div className="admin-filter-grid">
                {/* 1. Account Status */}
                <div className="admin-filter-group">
                  <label htmlFor="select-status-filter" className="admin-filter-label">
                    <Shield size={14} style={{ color: 'var(--primary)' }} />
                    Account Status
                  </label>
                  <select
                    id="select-status-filter"
                    className="admin-filter-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active Only</option>
                    <option value="suspended">Suspended Only</option>
                  </select>
                  <div className="admin-filter-pills">
                    <button
                      type="button"
                      className={`admin-filter-pill ${statusFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setStatusFilter('all')}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      className={`admin-filter-pill ${statusFilter === 'active' ? 'active' : ''}`}
                      onClick={() => setStatusFilter('active')}
                    >
                      Active
                    </button>
                    <button
                      type="button"
                      className={`admin-filter-pill ${statusFilter === 'suspended' ? 'active' : ''}`}
                      onClick={() => setStatusFilter('suspended')}
                    >
                      Suspended
                    </button>
                  </div>
                </div>

                {/* 2. User Role */}
                <div className="admin-filter-group">
                  <label htmlFor="select-user-role" className="admin-filter-label">
                    <UserCheck size={14} style={{ color: 'var(--accent-purple)' }} />
                    User Role
                  </label>
                  <select
                    id="select-user-role"
                    className="admin-filter-select"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <option value="all">All Roles</option>
                    <option value="reader">Readers</option>
                    <option value="admin">Administrators</option>
                  </select>
                  <div className="admin-filter-pills">
                    <button
                      type="button"
                      className={`admin-filter-pill ${roleFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setRoleFilter('all')}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      className={`admin-filter-pill ${roleFilter === 'reader' ? 'active' : ''}`}
                      onClick={() => setRoleFilter('reader')}
                    >
                      Readers
                    </button>
                    <button
                      type="button"
                      className={`admin-filter-pill ${roleFilter === 'admin' ? 'active' : ''}`}
                      onClick={() => setRoleFilter('admin')}
                    >
                      Admins
                    </button>
                  </div>
                </div>

                {/* 3. Sort Order */}
                <div className="admin-filter-group">
                  <label htmlFor="select-user-sort" className="admin-filter-label">
                    <ArrowUpDown size={14} style={{ color: 'var(--accent-amber)' }} />
                    Sort Order
                  </label>
                  <select
                    id="select-user-sort"
                    className="admin-filter-select"
                    value={sortFilter}
                    onChange={(e) => setSortFilter(e.target.value)}
                  >
                    <option value="newest">Newest Registered</option>
                    <option value="oldest">Oldest Registered</option>
                    <option value="username_asc">Username (A - Z)</option>
                    <option value="username_desc">Username (Z - A)</option>
                    <option value="most_blogs">Most Articles Written</option>
                    <option value="most_comments">Most Comments</option>
                  </select>
                </div>

                {/* 4. Activity Filter */}
                <div className="admin-filter-group">
                  <label htmlFor="select-activity-filter" className="admin-filter-label">
                    <BookOpen size={14} style={{ color: 'var(--accent-cyan)' }} />
                    Activity Level
                  </label>
                  <select
                    id="select-activity-filter"
                    className="admin-filter-select"
                    value={activityFilter}
                    onChange={(e) => setActivityFilter(e.target.value)}
                  >
                    <option value="all">All Activity Levels</option>
                    <option value="writers">Writers (Published Articles)</option>
                    <option value="commenters">Commenters (Active Discussions)</option>
                    <option value="inactive">Inactive / Quiet Users</option>
                  </select>
                </div>
              </div>

              <div className="admin-filter-drawer-footer">
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Showing <strong>{pagination.total}</strong> matching {pagination.total === 1 ? 'user' : 'users'}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    type="button"
                    id="btn-close-filter-drawer"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setShowFilters(false)}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    id="btn-apply-drawer"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      fetchUsers(1);
                      setShowFilters(false);
                    }}
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Active Filter Chips Bar */}
          {hasActiveFilters && (
            <div className="admin-active-chips" id="active-filter-chips">
              <span style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Active Filters:
              </span>
              {searchQuery.trim() && (
                <span className="active-filter-chip">
                  Search: "{searchQuery.trim()}"
                  <button
                    type="button"
                    className="active-filter-chip-remove"
                    onClick={() => {
                      setSearchQuery('');
                      fetchUsers(1, '');
                    }}
                    title="Clear search"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className="active-filter-chip">
                  Status: {statusFilter === 'active' ? 'Active' : 'Suspended'}
                  <button
                    type="button"
                    className="active-filter-chip-remove"
                    onClick={() => setStatusFilter('all')}
                    title="Remove status filter"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              {roleFilter !== 'all' && (
                <span className="active-filter-chip">
                  Role: {roleFilter === 'reader' ? 'Reader' : 'Administrator'}
                  <button
                    type="button"
                    className="active-filter-chip-remove"
                    onClick={() => setRoleFilter('all')}
                    title="Remove role filter"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              {sortFilter !== 'newest' && (
                <span className="active-filter-chip">
                  Sort: {sortFilter === 'oldest' ? 'Oldest' : sortFilter === 'username_asc' ? 'A-Z' : sortFilter === 'username_desc' ? 'Z-A' : sortFilter === 'most_blogs' ? 'Most Articles' : 'Most Comments'}
                  <button
                    type="button"
                    className="active-filter-chip-remove"
                    onClick={() => setSortFilter('newest')}
                    title="Reset sort"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              {activityFilter !== 'all' && (
                <span className="active-filter-chip">
                  Activity: {activityFilter === 'writers' ? 'Writers' : activityFilter === 'commenters' ? 'Commenters' : 'Inactive'}
                  <button
                    type="button"
                    className="active-filter-chip-remove"
                    onClick={() => setActivityFilter('all')}
                    title="Remove activity filter"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                id="btn-clear-all-chips"
                onClick={handleResetAllFilters}
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', color: 'var(--color-error)' }}
              >
                Clear All
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Users Table */}
      <div
        className="card"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        {loading ? (
          <div style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>Loading user directory...</p>
          </div>
        ) : users.length === 0 ? (
          <div
            id="admin-users-empty"
            style={{
              padding: '4rem 2rem',
              textAlign: 'center',
              color: 'var(--text-secondary)'
            }}
          >
            <Users size={36} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              No Users Found
            </h3>
            <p style={{ maxWidth: '400px', margin: '0 auto', fontSize: '0.9rem' }}>
              No user accounts matched the given search query or filters.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              id="admin-users-table"
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '0.9rem'
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid var(--border-color)',
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.8rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  <th style={{ padding: '1rem 1.25rem' }}>User</th>
                  <th style={{ padding: '1rem 1rem' }}>Role</th>
                  <th style={{ padding: '1rem 1rem' }}>Status</th>
                  <th style={{ padding: '1rem 1rem' }}>Activity</th>
                  <th style={{ padding: '1rem 1rem' }}>Joined</th>
                  <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isCurrentAdmin =
                    currentUser &&
                    (u._id === currentUser._id || u.id === currentUser._id || u.username === currentUser.username);
                  const isUserAdmin = u.role === 'admin';
                  const isSuspended = u.status === 'suspended';

                  return (
                    <tr
                      key={u._id || u.id}
                      id={`user-row-${u.username}`}
                      data-user-id={u._id || u.id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      {/* User Info */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <div
                            className="avatar avatar-sm"
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              overflow: 'hidden'
                            }}
                          >
                            {u.profilePicture || u.avatar ? (
                              <img
                                src={u.profilePicture || u.avatar}
                                alt={u.username}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              u.initials || u.username.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div
                              id={`user-username-${u._id || u.id}`}
                              style={{
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem'
                              }}
                            >
                              <span>{u.username}</span>
                              {isCurrentAdmin && (
                                <span
                                  style={{
                                    fontSize: '0.7rem',
                                    padding: '0.1rem 0.4rem',
                                    borderRadius: 'var(--radius-sm)',
                                    background: 'rgba(99, 102, 241, 0.15)',
                                    color: 'var(--primary)'
                                  }}
                                >
                                  You
                                </span>
                              )}
                            </div>
                            <div
                              id={`user-email-${u._id || u.id}`}
                              style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}
                            >
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td style={{ padding: '1rem 1rem' }}>
                        <span
                          id={`user-role-${u._id || u.id}`}
                          className={`badge ${isUserAdmin ? 'badge-admin' : 'badge-reader'}`}
                        >
                          {u.role === 'admin' ? 'Admin' : 'Reader'}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '1rem 1rem' }}>
                        <span
                          id={`user-status-badge-${u._id || u.id}`}
                          className={`badge ${isSuspended ? 'badge-suspended' : 'badge-active'}`}
                        >
                          {isSuspended ? 'Suspended' : 'Active'}
                        </span>
                      </td>

                      {/* Activity */}
                      <td style={{ padding: '1rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem' }}>
                          <span
                            id={`user-blogs-count-${u._id || u.id}`}
                            className="metric-blogs"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)' }}
                            title="Stories Authored"
                          >
                            <BookOpen size={14} />
                            {u.blogsCount || 0}
                          </span>
                          <span
                            id={`user-comments-count-${u._id || u.id}`}
                            className="metric-comments"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)' }}
                            title="Comments Posted"
                          >
                            <MessageSquare size={14} />
                            {u.commentsCount || 0}
                          </span>
                        </div>
                      </td>

                      {/* Joined Date */}
                      <td style={{ padding: '1rem 1rem', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                          {/* Suspend / Reactivate button */}
                          <button
                            type="button"
                            id={isSuspended ? `btn-reactivate-${u.username}` : `btn-suspend-${u.username}`}
                            className={`btn btn-sm ${isSuspended ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => setUserToToggle(u)}
                            disabled={isCurrentAdmin || actionLoading === (u._id || u.id)}
                            title={
                              isCurrentAdmin
                                ? 'Administrators cannot suspend their own active account'
                                : isSuspended
                                ? 'Re-activate reader account'
                                : 'Suspend reader account'
                            }
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                          >
                            {isSuspended ? (
                              <>
                                <UserCheck size={14} />
                                <span>Reactivate</span>
                              </>
                            ) : (
                              <>
                                <UserX size={14} />
                                <span>Suspend</span>
                              </>
                            )}
                          </button>

                          {/* Delete user button */}
                          <button
                            type="button"
                            id={`btn-delete-${u.username}`}
                            className="btn btn-ghost btn-sm text-accent-rose"
                            onClick={() => setUserToDelete(u)}
                            disabled={isCurrentAdmin || isUserAdmin || actionLoading === (u._id || u.id)}
                            title={
                              isCurrentAdmin
                                ? 'Administrators cannot delete their own active account'
                                : isUserAdmin
                                ? 'Administrator accounts cannot be deleted'
                                : 'Permanently delete reader account'
                            }
                            style={{ padding: '0.3rem 0.5rem' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div style={{ padding: '1.25rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'center' }}>
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(p) => fetchUsers(p)}
            />
          </div>
        )}
      </div>

      {/* Confirmation Modal for Suspension / Re-activation */}
      <ConfirmationModal
        isOpen={Boolean(userToToggle)}
        title={userToToggle?.status === 'suspended' ? 'Reactivate User Account' : 'Suspend User Account'}
        message={
          userToToggle
            ? userToToggle.status === 'suspended'
              ? `Are you sure you want to re-activate the account for @${userToToggle.username}? The user will regain ability to log in and participate.`
              : `Are you sure you want to suspend @${userToToggle.username}? The user will be immediately blocked from logging in or making authenticated requests.`
            : ''
        }
        confirmText={userToToggle?.status === 'suspended' ? 'Reactivate Account' : 'Suspend Account'}
        confirmVariant={userToToggle?.status === 'suspended' ? 'primary' : 'danger'}
        loading={actionLoading === (userToToggle?._id || userToToggle?.id)}
        onConfirm={handleStatusToggle}
        onClose={() => setUserToToggle(null)}
      />

      {/* Confirmation Modal for User Deletion */}
      <ConfirmationModal
        isOpen={Boolean(userToDelete)}
        title="Permanently Delete User Account"
        message={
          userToDelete
            ? `Are you sure you want to permanently delete @${userToDelete.username}? All authored articles (${userToDelete.blogsCount || 0}), comments (${userToDelete.commentsCount || 0}), and discussions will be safely purged. This action CANNOT be undone.`
            : ''
        }
        confirmText="Delete User & Content"
        confirmVariant="danger"
        loading={actionLoading === (userToDelete?._id || userToDelete?.id)}
        onConfirm={handleConfirmDelete}
        onClose={() => setUserToDelete(null)}
      />
    </div>
  );
};

export default AdminUsersPage;
