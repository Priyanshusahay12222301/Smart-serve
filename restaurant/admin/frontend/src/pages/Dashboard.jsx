import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ordersAPI, menuAPI } from '../services/api';
import { 
  Grid3x3, 
  LogOut, 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  DollarSign,
  TrendingUp,
  ArrowRight,
  Utensils,
  Settings
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    todayOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    todayRevenue: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [menuCount, setMenuCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, ordersRes, menuRes] = await Promise.all([
        ordersAPI.getStats(),
        ordersAPI.getRecent(3),
        menuAPI.getAll()
      ]);

      setStats(statsRes.data.data);
      setRecentOrders(ordersRes.data.data);
      setMenuCount(menuRes.data.count);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const StatCard = ({ icon: Icon, label, value, subtext, color, trend }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          <p className={`text-sm ${subtext.includes('attention') ? 'text-orange-600 font-medium' : 'text-green-600'}`}>
            {subtext}
          </p>
        </div>
        {trend && (
          <div className="ml-4">
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
        )}
      </div>
    </div>
  );

  const QuickActionCard = ({ icon: Icon, title, description, badge, onClick }) => (
    <button
      onClick={onClick}
      className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-200 transition-all text-left w-full group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-14 h-14 rounded-lg flex items-center justify-center ${
          title.includes('Orders') ? 'bg-orange-100' : 'bg-yellow-100'
        }`}>
          <Icon className={`w-7 h-7 ${
            title.includes('Orders') ? 'text-orange-600' : 'text-yellow-600'
          }`} />
        </div>
        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-3">{description}</p>
      {badge && (
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
          badge.includes('PENDING') 
            ? 'bg-orange-100 text-orange-700' 
            : 'bg-blue-100 text-blue-700'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );

  const OrderItem = ({ order }) => (
    <div className="bg-white rounded-lg p-4 border border-gray-100 hover:border-primary-200 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Order ID
          </p>
          <p className="text-sm font-semibold text-gray-900">{order.orderId}</p>
        </div>
        <div className="text-right">
          <div className="w-10 h-10 rounded-lg bg-primary-500 text-white font-bold flex items-center justify-center">
            {order.tableNumber}
          </div>
        </div>
      </div>
      
      <div className="mb-3">
        <p className="text-xs font-medium text-gray-500 mb-1">🍴 Items</p>
        <p className="text-sm text-gray-700">Table {order.tableNumber} • {order.items?.length || 0} items</p>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
          order.status === 'PREPARING' ? 'bg-orange-100 text-orange-800' :
          order.status === 'READY' ? 'bg-blue-100 text-blue-800' :
          'bg-green-100 text-green-800'
        }`}>
          {order.status}
        </span>
        <p className="text-lg font-bold text-gray-900">${order.totalAmount?.toFixed(2)}</p>
      </div>
    </div>
  );

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
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center mr-3">
                <Grid3x3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-xs text-gray-500">Delicious Bites Management</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/settings')}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm font-medium">Settings</span>
              </button>
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={ShoppingBag}
            label="Today's Orders"
            value={stats.todayOrders}
            subtext="Active today"
            color="bg-blue-500"
          />
          <StatCard
            icon={Clock}
            label="Pending Orders"
            value={stats.pendingOrders}
            subtext={stats.pendingOrders > 0 ? "Requires attention" : "All clear"}
            color="bg-orange-500"
          />
          <StatCard
            icon={CheckCircle}
            label="Completed"
            value={stats.completedOrders}
            subtext="All time"
            color="bg-green-500"
          />
          <StatCard
            icon={DollarSign}
            label="Revenue Today"
            value={`$${stats.todayRevenue.toFixed(2)}`}
            subtext={`+${stats.completedOrders} transactions`}
            color="bg-primary-500"
            trend
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">⚡</span>
            <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <QuickActionCard
              icon={ShoppingBag}
              title="Manage Orders"
              description="View and update order status"
              badge={`${stats.pendingOrders} PENDING`}
              onClick={() => navigate('/orders')}
            />
            <QuickActionCard
              icon={Utensils}
              title="Manage Menu"
              description="Edit items, prices, and availability"
              badge={`${menuCount} AVAILABLE`}
              onClick={() => navigate('/menu')}
            />
          </div>
        </div>

        {/* Recent Orders */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">⭐</span>
            <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
          </div>
          
          {recentOrders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentOrders.map((order) => (
                <OrderItem key={order._id} order={order} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No orders yet</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
