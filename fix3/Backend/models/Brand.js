const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '', trim: true },
    logoUrl: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

brandSchema.index({ name: 1 });
brandSchema.index({ isActive: 1 });

module.exports = mongoose.model('Brand', brandSchema);

