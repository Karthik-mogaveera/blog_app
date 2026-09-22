import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageSquare, Calendar, User, Tag } from 'lucide-react';

const BlogCard = ({ blog, onTagClick, layout = 'grid' }) => {
  const hasCoverImage = Boolean(blog.coverImage && blog.coverImage.trim());
  const formattedDate = blog.publishedAt
    ? new Date(blog.publishedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Draft';

  return (
    <article
      className={`blog-card blog-card-${layout} ${!hasCoverImage ? 'blog-card-typography' : ''}`}
      id={`blog-card-${blog._id || blog.id}`}
    >
      {/* Optional Cover Image */}
      {hasCoverImage && (
        <div className="blog-card-image-wrap">
          <img
            src={blog.coverImage}
            alt={blog.title}
            className="blog-card-img"
            loading="lazy"
            onError={(e) => {
              // Graceful fallback to hide broken image and trigger typography layout
              e.target.parentElement.style.display = 'none';
            }}
          />
        </div>
      )}

      <div className="blog-card-body">
        {/* Top Metadata: Category & Date */}
        <div className="blog-card-meta-top">
          <span className={`badge badge-${blog.category || 'General'}`}>
            {blog.category || 'General'}
          </span>
          <span className="text-xs text-muted flex items-center gap-1">
            <Calendar size={13} />
            {formattedDate}
          </span>
        </div>

        {/* Title Link */}
        <Link to={`/blog/${blog._id || blog.id}`} className="blog-card-title" title={blog.title}>
          {blog.title}
        </Link>

        {/* Excerpt */}
        <p className="blog-card-excerpt">
          {blog.excerpt || (blog.content ? blog.content.substring(0, 140) + '...' : '')}
        </p>

        {/* Tags */}
        {blog.tags && blog.tags.length > 0 && (
          <div className="blog-card-tags">
            {blog.tags.map((t, idx) => (
              <span
                key={idx}
                className="tag-chip"
                onClick={(e) => {
                  e.preventDefault();
                  if (onTagClick) onTagClick(t);
                }}
                title={`Filter by #${t}`}
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Footer: Author & Engagement Stats */}
        <div className="blog-card-footer">
          <div className="flex items-center gap-1 text-secondary">
            <User size={13} />
            <span className="font-medium text-xs">{blog.authorName || 'Admin'}</span>
          </div>

          <div className="blog-card-stats">
            <span className="stat-item text-xs" title={`${blog.likeCount || 0} likes`}>
              <Heart size={14} className={(blog.likeCount || 0) > 0 ? 'text-accent-rose' : ''} />
              <span>{blog.likeCount || 0}</span>
            </span>
            <span className="stat-item text-xs" title={`${blog.commentCount || 0} comments`}>
              <MessageSquare size={14} className={(blog.commentCount || 0) > 0 ? 'text-primary' : ''} />
              <span>{blog.commentCount || 0}</span>
            </span>
          </div>
        </div>
      </div>
    </article>
  );
};

export default BlogCard;
