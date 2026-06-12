import mongoose from 'mongoose';

// Read-only schema that mirrors the restaurant admin's Order collection
const orderSchema = new mongoose.Schema(
  {
    smartServeId: { type: mongoose.Schema.Types.ObjectId, ref: 'SmartServe' },
    totalAmount: { type: Number, default: 0 },
    status: { type: String },
  },
  { timestamps: true, strict: false, collection: 'orders' }
);

const Order = mongoose.model('Order', orderSchema);

export default Order;
