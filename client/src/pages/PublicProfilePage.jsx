import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import BlogCard from '../components/BlogCard';
import {
  User as UserIcon,
  Calendar,
  BookOpen,
  ArrowLeft,
  Globe,
  Github,
  Twitter,
  Linkedin,
  AlertCircle
} from 'lucide-react';

const PublicProfilePage = () => {
  const { id } = useParams();
  const [author, setAuthor] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPublicAuthor = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/users/${id}/public`);
        const data = await res.json();
        if (data.success) {
          setAuthor(data.author);
          setBlogs(data.blogs || []);
        } else {
          setError(data.message || 'Author profile not found.');
        }
      } catch (err) {
        console.error('Error fetching public profile:', err);
        setError('Network error loading author profile.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPublicAuthor();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '6rem 0', textAlign: 'center' }}>
        <p className="text-muted">Loading author profile...</p>
      </div>
    );
  }

  if (error || !author) {
    return (
      <div className="container content-narrow" style={{ padding: '6rem 0', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '1rem' }}>
          404
        </h1>
        <h2 style={{ marginBottom: '1rem' }}>Author Not Found</h2>
        <p className="text-secondary" style={{ marginBottom: '2rem' }}>
          {error || 'The requested writer profile does not exist or is unavailable.'}
        </p>
        <Link to="/" className="btn btn-primary" id="btn-back-home-404">
          <ArrowLeft size={16} />
          <span>Return to Articles</span>
        </Link>
      </div>
    );
  }

  const formattedJoinDate = author.createdAt
    ? new Date(author.createdAt).toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric'
      })
    : 'Community Member';

  const socialLinks = author.socialLinks || {};
  const hasSocialLinks = Boolean(
    socialLinks.website || socialLinks.github || socialLinks.twitter || socialLinks.linkedin
  );

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 6rem' }}>
      {/* Top Back Navigation */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/" className="btn btn-ghost btn-sm" id="btn-back-from-author">
          <ArrowLeft size={16} />
          <span>Back to Articles</span>
        </Link>
      </div>

      {/* Author Profile Banner */}
      <div className="public-author-header" id="public-author-header">
        {/* Avatar */}
        <div
          className="author-card-avatar"
          style={{ width: '96px', height: '96px', fontSize: '2rem', flexShrink: 0, margin: 0 }}
        >
          {author.profilePicture || author.avatar ? (
            <img
              src={author.profilePicture || author.avatar}
              alt={author.username}
              id="public-author-avatar-img"
            />
          ) : (
            <span id="public-author-avatar-initials">{author.initials}</span>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
            <h1
              id="public-author-username"
              style={{ fontSize: '2rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}
            >
              {author.username}
            </h1>
            <span
              id="public-author-role-badge"
              className={`badge ${author.role === 'admin' ? 'badge-admin' : 'badge-reader'}`}
            >
              {author.role === 'admin' ? 'Administrator' : 'Writer & Reader'}
            </span>
          </div>

          {/* Bio */}
          <p
            id="public-author-bio"
            className="text-secondary"
            style={{ fontSize: '1rem', lineHeight: 1.6, marginBottom: '1rem', maxWidth: '650px' }}
          >
            {author.bio || 'This writer has not added a bio yet.'}
          </p>

          {/* Metadata & Social Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.875rem' }}>
            <span
              id="public-author-member-since"
              className="text-muted"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Calendar size={15} />
              <span>Joined {formattedJoinDate}</span>
            </span>

            <span
              id="public-author-article-count"
              className="text-muted"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <BookOpen size={15} />
              <span>{author.totalArticles || blogs.length} Published {blogs.length === 1 ? 'Article' : 'Articles'}</span>
            </span>

            {/* Social Icons */}
            {hasSocialLinks && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {socialLinks.website && (
                  <a
                    href={socialLinks.website.startsWith('http') ? socialLinks.website : `https://${socialLinks.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    id="author-link-website"
                    className="text-muted hover:text-primary"
                    title="Personal Website"
                  >
                    <Globe size={16} />
                  </a>
                )}
                {socialLinks.github && (
                  <a
                    href={`https://github.com/${socialLinks.github.replace(/^@/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    id="author-link-github"
                    className="text-muted hover:text-primary"
                    title="GitHub"
                  >
                    <Github size={16} />
                  </a>
                )}
                {socialLinks.twitter && (
                  <a
                    href={`https://twitter.com/${socialLinks.twitter.replace(/^@/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    id="author-link-twitter"
                    className="text-muted hover:text-primary"
                    title="Twitter / X"
                  >
                    <Twitter size={16} />
                  </a>
                )}
                {socialLinks.linkedin && (
                  <a
                    href={`https://linkedin.com/in/${socialLinks.linkedin.replace(/^@/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    id="author-link-linkedin"
                    className="text-muted hover:text-primary"
                    title="LinkedIn"
                  >
                    <Linkedin size={16} />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Authored Published Articles Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 id="public-author-stories-heading" style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
              Published Stories
            </h2>
            <p className="text-secondary" style={{ fontSize: '0.9rem', margin: 0 }}>
              Articles authored by {author.username}
            </p>
          </div>
          <span className="badge badge-published">
            {blogs.length} {blogs.length === 1 ? 'Story' : 'Stories'}
          </span>
        </div>

        {blogs.length === 0 ? (
          <div
            id="public-author-empty-stories"
            className="card"
            style={{
              padding: '3.5rem 2rem',
              textAlign: 'center',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)'
            }}
          >
            <BookOpen size={36} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              No Published Stories Yet
            </h3>
            <p className="text-secondary" style={{ maxWidth: '420px', margin: '0 auto', fontSize: '0.9rem' }}>
              {author.username} hasn't published any public stories on Chronicle yet. Check back later!
            </p>
          </div>
        ) : (
          <div className="blog-grid" id="public-author-blogs-grid">
            {blogs.map((blog) => (
              <BlogCard key={blog._id || blog.id} blog={blog} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicProfilePage;
