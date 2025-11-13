const mongoose = require('mongoose');

const metaSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
  },
  { _id: false }
);

const pageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    content: { type: String, required: true },
    status: { type: String, enum: ['published', 'hidden'], default: 'published', index: true },
    meta: { type: metaSchema, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Page', pageSchema);

