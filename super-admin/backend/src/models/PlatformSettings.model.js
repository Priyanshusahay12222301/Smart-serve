import mongoose from 'mongoose';

const platformSettingsSchema = new mongoose.Schema(
  {
    // Regional Settings
    regional: {
      currency: {
        type: String,
        default: 'USD',
      },
      currencySymbol: {
        type: String,
        default: '$',
      },
      timezone: {
        type: String,
        default: 'UTC',
      },
      dateFormat: {
        type: String,
        default: 'MM/DD/YYYY',
      },
      language: {
        type: String,
        default: 'en',
      },
    },

    // Tax Settings
    tax: {
      enabled: {
        type: Boolean,
        default: false,
      },
      defaultRate: {
        type: Number,
        default: 0,
      },
      taxLabel: {
        type: String,
        default: 'Tax',
      },
    },

    // Feature Toggles
    features: {
      customBranding: {
        type: Boolean,
        default: true,
      },
      advancedAnalytics: {
        type: Boolean,
        default: true,
      },
      paymentIntegration: {
        type: Boolean,
        default: false,
      },
      qrCodeCustomization: {
        type: Boolean,
        default: true,
      },
      multiLocation: {
        type: Boolean,
        default: true,
      },
      aiRecommendations: {
        type: Boolean,
        default: false,
      },
    },

    // System Settings
    system: {
      maintenanceMode: {
        type: Boolean,
        default: false,
      },
      maintenanceMessage: {
        type: String,
        default: 'System is under maintenance. Please check back later.',
      },
      allowNewSignups: {
        type: Boolean,
        default: true,
      },
      maxRestaurants: {
        type: Number,
        default: 1000,
      },
      sessionTimeout: {
        type: Number,
        default: 30, // minutes
      },
    },

    // Email Settings
    email: {
      sendWelcomeEmail: {
        type: Boolean,
        default: true,
      },
      sendBillingReminders: {
        type: Boolean,
        default: true,
      },
      sendSystemNotifications: {
        type: Boolean,
        default: true,
      },
      supportEmail: {
        type: String,
        default: 'support@smartserve.com',
      },
    },

    // Default Subscription Settings
    subscription: {
      defaultTrialDays: {
        type: Number,
        default: 30,
      },
      gracePeriodDays: {
        type: Number,
        default: 7,
      },
      autoSuspendOnExpiry: {
        type: Boolean,
        default: true,
      },
    },

    // Metadata
    lastUpdatedBy: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const PlatformSettings = mongoose.model('PlatformSettings', platformSettingsSchema);

export default PlatformSettings;
