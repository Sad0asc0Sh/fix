const mongoose = require('mongoose');

const featuredImageSchema = new mongoose.Schema(
  {
    url: String,
    public_id: String,
  },
  { _id: false }
);

const metaSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
  },
  { _id: false }
);

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    content: { type: String, required: true },
    featuredImage: { type: featuredImageSchema, default: {} },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'BlogCategory' },
    tags: { type: [String], default: [] },
    status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
    meta: { type: metaSchema, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Post', postSchema);

