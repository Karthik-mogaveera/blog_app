import React from 'react';
import { normalizeCategory, getCategoryBadgeClass } from '../constants/categories';

const CategoryBadge = ({ category, className = '', id, style }) => {
  const normalized = normalizeCategory(category);
  const badgeClass = getCategoryBadgeClass(category);

  return (
    <span
      id={id}
      className={`badge ${badgeClass} ${className}`.trim()}
      style={style}
    >
      {normalized}
    </span>
  );
};

export default CategoryBadge;
