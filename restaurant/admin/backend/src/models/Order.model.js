const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    smartServeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SmartServe',
      required: true,
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    tableNumber: {
      type: Number,
      required: [true, 'Table number is required'],
    },
    items: [
      {
        menuItem: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'MenuItem',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING',
    },
    customerName: {
      type: String,
      trim: true,
      default: '',
    },
    customerPhone: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Generate order ID before saving
orderSchema.pre('save', async function (next) {
  if (this.isNew && !this.orderId) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    this.orderId = `order-${timestamp}${random}`;
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
