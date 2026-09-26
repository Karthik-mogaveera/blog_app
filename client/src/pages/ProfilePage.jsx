import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ConfirmationModal from '../components/ConfirmationModal';
import {
  User,
  Camera,
  Trash2,
  Edit3,
  Globe,
  Github,
  Twitter,
  Linkedin,
  Calendar,
  Heart,
  MessageSquare,
  BookOpen,
  Plus,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  FileText,
  Clock,
  Sparkles,
  Save,
  X
} from 'lucide-react';

const ProfilePage = () => {
  const { user, token, updateUser, isAdmin } = useAuth();
  const fileInputRef = useRef(null);

  // Profile data & edit state
  const [profile, setProfile] = useState({
    username: user?.username || '',
    email: user?.email || '',
    bio: user?.bio || '',
    profilePicture: user?.profilePicture || user?.avatar || '',
    socialLinks: {
      website: user?.socialLinks?.website || '',
      twitter: user?.socialLinks?.twitter || '',
      github: user?.socialLinks?.github || '',
      linkedin: user?.socialLinks?.linkedin || ''
    },
    role: user?.role || 'reader',
    createdAt: user?.createdAt || null
  });

  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editSocial, setEditSocial] = useState({
    website: '',
    twitter: '',
    github: '',
    linkedin: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState({ type: '', message: '' });

  // Stories state
  const [stories, setStories] = useState([]);
  const [loadingStories, setLoadingStories] = useState(true);
  const [storiesError, setStoriesError] = useState('');
  const [storyFilter, setStoryFilter] = useState('all'); // 'all', 'published', 'draft'
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [storyToDelete, setStoryToDelete] = useState(null);

  // Fetch full profile from GET /api/users/profile
  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.user) {
        setProfile({
          username: data.user.username || '',
          email: data.user.email || '',
          bio: data.user.bio || '',
          profilePicture: data.user.profilePicture || data.user.avatar || '',
          socialLinks: {
            website: data.user.socialLinks?.website || '',
            twitter: data.user.socialLinks?.twitter || '',
            github: data.user.socialLinks?.github || '',
            linkedin: data.user.socialLinks?.linkedin || ''
          },
          role: data.user.role || 'reader',
          createdAt: data.user.createdAt || null
        });
        updateUser(data.user);
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
    }
  }, [token, updateUser]);

  // Fetch authored stories from GET /api/blogs/me/stories
  const fetchMyStories = useCallback(async () => {
    setLoadingStories(true);
    setStoriesError('');
    try {
      const res = await fetch('/api/blogs/me/stories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setStories(data.blogs || []);
      } else {
        setStoriesError(data.message || 'Failed to load your stories.');
      }
    } catch (err) {
      setStoriesError('Network error loading your stories.');
    } finally {
      setLoadingStories(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchProfile();
      fetchMyStories();
    }
  }, [token]);

  // Handle entering edit mode
  const handleStartEdit = () => {
    setEditBio(profile.bio || '');
    setEditSocial({
      website: profile.socialLinks?.website || '',
      twitter: profile.socialLinks?.twitter || '',
      github: profile.socialLinks?.github || '',
      linkedin: profile.socialLinks?.linkedin || ''
    });
    setProfileFeedback({ type: '', message: '' });
    setIsEditingBio(true);
  };

  // Handle saving bio & social links
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (editBio.length > 500) {
      setProfileFeedback({ type: 'error', message: 'Bio cannot exceed 500 characters.' });
      return;
    }

    setSavingProfile(true);
    setProfileFeedback({ type: '', message: '' });

    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          bio: editBio,
          socialLinks: editSocial
        })
      });

      const data = await res.json();
      if (data.success && data.user) {
        setProfile((prev) => ({
          ...prev,
          bio: data.user.bio || '',
          socialLinks: data.user.socialLinks || prev.socialLinks
        }));
        updateUser(data.user);
        setIsEditingBio(false);
        setProfileFeedback({ type: 'success', message: 'Profile details updated successfully!' });
        setTimeout(() => setProfileFeedback({ type: '', message: '' }), 4000);
      } else {
        setProfileFeedback({ type: 'error', message: data.message || 'Failed to update profile.' });
      }
    } catch (err) {
      setProfileFeedback({ type: 'error', message: 'Network error saving profile changes.' });
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle avatar photo upload
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WEBP, GIF).');
      return;
    }

    // Limit to 5MB to avoid oversized base64 payloads
    if (file.size > 5 * 1024 * 1024) {
      alert('Image file is too large. Please select an image under 5MB.');
      return;
    }

    setUploadingPhoto(true);
    const reader = new FileReader();

    reader.onload = async () => {
      const base64Data = reader.result;
      try {
        const res = await fetch('/api/users/profile', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            profilePicture: base64Data
          })
        });

        const data = await res.json();
        if (data.success && data.user) {
          setProfile((prev) => ({
            ...prev,
            profilePicture: data.user.profilePicture || data.user.avatar || base64Data
          }));
          updateUser(data.user);
          setProfileFeedback({ type: 'success', message: 'Profile photo updated successfully!' });
          setTimeout(() => setProfileFeedback({ type: '', message: '' }), 3500);
        } else {
          alert(data.message || 'Failed to update profile photo.');
        }
      } catch (err) {
        alert('Network error uploading profile photo.');
      } finally {
        setUploadingPhoto(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.onerror = () => {
      alert('Failed to read image file.');
      setUploadingPhoto(false);
    };

    reader.readAsDataURL(file);
  };

  // Handle removing profile photo
  const handleRemovePhoto = async () => {
    if (!profile.profilePicture) return;
    setUploadingPhoto(true);

    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          profilePicture: ''
        })
      });

      const data = await res.json();
      if (data.success && data.user) {
        setProfile((prev) => ({
          ...prev,
          profilePicture: ''
        }));
        updateUser(data.user);
        setProfileFeedback({ type: 'success', message: 'Profile photo removed.' });
        setTimeout(() => setProfileFeedback({ type: '', message: '' }), 3000);
      }
    } catch (err) {
      alert('Error removing photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Toggle Publish / Unpublish for a story
  const handleTogglePublish = async (blog) => {
    const blogId = blog._id || blog.id;
    setTogglingId(blogId);
    try {
      const res = await fetch(`/api/blogs/${blogId}/publish`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setStories((prev) =>
          prev.map((b) =>
            (b._id === blogId || b.id === blogId) ? { ...b, status: data.status } : b
          )
        );
      } else {
        alert(data.message || 'Failed to update publication status');
      }
    } catch (err) {
      alert('Network error updating status');
    } finally {
      setTogglingId(null);
    }
  };

  // Confirm delete story
  const handleConfirmDelete = async () => {
    if (!storyToDelete) return;
    const blogId = storyToDelete._id || storyToDelete.id;

    setDeletingId(blogId);
    try {
      const res = await fetch(`/api/blogs/${blogId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setStories((prev) => prev.filter((b) => b._id !== blogId && b.id !== blogId));
        setStoryToDelete(null);
      } else {
        alert(data.message || 'Failed to delete story.');
      }
    } catch (err) {
      alert('Error deleting story.');
    } finally {
      setDeletingId(null);
    }
  };

  // Calculate story metrics
  const totalStories = stories.length;
  const publishedStories = stories.filter((s) => s.status === 'published').length;
  const draftStories = stories.filter((s) => s.status !== 'published').length;
  const totalLikes = stories.reduce((acc, s) => acc + (s.likeCount || 0), 0);
  const totalComments = stories.reduce((acc, s) => acc + (s.commentCount || 0), 0);

  // Filtered stories list
  const filteredStories = stories.filter((story) => {
    if (storyFilter === 'published') return story.status === 'published';
    if (storyFilter === 'draft') return story.status !== 'published';
    return true;
  });

  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        year: 'numeric'
      })
    : null;

  return (
    <div className="container" style={{ maxWidth: '980px', paddingTop: '2.5rem', paddingBottom: '6rem' }}>
      {/* Feedback Banner */}
      {profileFeedback.message && (
        <div
          id="profile-feedback-alert"
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            background:
              profileFeedback.type === 'error'
                ? 'rgba(244, 63, 94, 0.12)'
                : 'rgba(16, 185, 129, 0.12)',
            color: profileFeedback.type === 'error' ? '#fb7185' : '#10b981',
            border: `1px solid ${
              profileFeedback.type === 'error' ? 'rgba(244, 63, 94, 0.3)' : 'rgba(16, 185, 129, 0.3)'
            }`
          }}
        >
          {profileFeedback.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span style={{ fontSize: '0.925rem', fontWeight: 500 }}>{profileFeedback.message}</span>
        </div>
      )}

      {/* =========================================================================
          PROFILE HEADER CARD
          ========================================================================= */}
      <div
        className="card profile-hero-card"
        id="profile-header-card"
        style={{
          padding: '2.25rem',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '2.5rem',
          boxShadow: 'var(--shadow-md)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Subtle decorative background gradient accent */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: 'var(--gradient-primary)'
          }}
        />

        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {/* Avatar & Photo Upload Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <div
              className="profile-avatar-container"
              style={{
                position: 'relative',
                width: '108px',
                height: '108px',
                borderRadius: '50%',
                overflow: 'hidden',
                background: 'var(--gradient-primary)',
                boxShadow: '0 8px 24px rgba(99, 102, 241, 0.25)',
                border: '3px solid var(--bg-surface)'
              }}
            >
              {profile.profilePicture ? (
                <img
                  src={profile.profilePicture}
                  alt={profile.username}
                  id="profile-avatar-image"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  id="profile-avatar-initials"
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.25rem',
                    fontWeight: 800,
                    color: '#ffffff'
                  }}
                >
                  {user?.initials || profile.username.slice(0, 2).toUpperCase() || 'U'}
                </div>
              )}

              {/* Uploading Spinner Overlay */}
              {uploadingPhoto && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '0.75rem'
                  }}
                >
                  Uploading...
                </div>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: 'none' }}
              id="input-avatar-file"
            />

            {/* Photo Action Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                id="btn-upload-photo-trigger"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', gap: '0.35rem' }}
                title="Upload or change profile photo"
              >
                <Camera size={14} />
                <span>{profile.profilePicture ? 'Change' : 'Upload'}</span>
              </button>

              {profile.profilePicture && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm text-accent-rose"
                  id="btn-remove-photo"
                  onClick={handleRemovePhoto}
                  disabled={uploadingPhoto}
                  style={{ padding: '0.35rem 0.5rem' }}
                  title="Remove photo and use initials avatar"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          {/* User Details & Bio Content */}
          <div style={{ flex: 1, minWidth: '280px' }}>
            {/* Username, Role & Edit Profile Button */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '0.75rem',
                marginBottom: '0.5rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <h1
                    id="profile-username"
                    style={{
                      fontSize: '1.85rem',
                      fontWeight: 800,
                      margin: 0,
                      letterSpacing: '-0.02em',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {profile.username}
                  </h1>
                  <span
                    id="profile-role-badge"
                    className={`badge ${profile.role === 'admin' ? 'badge-admin' : 'badge-reader'}`}
                    style={{ textTransform: 'capitalize' }}
                  >
                    {profile.role}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                  <span
                    id="profile-email"
                    style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}
                  >
                    {profile.email}
                  </span>
                  {memberSince && (
                    <span
                      id="profile-joined-date"
                      className="text-xs text-muted flex items-center gap-1"
                    >
                      <Calendar size={13} />
                      Member since {memberSince}
                    </span>
                  )}
                </div>
              </div>

              {!isEditingBio && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  id="btn-edit-profile"
                  onClick={handleStartEdit}
                  style={{ gap: '0.4rem' }}
                >
                  <Edit3 size={15} />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>

            {/* Read Mode vs Edit Mode for Bio & Social Links */}
            {!isEditingBio ? (
              <div style={{ marginTop: '1.25rem' }}>
                {/* Bio Display */}
                <p
                  id="profile-bio-text"
                  style={{
                    fontSize: '0.95rem',
                    lineHeight: '1.6',
                    color: profile.bio ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontStyle: profile.bio ? 'normal' : 'italic',
                    whiteSpace: 'pre-line',
                    margin: 0
                  }}
                >
                  {profile.bio || 'No bio provided yet. Click "Edit Profile" to tell readers about yourself and showcase your social links.'}
                </p>

                {/* Social / Portfolio Links Display */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginTop: '1rem',
                    flexWrap: 'wrap'
                  }}
                >
                  {profile.socialLinks?.website && (
                    <a
                      href={
                        profile.socialLinks.website.startsWith('http')
                          ? profile.socialLinks.website
                          : `https://${profile.socialLinks.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost btn-sm"
                      id="link-social-website"
                      style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem', gap: '0.35rem' }}
                      title="Personal Website"
                    >
                      <Globe size={14} />
                      <span>Website</span>
                    </a>
                  )}

                  {profile.socialLinks?.github && (
                    <a
                      href={
                        profile.socialLinks.github.startsWith('http')
                          ? profile.socialLinks.github
                          : `https://github.com/${profile.socialLinks.github.replace('@', '')}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost btn-sm"
                      id="link-social-github"
                      style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem', gap: '0.35rem' }}
                      title="GitHub Profile"
                    >
                      <Github size={14} />
                      <span>GitHub</span>
                    </a>
                  )}

                  {profile.socialLinks?.twitter && (
                    <a
                      href={
                        profile.socialLinks.twitter.startsWith('http')
                          ? profile.socialLinks.twitter
                          : `https://twitter.com/${profile.socialLinks.twitter.replace('@', '')}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost btn-sm"
                      id="link-social-twitter"
                      style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem', gap: '0.35rem' }}
                      title="Twitter / X"
                    >
                      <Twitter size={14} />
                      <span>Twitter</span>
                    </a>
                  )}

                  {profile.socialLinks?.linkedin && (
                    <a
                      href={
                        profile.socialLinks.linkedin.startsWith('http')
                          ? profile.socialLinks.linkedin
                          : `https://linkedin.com/in/${profile.socialLinks.linkedin.replace('@', '')}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost btn-sm"
                      id="link-social-linkedin"
                      style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem', gap: '0.35rem' }}
                      title="LinkedIn"
                    >
                      <Linkedin size={14} />
                      <span>LinkedIn</span>
                    </a>
                  )}
                </div>
              </div>
            ) : (
              /* Inline Edit Form for Bio and Social Links */
              <form
                id="form-edit-profile"
                onSubmit={handleSaveProfile}
                style={{
                  marginTop: '1.25rem',
                  padding: '1.25rem',
                  background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)'
                }}
              >
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <label
                      htmlFor="input-profile-bio"
                      style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}
                    >
                      About You (Bio)
                    </label>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: editBio.length > 500 ? '#fb7185' : 'var(--text-muted)'
                      }}
                    >
                      {editBio.length}/500
                    </span>
                  </div>
                  <textarea
                    id="input-profile-bio"
                    className="form-control"
                    rows={3}
                    placeholder="Write a brief introduction, your writing interests, or tech stack..."
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    maxLength={500}
                    style={{
                      width: '100%',
                      background: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.65rem 0.85rem'
                    }}
                  />
                </div>

                {/* Social & Portfolio Links Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '0.85rem',
                    marginBottom: '1.25rem'
                  }}
                >
                  <div>
                    <label
                      htmlFor="input-social-website"
                      style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}
                    >
                      <Globe size={13} />
                      Website
                    </label>
                    <input
                      type="text"
                      id="input-social-website"
                      className="form-control"
                      placeholder="https://yourdomain.com"
                      value={editSocial.website}
                      onChange={(e) => setEditSocial({ ...editSocial, website: e.target.value })}
                      style={{ fontSize: '0.85rem', padding: '0.45rem 0.75rem' }}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="input-social-github"
                      style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}
                    >
                      <Github size={13} />
                      GitHub
                    </label>
                    <input
                      type="text"
                      id="input-social-github"
                      className="form-control"
                      placeholder="username or URL"
                      value={editSocial.github}
                      onChange={(e) => setEditSocial({ ...editSocial, github: e.target.value })}
                      style={{ fontSize: '0.85rem', padding: '0.45rem 0.75rem' }}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="input-social-twitter"
                      style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}
                    >
                      <Twitter size={13} />
                      Twitter / X
                    </label>
                    <input
                      type="text"
                      id="input-social-twitter"
                      className="form-control"
                      placeholder="@handle or URL"
                      value={editSocial.twitter}
                      onChange={(e) => setEditSocial({ ...editSocial, twitter: e.target.value })}
                      style={{ fontSize: '0.85rem', padding: '0.45rem 0.75rem' }}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="input-social-linkedin"
                      style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}
                    >
                      <Linkedin size={13} />
                      LinkedIn
                    </label>
                    <input
                      type="text"
                      id="input-social-linkedin"
                      className="form-control"
                      placeholder="username or URL"
                      value={editSocial.linkedin}
                      onChange={(e) => setEditSocial({ ...editSocial, linkedin: e.target.value })}
                      style={{ fontSize: '0.85rem', padding: '0.45rem 0.75rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button
                    type="button"
                    id="btn-cancel-edit-profile"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setIsEditingBio(false)}
                    disabled={savingProfile}
                  >
                    <X size={15} />
                    <span>Cancel</span>
                  </button>
                  <button
                    type="submit"
                    id="btn-save-profile"
                    className="btn btn-primary btn-sm"
                    disabled={savingProfile}
                  >
                    <Save size={15} />
                    <span>{savingProfile ? 'Saving...' : 'Save Profile'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Quick Author Statistics Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '1rem',
            marginTop: '2rem',
            paddingTop: '1.75rem',
            borderTop: '1px solid var(--border-medium)'
          }}
        >
          <div
            id="profile-stat-stories"
            style={{
              padding: '0.75rem 1rem',
              background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--primary)' }}>
              {totalStories}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
              Stories Authored
            </div>
          </div>

          <div
            id="profile-stat-published"
            style={{
              padding: '0.75rem 1rem',
              background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#10b981' }}>
              {publishedStories}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
              Published
            </div>
          </div>

          <div
            id="profile-stat-likes"
            style={{
              padding: '0.75rem 1rem',
              background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f43f5e' }}>
              {totalLikes}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
              Likes Received
            </div>
          </div>

          <div
            id="profile-stat-comments"
            style={{
              padding: '0.75rem 1rem',
              background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#8b5cf6' }}>
              {totalComments}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
              Discussions
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          EMBEDDED "MY STORIES" DASHBOARD
          ========================================================================= */}
      <section id="section-my-stories">
        {/* Section Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div>
            <h2
              id="profile-stories-heading"
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                margin: 0,
                letterSpacing: '-0.02em',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem'
              }}
            >
              <BookOpen size={24} style={{ color: 'var(--primary)' }} />
              <span>My Stories</span>
            </h2>
            <p className="text-secondary" style={{ marginTop: '0.25rem', fontSize: '0.925rem' }}>
              Manage, publish, and track articles written by you.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Filter Pills */}
            <div
              style={{
                display: 'flex',
                background: 'var(--bg-elevated)',
                padding: '0.2rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)'
              }}
            >
              <button
                type="button"
                id="filter-stories-all"
                onClick={() => setStoryFilter('all')}
                className={`btn btn-sm ${storyFilter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', borderRadius: 'var(--radius-sm)' }}
              >
                All ({totalStories})
              </button>
              <button
                type="button"
                id="filter-stories-published"
                onClick={() => setStoryFilter('published')}
                className={`btn btn-sm ${storyFilter === 'published' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', borderRadius: 'var(--radius-sm)' }}
              >
                Published ({publishedStories})
              </button>
              <button
                type="button"
                id="filter-stories-drafts"
                onClick={() => setStoryFilter('draft')}
                className={`btn btn-sm ${storyFilter === 'draft' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', borderRadius: 'var(--radius-sm)' }}
              >
                Drafts ({draftStories})
              </button>
            </div>

            <Link
              to="/create-blog"
              id="btn-write-new-story"
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Plus size={18} />
              <span>Write a Story</span>
            </Link>
          </div>
        </div>

        {/* Stories Error Alert */}
        {storiesError && (
          <div
            style={{
              padding: '1rem',
              background: 'rgba(244, 63, 94, 0.1)',
              color: '#fb7185',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.5rem'
            }}
          >
            {storiesError}
          </div>
        )}

        {/* Stories Content State */}
        {loadingStories ? (
          <div style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>Loading your articles...</p>
          </div>
        ) : filteredStories.length === 0 ? (
          <div
            className="card"
            style={{
              padding: '4rem 2rem',
              textAlign: 'center',
              background: 'var(--bg-surface)',
              border: '1px dashed var(--border-color)',
              borderRadius: 'var(--radius-lg)'
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(79, 70, 229, 0.1)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem auto'
              }}
            >
              <BookOpen size={28} />
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              {storyFilter === 'all'
                ? "You haven't written any stories yet"
                : `No ${storyFilter} stories found`}
            </h3>
            <p
              className="text-secondary"
              style={{ maxWidth: '440px', margin: '0 auto 1.75rem auto', fontSize: '0.95rem' }}
            >
              {storyFilter === 'all'
                ? 'Share your tutorials, architectural patterns, or deep-dives with the Chronicle community.'
                : `You do not have any articles matching the "${storyFilter}" filter.`}
            </p>
            <Link to="/create-blog" className="btn btn-primary" id="btn-empty-write-story">
              <Plus size={16} />
              <span>Write Your First Story</span>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} id="my-stories-list">
            {filteredStories.map((blog) => (
              <div
                key={blog._id || blog.id}
                className="card story-item-card"
                id={`my-story-card-${blog._id || blog.id}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1.25rem 1.5rem',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  transition: 'transform 0.15s ease, border-color 0.15s ease'
                }}
              >
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                    <span className={`badge badge-${blog.category || 'General'}`}>
                      {blog.category || 'General'}
                    </span>
                    <span
                      id={`story-status-badge-${blog._id || blog.id}`}
                      className={`badge ${blog.status === 'published' ? 'badge-published' : 'badge-draft'}`}
                    >
                      {blog.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                    <span className="text-xs text-muted flex items-center gap-1">
                      <Calendar size={13} />
                      {new Date(blog.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <Link
                    to={`/blog/${blog._id || blog.id}`}
                    style={{
                      fontSize: '1.15rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      textDecoration: 'none'
                    }}
                    className="hover-underline"
                  >
                    {blog.title}
                  </Link>
                </div>

                {/* Engagement Stats and Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }} title="Total likes">
                      <Heart size={15} />
                      {blog.likeCount || 0}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }} title="Total comments">
                      <MessageSquare size={15} />
                      {blog.commentCount || 0}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {/* Status Toggle Button (Draft <-> Published) */}
                    <button
                      type="button"
                      id={`btn-publish-toggle-${blog._id || blog.id}`}
                      className={`btn btn-sm ${blog.status === 'published' ? 'btn-outline' : 'btn-secondary'}`}
                      onClick={() => handleTogglePublish(blog)}
                      disabled={togglingId === (blog._id || blog.id) || deletingId === (blog._id || blog.id)}
                      title={
                        blog.status === 'published'
                          ? 'Unpublish story (moves to draft)'
                          : 'Publish story (makes visible to readers)'
                      }
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                    >
                      {togglingId === (blog._id || blog.id)
                        ? 'Updating...'
                        : blog.status === 'published'
                        ? 'Unpublish'
                        : 'Publish'}
                    </button>

                    <Link
                      to={`/edit-blog/${blog._id || blog.id}`}
                      id={`btn-edit-story-${blog._id || blog.id}`}
                      className="btn btn-ghost btn-sm"
                      title="Edit article"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <Edit3 size={16} />
                    </Link>
                    <Link
                      to={`/blog/${blog._id || blog.id}`}
                      id={`btn-view-story-${blog._id || blog.id}`}
                      className="btn btn-ghost btn-sm"
                      title="View article"
                    >
                      <ExternalLink size={16} />
                    </Link>
                    <button
                      type="button"
                      id={`btn-delete-story-${blog._id || blog.id}`}
                      className="btn btn-ghost btn-sm text-accent-rose"
                      onClick={() => setStoryToDelete(blog)}
                      disabled={deletingId === (blog._id || blog.id) || togglingId === (blog._id || blog.id)}
                      title="Delete story"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Story Deletion Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(storyToDelete)}
        title="Delete Story"
        message={
          storyToDelete
            ? `Are you sure you want to delete "${storyToDelete.title}"? This action cannot be undone.`
            : ''
        }
        confirmText="Delete Story"
        confirmVariant="danger"
        loading={deletingId === (storyToDelete?._id || storyToDelete?.id)}
        onConfirm={handleConfirmDelete}
        onClose={() => setStoryToDelete(null)}
      />
    </div>
  );
};

export default ProfilePage;
