/**
 * MIGRATION SCRIPT: Migrate Legacy Blog Categories to Filmmaking Categories
 * 
 * NOTE (SAFETY RULE 5): This script is PROVIDED FOR REFERENCE ONLY.
 * DO NOT RUN AUTOMATICALLY ON PRODUCTION DATABASES.
 * 
 * To run manually when approved:
 *   node server/scripts/migrateCategories.js
 */

const mongoose = require('mongoose');
const { PREDEFINED_CATEGORIES, normalizeCategory } = require('../constants/categories');

// Category mapping from legacy generic blog categories to filmmaking taxonomy
const LEGACY_CATEGORY_MAP = {
  Technology: 'Gear & Tech',
  Design: 'Cinematography',
  Lifestyle: 'Behind the Scenes',
  Career: 'Career & Collaboration',
  Tutorials: 'Editing & Post',
  General: 'General'
};

async function migrateCategories() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/blog_app';
  console.log(`Connecting to MongoDB...`);
  await mongoose.connect(mongoUri);

  const Blog = mongoose.model('Blog', new mongoose.Schema({}, { strict: false }));
  const blogs = await Blog.find({});

  console.log(`Found ${blogs.length} articles to check.`);
  let updatedCount = 0;

  for (const blog of blogs) {
    const oldCat = blog.category;
    let newCat = LEGACY_CATEGORY_MAP[oldCat] || normalizeCategory(oldCat);

    if (newCat !== oldCat) {
      console.log(`Migrating "${blog.title}" (${blog._id}): '${oldCat}' -> '${newCat}'`);
      await Blog.updateOne({ _id: blog._id }, { $set: { category: newCat } });
      updatedCount++;
    }
  }

  console.log(`Migration complete. Updated ${updatedCount} articles.`);
  await mongoose.disconnect();
}

if (require.main === module) {
  migrateCategories().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}

module.exports = { migrateCategories };
