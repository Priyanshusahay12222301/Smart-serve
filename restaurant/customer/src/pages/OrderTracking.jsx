import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ordersAPI } from '../services/api';
import { CheckCircle2, Clock, ChefHat, Package, Home } from 'lucide-react';

const OrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const CURRENCY_SYMBOL = import.meta.env.VITE_CURRENCY_SYMBOL || '₹';

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await ordersAPI.getById(orderId);
      setOrder(response.data.data);
    } catch (error) {
      console.error('Failed to fetch order:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusSteps = () => {
    const steps = [
      { status: 'PENDING', label: 'Order Received', icon: CheckCircle2, color: 'text-yellow-500' },
      { status: 'PREPARING', label: 'Preparing', icon: ChefHat, color: 'text-orange-500' },
      { status: 'READY', label: 'Ready', icon: Package, color: 'text-blue-500' },
      { status: 'COMPLETED', label: 'Completed', icon: CheckCircle2, color: 'text-green-500' }
    ];

    const statusOrder = ['PENDING', 'PREPARING', 'READY', 'COMPLETED'];
    const currentIndex = statusOrder.indexOf(order?.status);

    return steps.map((step, index) => ({
      ...step,
      isActive: index <= currentIndex,
      isCurrent: step.status === order?.status
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Order not found</h2>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  const statusSteps = getStatusSteps();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h1>
            <p className="text-gray-600">Order ID: {order.orderId}</p>
            <p className="text-gray-600">Table {order.tableNumber}</p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Status Timeline */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Order Status</h2>
          
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            <div 
              className="absolute left-8 top-0 w-0.5 bg-primary-500 transition-all duration-500"
              style={{ 
                height: `${(statusSteps.filter(s => s.isActive).length - 1) * 33.33}%` 
              }}
            ></div>

            {/* Steps */}
            <div className="space-y-8 relative">
              {statusSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.status} className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 ${
                      step.isActive 
                        ? 'bg-white border-primary-500' 
                        : 'bg-gray-100 border-gray-200'
                    } relative z-10`}>
                      <Icon className={`w-8 h-8 ${
                        step.isActive ? step.color : 'text-gray-400'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold ${
                        step.isActive ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {step.label}
                      </h3>
                      {step.isCurrent && (
                        <p className="text-sm text-primary-600 font-medium">In Progress...</p>
                      )}
                      {step.isActive && !step.isCurrent && (
                        <p className="text-sm text-green-600">✓ Complete</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Order Details</h2>
          <div className="space-y-3">
            {order.items?.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-500">Qty: {item.quantity} × {CURRENCY_SYMBOL}{item.price.toFixed(2)}</p>
                </div>
                <p className="font-semibold text-gray-900">{CURRENCY_SYMBOL}{(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="border-t mt-4 pt-4">
            <div className="flex justify-between items-center text-xl font-bold">
              <span>Total</span>
              <span className="text-primary-600">{CURRENCY_SYMBOL}{order.totalAmount?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        {(order.customerName || order.notes) && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Additional Information</h2>
            {order.customerName && order.customerName !== 'Guest' && (
              <p className="text-gray-600 mb-2">
                <span className="font-medium">Name:</span> {order.customerName}
              </p>
            )}
            {order.customerPhone && (
              <p className="text-gray-600 mb-2">
                <span className="font-medium">Phone:</span> {order.customerPhone}
              </p>
            )}
            {order.notes && (
              <p className="text-gray-600">
                <span className="font-medium">Notes:</span> {order.notes}
              </p>
            )}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-lg font-semibold transition-colors"
        >
          <Home className="w-5 h-5" />
          Order More Items
        </button>
      </div>
    </div>
  );
};

export default OrderTracking;
