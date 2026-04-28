import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    smartServeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SmartServe',
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      unique: true,
    },
    items: [
      {
        menuItem: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'MenuItem',
          required: true,
        },
        name: String,
        price: Number,
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        subtotal: Number,
      },
    ],
    customer: {
      name: String,
      phone: String,
      tableNumber: String,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'],
      default: 'PENDING',
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED'],
      default: 'PENDING',
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'CARD', 'UPI', 'ONLINE'],
      default: 'CASH',
    },
    notes: String,
    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Generate order number before saving
orderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    this.orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);

export default Order;
