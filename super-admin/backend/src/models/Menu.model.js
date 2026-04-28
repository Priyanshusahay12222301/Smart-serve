import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema(
  {
    smartServeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SmartServe',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['STARTER', 'MAIN_COURSE', 'DESSERT', 'BEVERAGE', 'SPECIAL', 'OTHER'],
    },
    image: {
      url: String,
      publicId: String,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isVeg: {
      type: Boolean,
      default: true,
    },
    tags: [String],
    preparationTime: {
      type: Number,
      default: 15,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
menuItemSchema.index({ smartServeId: 1, category: 1 });

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

export default MenuItem;
