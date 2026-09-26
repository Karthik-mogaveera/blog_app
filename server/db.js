const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Blog = require('./models/Blog');

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/blog_application';
  const sanitizedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 5000
      })
      .then(async (m) => {
        console.log(`[Database] MongoDB connected successfully to: ${sanitizedUri}`);
        try {
          await seedDefaultAdmin();
          await seedSampleBlogs();
        } catch (seedErr) {
          console.error('[Database] Seeding error:', seedErr.message);
        }
        return m;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    console.error(`[Database] MongoDB connection error: ${error.message}`);
    console.error(`[Database] Ensure your MongoDB server is running on ${sanitizedUri} or update MONGODB_URI in .env`);
    // Do not terminate process; allow retry or health check inspection
  }
};

const seedDefaultAdmin = async () => {
  try {
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@blogapp.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';

    const existingAdmin = await User.findOne({ role: 'admin' });
    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(adminPassword, salt);
      await User.create({
        username: adminUsername,
        email: adminEmail,
        passwordHash,
        role: 'admin'
      });
      console.log(`[Database] Seeded default Admin user: ${adminUsername} (${adminEmail})`);
    }
  } catch (error) {
    console.error('[Database] Error seeding default admin:', error.message);
  }
};

const seedSampleBlogs = async () => {
  try {
    const count = await Blog.countDocuments();
    if (count === 0) {
      await Blog.create([
        {
          title: 'The Future of Web Engineering with Full-Stack Architectures',
          content: `In the modern software landscape, decoupled architectures combined with cohesive design systems have revolutionized how we develop responsive, high-performance web applications.

From reactive frontends to robust API layers backed by document persistence, developers now possess unprecedented capabilities to construct resilient, delightful user experiences. In this article, we dive into how architectural discipline, clean state boundaries, and thoughtful community moderation workflows shape the modern web.`,
          authorName: 'Antigravity Architect',
          category: 'Technology',
          tags: ['webdev', 'architecture', 'fullstack', 'react'],
          coverImage: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
          status: 'published',
          publishedAt: new Date(Date.now() - 86400000 * 2)
        },
        {
          title: 'Mastering Typography, Layout and Modern Vanilla CSS Design Systems',
          content: `While CSS frameworks come and go, mastery of native CSS tokens, fluid clamp sizing, and semantic layout patterns remains timeless.

Modern Vanilla CSS empowers engineers with zero-dependency design tokens, backdrop filters, glassmorphic card elevations, and fluid responsive grids without ballooning bundle sizes. Notice how this very article layout adapts with surgical precision whether an image is provided or rendered purely through elegant typography.`,
          authorName: 'Elena Vance',
          category: 'Design',
          tags: ['css', 'designsystems', 'typography', 'ux'],
          coverImage: '', // Demonstrates typography-first adaptive card layout!
          status: 'published',
          publishedAt: new Date(Date.now() - 86400000)
        },
        {
          title: 'Building Inclusive Communities: Discussion Trees & Ethical Moderation',
          content: `Online discussions thrive when readers have the freedom to branch conversations meaningfully, coupled with transparent, accountable moderation.

By implementing hierarchical multi-level reply trees, readers can engage in nuanced sub-conversations without losing conversational thread integrity. Furthermore, displaying distinct badges for author revisions versus moderator interventions builds trust and elevates community discourse to professional standards.`,
          authorName: 'Marcus Cole',
          category: 'Career',
          tags: ['community', 'moderation', 'leadership'],
          coverImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
          status: 'published',
          publishedAt: new Date()
        }
      ]);
      console.log('[Database] Seeded 3 sample published blogs demonstrating categories, tags, and adaptive layouts.');
    }
  } catch (error) {
    console.error('[Database] Error seeding sample blogs:', error.message);
  }
};

module.exports = connectDB;
