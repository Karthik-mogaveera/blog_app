import React, { useState, useEffect, useCallback } from 'react';
import BlogCard from '../components/BlogCard';
import Pagination from '../components/Pagination';
import { Search, X, Sparkles, Filter, LayoutGrid, List } from 'lucide-react';

const CATEGORIES = ['All', 'Technology', 'Design', 'Lifestyle', 'Career', 'Tutorials', 'General'];

const HomePage = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeTag, setActiveTag] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
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

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

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
        {/* Search Bar */}
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
      </section>

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
    </div>
  );
};

export default HomePage;
