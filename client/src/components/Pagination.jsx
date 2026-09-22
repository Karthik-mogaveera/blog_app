import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <nav className="pagination" aria-label="Blog catalog pagination" id="pagination-nav">
      {/* Previous Button */}
      <button
        type="button"
        className="pagination-btn"
        id="pagination-prev-btn"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Go to previous page"
      >
        <ChevronLeft size={16} />
      </button>

      {/* Page Numbers */}
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          className={`pagination-btn ${p === currentPage ? 'active' : ''}`}
          id={`pagination-page-${p}`}
          onClick={() => onPageChange(p)}
          aria-current={p === currentPage ? 'page' : undefined}
        >
          {p}
        </button>
      ))}

      {/* Next Button */}
      <button
        type="button"
        className="pagination-btn"
        id="pagination-next-btn"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Go to next page"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
};

export default Pagination;
