import React from 'react';
import { Film } from 'lucide-react';
import { APP_CONFIG } from '../config/appConfig';

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
              <Film size={16} />
            </div>
            <span className="font-bold text-lg font-display">{APP_CONFIG.name}</span>
          </div>

          <p className="text-sm text-muted" style={{ textAlign: 'center' }}>
            {APP_CONFIG.tagline}
          </p>

          <p className="text-xs text-muted flex items-center gap-1">
            The community for independent filmmakers, cinematographers, and creators.
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
            &copy; {new Date().getFullYear()} {APP_CONFIG.name} · Chronicle Platform. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
