/**
 * 13 Canonical Filmmaking Categories
 * Single source of truth for the client
 */
export const CATEGORIES = [
  'Screenwriting',
  'Directing',
  'Cinematography',
  'Editing & Post',
  'Sound & Music',
  'Production & Budgeting',
  'Gear & Tech',
  'Film Analysis & Reviews',
  'Behind the Scenes',
  'Short Film Showcase',
  'Festivals & Distribution',
  'Career & Collaboration',
  'General'
];

export const LEGACY_CATEGORIES = ['Technology', 'Design', 'Lifestyle', 'Career', 'Tutorials'];

export const FILTER_CATEGORIES = ['All', ...CATEGORIES, ...LEGACY_CATEGORIES];

/**
 * Normalizes any category string. If old or unknown, safely falls back to 'General'.
 */
export const normalizeCategory = (category) => {
  if (!category || typeof category !== 'string') return 'General';
  const match = [...CATEGORIES, ...LEGACY_CATEGORIES].find(
    (c) => c.toLowerCase() === category.trim().toLowerCase()
  );
  return match || 'General';
};

/**
 * Returns safe CSS class for category badge, e.g. badge-EditingPost
 */
export const getCategoryBadgeClass = (category) => {
  const norm = normalizeCategory(category);
  return `badge-${norm.replace(/[^a-zA-Z0-9]/g, '')}`;
};

export default CATEGORIES;
