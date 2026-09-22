const mongoose = require('mongoose');

const PREDEFINED_CATEGORIES = [
  'Technology',
  'Design',
  'Lifestyle',
  'Career',
  'Tutorials',
  'General'
];

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Blog title is required'],
      trim: true,
      maxlength: [150, 'Blog title cannot exceed 150 characters']
    },
    content: {
      type: String,
      required: [true, 'Blog content is required']
    },
    authorName: {
      type: String,
      required: [true, 'Author name is required'],
      trim: true,
      default: 'Admin'
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: PREDEFINED_CATEGORIES,
        message: '{VALUE} is not a supported category'
      },
      default: 'General'
    },
    tags: {
      type: [String],
      default: [],
      set: (tags) => {
        if (!tags) return [];
        if (Array.isArray(tags)) {
          return tags.map((t) => t.trim().replace(/^#/, '')).filter(Boolean);
        }
        if (typeof tags === 'string') {
          return tags
            .split(',')
            .map((t) => t.trim().replace(/^#/, ''))
            .filter(Boolean);
        }
        return [];
      }
    },
    coverImage: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft'
    },
    publishedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for excerpt (first 160 characters of content)
blogSchema.virtual('excerpt').get(function () {
  if (!this.content) return '';
  const cleanText = this.content.replace(/<[^>]*>?/gm, '').trim();
  if (cleanText.length <= 160) return cleanText;
  return cleanText.substring(0, 157) + '...';
});

// Text index for keyword search on title and content
blogSchema.index({ title: 'text', content: 'text', tags: 'text' });
blogSchema.index({ status: 1, publishedAt: -1 });
blogSchema.index({ category: 1 });

module.exports = mongoose.model('Blog', blogSchema);
module.exports.PREDEFINED_CATEGORIES = PREDEFINED_CATEGORIES;
