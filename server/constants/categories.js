/**
 * 13 Canonical Filmmaking Categories
 * Single source of truth for the server
 */
const PREDEFINED_CATEGORIES = [
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

const LEGACY_CATEGORIES = ['Technology', 'Design', 'Lifestyle', 'Career', 'Tutorials'];

const ALL_SUPPORTED_CATEGORIES = [...PREDEFINED_CATEGORIES, ...LEGACY_CATEGORIES];

/**
 * Normalizes any category string. If legacy or canonical, preserves it. If old/unknown, safely falls back to 'General'.
 */
const normalizeCategory = (category) => {
  if (!category || typeof category !== 'string') return 'General';
  const match = ALL_SUPPORTED_CATEGORIES.find(
    (c) => c.toLowerCase() === category.trim().toLowerCase()
  );
  return match || 'General';
};

module.exports = {
  PREDEFINED_CATEGORIES,
  LEGACY_CATEGORIES,
  ALL_SUPPORTED_CATEGORIES,
  normalizeCategory
};
