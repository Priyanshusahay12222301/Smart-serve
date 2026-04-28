import mongoose from 'mongoose';

const brandingSchema = new mongoose.Schema(
  {
    smartServeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SmartServe',
      required: true,
      unique: true,
    },
    logo: {
      url: String,
      publicId: String,
    },
    theme: {
      primaryColor: {
        type: String,
        default: '#1a1a1a',
      },
      secondaryColor: {
        type: String,
        default: '#00d9ff',
      },
      backgroundColor: {
        type: String,
        default: '#0a0a0a',
      },
      textColor: {
        type: String,
        default: '#ffffff',
      },
      accentColor: {
        type: String,
        default: '#00ff88',
      },
    },
    fonts: {
      heading: {
        type: String,
        default: 'Poppins',
      },
      body: {
        type: String,
        default: 'Inter',
      },
    },
    customCSS: String,
    socialMedia: {
      facebook: String,
      instagram: String,
      twitter: String,
      website: String,
    },
    contactInfo: {
      phone: String,
      email: String,
      address: String,
    },
  },
  {
    timestamps: true,
  }
);

const Branding = mongoose.model('Branding', brandingSchema);

export default Branding;
