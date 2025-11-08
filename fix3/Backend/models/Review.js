const mongoose = require('mongoose');
const Product = require('./Product'); // برای آپدیت امتیاز محصول

const reviewSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'شناسه محصول الزامی است'],
        index: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'شناسه کاربر الزامی است']
    },
    rating: {
        type: Number,
        required: [true, 'امتیاز (بین ۱ تا ۵) الزامی است'],
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: [true, 'متن نظر الزامی است'],
        trim: true,
        minlength: [5, 'متن نظر باید حداقل ۵ کاراکتر باشد'],
        maxlength: [1000, 'متن نظر نمی‌تواند بیشتر از ۱۰۰۰ کاراکتر باشد']
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
        index: true
    },
    adminReply: {
        text: { type: String, trim: true, maxlength: 1000 },
        repliedAt: Date,
        repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    isVerifiedPurchase: {
        type: Boolean,
        default: false
    },
    helpfulVotes: [{
         user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],
    notHelpfulVotes: [{
         user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ status: 1, createdAt: -1 });

reviewSchema.virtual('helpfulCount').get(function() {
  return (this.helpfulVotes ? this.helpfulVotes.length : 0) - (this.notHelpfulVotes ? this.notHelpfulVotes.length : 0);
});

reviewSchema.statics.calculateProductRating = async function(productId) {
    const stats = await this.aggregate([
        {
            $match: { product: productId, status: 'approved' }
        },
        {
            $group: {
                _id: '$product',
                numReviews: { $sum: 1 },
                avgRating: { $avg: '$rating' }
            }
        }
    ]);

    try {
        await mongoose.model('Product').findByIdAndUpdate(productId, {
            numReviews: stats.length > 0 ? stats[0].numReviews : 0,
            rating: stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0
        });
        console.log(`Product rating updated for ${productId}`);
    } catch (err) {
        console.error("خطا در آپدیت امتیاز محصول:", err);
    }
};

reviewSchema.post('save', function() {
    this.constructor.calculateProductRating(this.product);
});

reviewSchema.pre('findOneAndDelete', async function(next) {
     this.doc = await this.model.findOne(this.getQuery());
    next();
});

reviewSchema.post('findOneAndDelete', async function() {
    if (this.doc) {
        await this.doc.constructor.calculateProductRating(this.doc.product);
    }
});

reviewSchema.post('findOneAndUpdate', async function(doc) {
    if (doc) {
        await doc.constructor.calculateProductRating(doc.product);
    }
});

module.exports = mongoose.model('Review', reviewSchema);