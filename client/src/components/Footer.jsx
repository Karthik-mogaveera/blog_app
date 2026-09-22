import React from 'react';
import { BookOpen, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer
      style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
        padding: '3rem 0 2rem 0'
      }}
    >
      <div className="container">
        <div
          className="flex flex-col md-flex-row justify-between items-center gap-4"
          style={{ flexWrap: 'wrap' }}
        >
          <div className="flex items-center gap-2">
            <div className="nav-logo-icon" style={{ width: 28, height: 28 }}>
              <BookOpen size={16} />
            </div>
            <span className="font-bold text-lg">Chronicle</span>
          </div>

          <p className="text-sm text-muted" style={{ textAlign: 'center' }}>
            A focused editorial blogging and reader interaction platform built with precision.
          </p>

          <p className="text-xs text-muted flex items-center gap-1">
            Crafted with modern web standards and architectural discipline.
          </p>
        </div>

        <div
          style={{
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            textAlign: 'center'
          }}
        >
          <span className="text-xs text-muted">
            &copy; {new Date().getFullYear()} Chronicle Platform. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
