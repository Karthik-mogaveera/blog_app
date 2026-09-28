import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import BlogCard from '../components/BlogCard';
import Pagination from '../components/Pagination';
import { Search, X, Sparkles, Filter, LayoutGrid, List, Users, BookOpen, User } from 'lucide-react';

const CATEGORIES = ['All', 'Technology', 'Design', 'Lifestyle', 'Career', 'Tutorials', 'General'];

const HomePage = () => {
  const [searchType, setSearchType] = useState('articles'); // 'articles' | 'authors'
  const [blogs, setBlogs] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authorsLoading, setAuthorsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [authorQuery, setAuthorQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeTag, setActiveTag] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [authorTotalPages, setAuthorTotalPages] = useState(1);
  const [authorTotalCount, setAuthorTotalCount] = useState(0);
  const [authorPage, setAuthorPage] = useState(1);
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('blog_app_view_mode') || 'grid';
  });

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('blog_app_view_mode', mode);
  };

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 6
      });

      if (search.trim()) params.append('search', search.trim());
      if (activeCategory && activeCategory !== 'All') params.append('category', activeCategory);
      if (activeTag) params.append('tag', activeTag);

      const res = await fetch(`/api/blogs?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setBlogs(data.blogs || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Error fetching blogs:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, activeCategory, activeTag]);

  const fetchAuthors = useCallback(async () => {
    setAuthorsLoading(true);
    try {
      const params = new URLSearchParams({
        page: authorPage,
        limit: 12
      });
      if (authorQuery.trim()) params.append('q', authorQuery.trim());

      const res = await fetch(`/api/users/search?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setAuthors(data.authors || []);
        setAuthorTotalPages(data.pagination?.totalPages || 1);
        setAuthorTotalCount(data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Error fetching authors:', err);
    } finally {
      setAuthorsLoading(false);
    }
  }, [authorPage, authorQuery]);

  useEffect(() => {
    if (searchType === 'articles') {
      fetchBlogs();
    } else {
      fetchAuthors();
    }
  }, [searchType, fetchBlogs, fetchAuthors]);

  const handleAuthorSearchSubmit = (e) => {
    e.preventDefault();
    setAuthorPage(1);
    fetchAuthors();
  };

  // Handle Search Input Submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchBlogs();
  };

  const handleCategorySelect = (cat) => {
    setActiveCategory(cat);
    setCurrentPage(1);
  };

  const handleTagClick = (tag) => {
    setActiveTag(tag);
    setCurrentPage(1);
  };

  const clearTagFilter = () => {
    setActiveTag('');
    setCurrentPage(1);
  };

  return (
    <div className="container" style={{ paddingBottom: '5rem' }}>
      {/* Hero / Header Section */}
      <section style={{ textAlign: 'center', padding: '4rem 0 2.5rem 0' }}>
        <div
          className="badge badge-Technology"
          style={{ marginBottom: '1.25rem', padding: '0.4rem 1rem' }}
        >
          <Sparkles size={14} />
          Editorial Knowledge & Discourse
        </div>
        <h1 style={{ marginBottom: '1.25rem' }}>
          Insights, Stories & <span className="text-gradient">Ideas</span>
        </h1>
        <p className="content-narrow" style={{ fontSize: '1.15rem', color: 'var(--text-secondary)' }}>
          Explore articles on technology, software architecture, design systems, and modern engineering practices. Join discussions through threaded conversations.
        </p>
      </section>

      {/* Search & Filter Controls */}
      <section
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-md)',
          marginBottom: '2.5rem'
        }}
      >
        {/* Search Mode Toggle Tabs: Articles vs Writers */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
          <button
            type="button"
            id="tab-search-articles"
            onClick={() => setSearchType('articles')}
            className={`btn btn-sm ${searchType === 'articles' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: 'var(--radius-md)' }}
          >
            <BookOpen size={15} />
            <span>Search Articles</span>
          </button>
          <button
            type="button"
            id="tab-search-authors"
            onClick={() => setSearchType('authors')}
            className={`btn btn-sm ${searchType === 'authors' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: 'var(--radius-md)' }}
          >
            <Users size={15} />
            <span>Discover Writers & Readers</span>
          </button>
        </div>

        {searchType === 'articles' ? (
          <>
            {/* Articles Search Bar */}
            <form onSubmit={handleSearchSubmit} className="flex gap-2" style={{ marginBottom: '1.25rem' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)'
                  }}
                />
                <input
                  type="text"
                  className="form-input"
                  id="search-input"
                  placeholder="Search articles by title, keywords or topics..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ paddingLeft: '2.75rem' }}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setCurrentPage(1);
                    }}
                    style={{
                      position: 'absolute',
                      right: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <button type="submit" className="btn btn-primary" id="search-submit-btn">
                Search
              </button>
            </form>

            {/* Category Chips */}
            <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
              <span className="text-xs text-muted font-semibold flex items-center gap-1">
                <Filter size={14} /> Categories:
              </span>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  id={`filter-cat-${cat.toLowerCase()}`}
                  className={`tag-chip ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => handleCategorySelect(cat)}
                  style={{ padding: '0.35rem 0.85rem' }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Active Tag Filter Indicator */}
            {activeTag && (
              <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="text-xs text-muted">Active Tag:</span>
                <span className="badge badge-Technology" style={{ textTransform: 'none' }}>
                  #{activeTag}
                  <X size={12} style={{ cursor: 'pointer', marginLeft: 4 }} onClick={clearTagFilter} />
                </span>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Authors Search Bar */}
            <form onSubmit={handleAuthorSearchSubmit} className="flex gap-2">
              <div style={{ position: 'relative', flex: 1 }}>
                <Search
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)'
                  }}
                />
                <input
                  type="text"
                  className="form-input"
                  id="author-search-input"
                  placeholder="Find writers and readers by username or bio..."
                  value={authorQuery}
                  onChange={(e) => setAuthorQuery(e.target.value)}
                  style={{ paddingLeft: '2.75rem' }}
                />
                {authorQuery && (
                  <button
                    type="button"
                    id="author-search-clear-btn"
                    onClick={() => {
                      setAuthorQuery('');
                      setAuthorPage(1);
                    }}
                    style={{
                      position: 'absolute',
                      right: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <button type="submit" className="btn btn-primary" id="author-search-submit-btn">
                Find Writers
              </button>
            </form>
          </>
        )}
      </section>

      {searchType === 'articles' ? (
        <>
          {/* Catalog Results Header */}
          <div className="flex justify-between items-center" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div className="flex items-center gap-3">
              <h3 style={{ fontSize: '1.25rem' }}>
                Published Articles <span className="text-sm font-medium text-muted">({totalCount})</span>
              </h3>
              {loading && <span className="text-sm text-muted">Loading articles...</span>}
            </div>

            {/* Grid / List Layout Switcher */}
            <div className="view-toggle-group" id="view-mode-toggle-group">
              <button
                type="button"
                className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                id="view-toggle-grid"
                onClick={() => handleViewModeChange('grid')}
                title="Grid View"
                aria-label="Grid View"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                id="view-toggle-list"
                onClick={() => handleViewModeChange('list')}
                title="List View"
                aria-label="List View"
              >
                <List size={16} />
              </button>
            </div>
          </div>

          {/* Article Grid / List */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '5rem 0' }}>
              <p className="text-muted">Loading articles...</p>
            </div>
          ) : blogs.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '5rem 1rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-xl)'
              }}
            >
              <Search size={40} style={{ margin: '0 auto 1rem auto', opacity: 0.3 }} />
              <h3 style={{ marginBottom: '0.5rem' }}>No matching articles found</h3>
              <p className="text-secondary text-sm" style={{ marginBottom: '1.5rem' }}>
                Try adjusting your search terms or clearing your category filter.
              </p>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSearch('');
                  setActiveCategory('All');
                  setActiveTag('');
                  setCurrentPage(1);
                }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <>
              <div className={viewMode === 'grid' ? 'blog-grid' : 'blog-list'} id="articles-container">
                {blogs.map((blog) => (
                  <BlogCard
                    key={blog._id || blog.id}
                    blog={blog}
                    onTagClick={handleTagClick}
                    layout={viewMode}
                  />
                ))}
              </div>

              {/* Standard Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  window.scrollTo({ top: 300, behavior: 'smooth' });
                }}
              />
            </>
          )}
        </>
      ) : (
        /* Author Discovery Section */
        <div id="section-author-discovery">
          <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 id="author-discovery-title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                Community Writers & Readers
              </h3>
              <p className="text-secondary text-sm" style={{ margin: 0 }}>
                Discover authors across the Chronicle platform and browse their public stories.
              </p>
            </div>
            <span className="badge badge-Technology">
              {authorTotalCount} {authorTotalCount === 1 ? 'Author' : 'Authors'}
            </span>
          </div>

          {authorsLoading ? (
            <div style={{ textAlign: 'center', padding: '5rem 0' }}>
              <p className="text-muted">Searching authors...</p>
            </div>
          ) : authors.length === 0 ? (
            <div
              id="author-discovery-empty"
              style={{
                textAlign: 'center',
                padding: '5rem 1rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-xl)'
              }}
            >
              <Users size={40} style={{ margin: '0 auto 1rem auto', opacity: 0.3 }} />
              <h3 style={{ marginBottom: '0.5rem' }}>No Writers Found</h3>
              <p className="text-secondary text-sm" style={{ marginBottom: '1.5rem' }}>
                We couldn't find any writers matching "{authorQuery}". Try searching by another username or keyword.
              </p>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setAuthorQuery('');
                  setAuthorPage(1);
                  fetchAuthors();
                }}
              >
                Clear Search
              </button>
            </div>
          ) : (
            <>
              <div className="author-discovery-grid" id="author-discovery-grid">
                {authors.map((author) => (
                  <Link
                    key={author._id || author.id}
                    to={`/author/${author.username}`}
                    className="author-card"
                    id={`author-card-${author.username}`}
                    title={`View @${author.username}'s public profile`}
                  >
                    <div className="author-card-avatar">
                      {author.profilePicture || author.avatar ? (
                        <img src={author.profilePicture || author.avatar} alt={author.username} />
                      ) : (
                        <span>{author.initials}</span>
                      )}
                    </div>

                    <h4
                      className="author-card-name"
                      style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}
                    >
                      {author.username}
                    </h4>

                    <span
                      className={`badge ${author.role === 'admin' ? 'badge-admin' : 'badge-reader'}`}
                      style={{ marginBottom: '0.75rem' }}
                    >
                      {author.role === 'admin' ? 'Administrator' : 'Reader / Author'}
                    </span>

                    <p
                      className="text-secondary text-xs"
                      style={{
                        margin: '0 0 1rem 0',
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        minHeight: '2.5rem'
                      }}
                    >
                      {author.bio || 'Community member passionate about ideas and writing.'}
                    </p>

                    <div
                      style={{
                        width: '100%',
                        borderTop: '1px solid var(--border-subtle)',
                        paddingTop: '0.75rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.8rem',
                        color: 'var(--text-muted)'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <BookOpen size={13} />
                        <span>{author.publishedArticlesCount || 0} Stories</span>
                      </span>
                      <span className="text-primary font-semibold">View Profile →</span>
                    </div>
                  </Link>
                ))}
              </div>

              {authorTotalPages > 1 && (
                <Pagination
                  currentPage={authorPage}
                  totalPages={authorTotalPages}
                  onPageChange={(page) => {
                    setAuthorPage(page);
                    window.scrollTo({ top: 300, behavior: 'smooth' });
                  }}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default HomePage;
