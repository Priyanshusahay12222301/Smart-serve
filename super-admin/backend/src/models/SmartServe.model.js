import mongoose from 'mongoose';

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
  },
  {
    timestamps: true,
  }
);

// Generate unique restaurant ID and QR code before saving
smartServeSchema.pre('save', function (next) {
  // Generate unique restaurant ID
  if (!this.restaurantId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    this.restaurantId = `REST-${timestamp}-${random}`;
  }
  
  // Generate QR code unique ID
  if (!this.qrCode.uniqueId) {
    this.qrCode.uniqueId = this.restaurantId;
  }
  
  // Generate QR code URL for customer app
  if (!this.qrCode.url) {
    const customerAppUrl = process.env.CUSTOMER_APP_URL || 'https://smart-serve-dusky.vercel.app';
    this.qrCode.url = `${customerAppUrl}/${this.restaurantId}`;
  }
  
  next();
});

const SmartServe = mongoose.model('SmartServe', smartServeSchema);

export default SmartServe;
