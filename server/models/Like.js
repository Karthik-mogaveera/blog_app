const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema(
  {
    blogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Blog',
      required: [true, 'Blog ID is required'],
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

// Enforce single like per reader on a blog
likeSchema.index({ blogId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Like', likeSchema);
