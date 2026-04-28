const mongoose = require('mongoose');

const smartServeSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: String,
      unique: true,
      index: true,
    },
    restaurantName: {
      type: String,
      required: [true, 'Restaurant name is required'],
      trim: true,
    },
    ownerName: {
      type: String,
      required: [true, 'Owner name is required'],
      trim: true,
    },
    ownerEmail: {
      type: String,
      required: [true, 'Owner email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    ownerPhone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    subscription: {
      plan: {
        type: String,
        enum: ['TRIAL', 'BASIC', 'PRO', 'ENTERPRISE'],
        default: 'TRIAL',
      },
      status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'TRIAL'],
        default: 'TRIAL',
      },
      startDate: {
        type: Date,
        default: Date.now,
      },
      endDate: Date,
    },
    features: {
      maxMenuItems: {
        type: Number,
        default: 50,
      },
      customBranding: {
        type: Boolean,
        default: false,
      },
      analytics: {
        type: Boolean,
        default: false,
      },
      multipleAdmins: {
        type: Boolean,
        default: false,
      },
    },
    qrCode: {
      url: String,
      uniqueId: {
        type: String,
        unique: true,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    stats: {
      totalOrders: {
        type: Number,
        default: 0,
      },
      totalRevenue: {
        type: Number,
        default: 0,
      },
      totalMenuItems: {
        type: Number,
        default: 0,
      },
    },
    // Legacy fields for backwards compatibility
    name: String,
    email: String,
    phone: String,
    logo: String,
    subscriptionStatus: String,
    subscriptionPlan: String,
    subscriptionStartDate: Date,
    subscriptionEndDate: Date,
  },
  {
    timestamps: true,
  }
);

const SmartServe = mongoose.model('SmartServe', smartServeSchema);

module.exports = SmartServe;
