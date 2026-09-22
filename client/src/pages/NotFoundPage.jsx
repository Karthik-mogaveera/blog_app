import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="container content-narrow" style={{ padding: '8rem 1.5rem', textAlign: 'center' }}>
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: 'var(--radius-xl)',
          background: 'rgba(99, 102, 241, 0.1)',
          color: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem auto'
        }}
      >
        <Compass size={32} />
      </div>

      <h1 style={{ fontSize: '4rem', fontWeight: 900, marginBottom: '0.5rem' }}>404</h1>
      <h2 style={{ marginBottom: '1rem' }}>Page Not Found</h2>
      <p className="text-secondary" style={{ maxWidth: '480px', margin: '0 auto 2rem auto' }}>
        The article or destination you are searching for might have been unpublished, deleted, or the URL address was typed incorrectly.
      </p>

      <Link to="/" className="btn btn-primary" id="btn-return-home-404">
        <ArrowLeft size={16} /> Return to Articles
      </Link>
    </div>
  );
};

export default NotFoundPage;
