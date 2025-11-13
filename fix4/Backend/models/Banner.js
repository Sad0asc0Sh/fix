const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema(
  {
    url: String,
    public_id: String,
  },
  { _id: false }
);

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    link: { type: String, default: '' },
    image: { type: imageSchema, default: {} },
    position: { type: String, enum: ['homepage-slider', 'sidebar', 'product-page'], required: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Banner', bannerSchema);

