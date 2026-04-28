import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '../services/api';
import { ArrowLeft, Clock, ChefHat, CheckCircle2, XCircle } from 'lucide-react';

const OrdersManagement = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [activeFilter]);

  const fetchOrders = async () => {
    try {
      const status = activeFilter !== 'all' ? activeFilter.toUpperCase() : undefined;
      const response = await ordersAPI.getAll(status);
      setOrders(response.data.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await ordersAPI.updateStatus(orderId, newStatus);
      fetchOrders();
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert('Failed to update order status');
    }
  };

  const getFilterCount = (status) => {
    if (status === 'all') return orders.length;
    return orders.filter(order => order.status === status.toUpperCase()).length;
  };

  const FilterTab = ({ label, value, icon: Icon, count }) => (
    <button
      onClick={() => setActiveFilter(value)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
        activeFilter === value
          ? 'bg-primary-500 text-white shadow-sm'
          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
      }`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      <span>{label}</span>
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
        activeFilter === value
          ? 'bg-white/20 text-white'
          : 'bg-gray-100 text-gray-600'
      }`}>
        {count}
      </span>
    </button>
  );

  const OrderCard = ({ order }) => {
    const statusButtons = [
      { label: 'PENDING', color: 'bg-yellow-500 hover:bg-yellow-600' },
      { label: 'PREPARING', color: 'bg-orange-500 hover:bg-orange-600' },
      { label: 'READY', color: 'bg-blue-500 hover:bg-blue-600' },
      { label: 'COMPLETED', color: 'bg-green-500 hover:bg-green-600' }
    ];

    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Order ID
            </p>
            <p className="text-sm font-bold text-gray-900">{order.orderId}</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-primary-500 text-white font-bold text-lg flex items-center justify-center">
            {order.tableNumber}
          </div>
        </div>

        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            🍴 Order Items
          </p>
          <div className="space-y-2">
            {order.items?.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-700">
                  {item.menuItem?.name || 'Item'} <span className="text-gray-500">Qty: {item.quantity}</span>
                </span>
                <span className="font-semibold text-gray-900">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Total Amount
            </span>
            <span className="text-2xl font-bold text-primary-600">
              ${order.totalAmount?.toFixed(2)}
            </span>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Update Status
          </p>
          <div className="grid grid-cols-2 gap-2">
            {statusButtons.map((btn) => (
              <button
                key={btn.label}
                onClick={() => handleStatusUpdate(order._id, btn.label)}
                disabled={order.status === btn.label}
                className={`px-4 py-2 rounded-lg text-white text-sm font-semibold transition-all ${
                  order.status === btn.label
                    ? 'bg-gray-800 cursor-default'
                    : `${btn.color} hover:shadow-md`
                } disabled:opacity-100`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            {new Date(order.createdAt).toLocaleString('en-US', {
              month: '2-digit',
              day: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })}
          </p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
            <p className="text-sm text-gray-600 mt-1">Track and manage customer orders</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-3">
            <FilterTab
              label="All Orders"
              value="all"
              count={orders.length}
            />
            <FilterTab
              label="Pending"
              value="pending"
              icon={Clock}
              count={orders.filter(o => o.status === 'PENDING').length}
            />
            <FilterTab
              label="Preparing"
              value="preparing"
              icon={ChefHat}
              count={orders.filter(o => o.status === 'PREPARING').length}
            />
            <FilterTab
              label="Ready"
              value="ready"
              icon={CheckCircle2}
              count={orders.filter(o => o.status === 'READY').length}
            />
            <FilterTab
              label="Completed"
              value="completed"
              icon={CheckCircle2}
              count={orders.filter(o => o.status === 'COMPLETED').length}
            />
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {orders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <XCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No orders found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersManagement;
