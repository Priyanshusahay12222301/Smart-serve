import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import io from 'socket.io-client';
import QRCode from 'qrcode';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { 
  Activity, 
  Zap, 
  Layers, 
  AlertTriangle,
  Search,
  Bell,
  User,
  ChevronRight,
  Circle,
  CheckCircle2,
  AlertCircle,
  Info,
  XCircle,
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  DollarSign,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Power,
  PowerOff,
  TrendingUp,
  Key,
  UserCog,
  Ticket,
  Send,
  Eye,
  Lock,
  Copy,
  KeyRound,
  Building2,
  CreditCard,
  QrCode
} from 'lucide-react';

const API_BASE_URL =
  import.meta.env.VITE_SUPER_ADMIN_API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  '/api';
axios.defaults.baseURL = API_BASE_URL;

let apiPrefixInterceptorRegistered = false;
if (!apiPrefixInterceptorRegistered) {
  apiPrefixInterceptorRegistered = true;
  axios.interceptors.request.use((config) => {
    if (typeof config.url === 'string' && config.url.startsWith('/api/')) {
      config.url = config.url.replace('/api', '');
    }
    return config;
  });
}

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [billingRestaurant, setBillingRestaurant] = useState(null);
  const [platformSettings, setPlatformSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsPeriod, setAnalyticsPeriod] = useState('7days');
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [resetPasswordData, setResetPasswordData] = useState({ restaurantId: '', newPassword: '' });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [ticketMessage, setTicketMessage] = useState('');
  const [restaurantSearch, setRestaurantSearch] = useState('');
  const [selectedResetRestaurant, setSelectedResetRestaurant] = useState(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [credentialsRestaurant, setCredentialsRestaurant] = useState(null);
  const [newPasswordForCredentials, setNewPasswordForCredentials] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const qrCanvasRef = useRef(null);
  const [formData, setFormData] = useState({
    restaurantName: '',
    ownerName: '',
    email: '',
    phone: '',
    address: '',
    password: ''
  });

  // Debug effect for credentials modal
  useEffect(() => {
    console.log('Credentials modal state changed:', {
      showCredentialsModal,
      hasRestaurant: !!credentialsRestaurant,
      restaurantName: credentialsRestaurant?.restaurantName
    });
    
    // Generate QR code when modal opens
    if (showCredentialsModal && credentialsRestaurant?.qrCode?.url) {
      QRCode.toDataURL(credentialsRestaurant.qrCode.url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
        .then(url => {
          setQrCodeDataUrl(url);
        })
        .catch(err => {
          console.error('Error generating QR code:', err);
        });
    }
  }, [showCredentialsModal, credentialsRestaurant]);

  const subscriptionPlans = [
    {
      name: 'TRIAL',
      price: 0,
      duration: '30 days',
      features: ['Up to 20 menu items', 'Basic QR ordering', 'Email support', 'Standard analytics']
    },
    {
      name: 'BASIC',
      price: 29,
      duration: 'per month',
      features: ['Up to 50 menu items', 'Custom branding', 'Priority email support', 'Advanced analytics', 'Daily reports']
    },
    {
      name: 'PRO',
      price: 79,
      duration: 'per month',
      features: ['Unlimited menu items', 'Full branding control', '24/7 priority support', 'Advanced analytics + AI insights', 'Real-time sync', 'Multiple locations']
    },
    {
      name: 'ENTERPRISE',
      price: 199,
      duration: 'per month',
      features: ['Everything in Pro', 'Dedicated account manager', 'Custom integrations', 'White-label solution', 'API access', 'SLA guarantee']
    }
  ];

  useEffect(() => {
    fetchData();
    if (activeTab === 'settings') {
      fetchSettings();
    }
    if (activeTab === 'overview') {
      fetchAnalytics();
    }
    if (activeTab === 'support') {
      fetchTickets();
    }
  }, [activeTab, analyticsPeriod]);

  useEffect(() => {
    fetchData();
  }, []);

  // Socket.io real-time connection
  useEffect(() => {
    const disableSocket = import.meta.env.VITE_DISABLE_SOCKET === 'true';
    if (disableSocket) {
      return undefined;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';
    const socket = io(socketUrl);

    // Join super-admin room for real-time updates
    socket.emit('join-super-admin');

    // Listen for restaurant-created event
    // Listen for restaurant-created event
    socket.on('restaurant-created', (data) => {
      console.log('New restaurant created:', data);
      // Refresh restaurant list
      fetchData();
      // Show success notification
      if (data.message) {
        // Use a toast notification instead of alert for better UX
        console.log('✅ Success:', data.message);
      }
    });

    // Cleanup on component unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, restaurantsRes] = await Promise.all([
        axios.get('/api/super-admin/stats'),
        axios.get('/api/super-admin/smartserve/all')
      ]);
      setStats(statsRes.data.data);
      setRestaurants(restaurantsRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      setSettingsLoading(true);
      const response = await axios.get('/api/super-admin/settings');
      setPlatformSettings(response.data.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setSettingsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const response = await axios.get(`/api/super-admin/analytics?period=${analyticsPeriod}`);
      setAnalyticsData(response.data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchTickets = async () => {
    try {
      setTicketsLoading(true);
      const response = await axios.get('/api/super-admin/support/tickets');
      setTickets(response.data.data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setTicketsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      if (!resetPasswordData.restaurantId || !resetPasswordData.newPassword) {
        alert('Please select a restaurant and enter a new password');
        return;
      }
      await axios.post('/api/super-admin/support/reset-password', resetPasswordData);
      alert('Password reset successfully!');
      setShowPasswordModal(false);
      setResetPasswordData({ restaurantId: '', newPassword: '' });
    } catch (error) {
      console.error('Error resetting password:', error);
      alert('Failed to reset password');
    }
  };

  const handleFixMissingIds = async () => {
    try {
      if (!confirm('This will generate Restaurant IDs and QR codes for restaurants that are missing them. Continue?')) {
        return;
      }
      
      const response = await axios.post('/api/super-admin/smartserve/fix-missing-ids');
      
      if (response.data.success) {
        alert(`✅ ${response.data.message}\n\nFixed restaurants:\n${response.data.data.map(r => `- ${r.restaurantName}: ${r.restaurantId}`).join('\n')}`);
        fetchData(); // Refresh the list
      }
    } catch (error) {
      console.error('Error fixing restaurant IDs:', error);
      alert('Failed to fix restaurant IDs: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleImpersonate = async (restaurantId) => {
    try {
      const response = await axios.post(`/api/super-admin/support/impersonate/${restaurantId}`);
      const { token, restaurant } = response.data.data;
      
      // Store impersonation token
      localStorage.setItem('impersonation_token', token);
      localStorage.setItem('impersonated_restaurant', JSON.stringify(restaurant));
      
      alert(`Impersonating ${restaurant.name}. You will be logged in as this restaurant for 2 hours.`);
      
      // Redirect to Smart Serve Admin dashboard
      window.open('http://localhost:3000', '_blank');
    } catch (error) {
      console.error('Error impersonating restaurant:', error);
      alert('Failed to impersonate restaurant');
    }
  };

  const handleCreateTicket = async (ticketData) => {
    try {
      await axios.post('/api/super-admin/support/tickets', ticketData);
      alert('Ticket created successfully!');
      fetchTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert('Failed to create ticket');
    }
  };

  const handleUpdateTicket = async (ticketId, updates) => {
    try {
      await axios.put(`/api/super-admin/support/tickets/${ticketId}`, updates);
      alert('Ticket updated successfully!');
      fetchTickets();
      setShowTicketModal(false);
      setSelectedTicket(null);
    } catch (error) {
      console.error('Error updating ticket:', error);
      alert('Failed to update ticket');
    }
  };

  const openTicketModal = (ticket) => {
    setSelectedTicket(ticket);
    setShowTicketModal(true);
  };

  const handleSettingChange = (category, field, value) => {
    setPlatformSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const handleSaveSettings = async () => {
    try {
      await axios.put('/api/super-admin/settings', platformSettings);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const openCreateModal = () => {
    setModalMode('create');
    setFormData({
      restaurantName: '',
      ownerName: '',
      email: '',
      phone: '',
      address: '',
      password: ''
    });
    setShowModal(true);
  };

  const openEditModal = (restaurant) => {
    setModalMode('edit');
    setSelectedRestaurant(restaurant);
    setFormData({
      restaurantName: restaurant.restaurantName,
      ownerName: restaurant.ownerName,
      email: restaurant.email,
      phone: restaurant.phone || '',
      address: restaurant.address || '',
      password: ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRestaurant(null);
    setFormData({
      restaurantName: '',
      ownerName: '',
      email: '',
      phone: '',
      address: '',
      password: ''
    });
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'create') {
        const response = await axios.post('/api/super-admin/smartserve/create', formData);
        console.log('Restaurant created:', response.data);
      } else {
        await axios.put(`/api/super-admin/smartserve/${selectedRestaurant._id}`, formData);
      }
      fetchData();
      closeModal();
    } catch (error) {
      console.error('Error saving restaurant:', error);
      alert(error.response?.data?.message || 'Failed to save restaurant');
    }
  };

  const handleToggleStatus = async (restaurantId, currentStatus) => {
    try {
      await axios.put(`/api/super-admin/smartserve/${restaurantId}`, {
        isActive: !currentStatus
      });
      fetchData();
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Failed to update status');
    }
  };

  const handleDelete = async (restaurantId, restaurantName) => {
    if (window.confirm(`Are you sure you want to delete ${restaurantName}? This action cannot be undone.`)) {
      try {
        await axios.delete(`/api/super-admin/smartserve/${restaurantId}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting restaurant:', error);
        alert('Failed to delete restaurant');
      }
    }
  };

  const openBillingModal = (restaurant) => {
    setBillingRestaurant(restaurant);
    setShowBillingModal(true);
  };

  const closeBillingModal = () => {
    setShowBillingModal(false);
    setBillingRestaurant(null);
  };

  const handleSubscriptionChange = async (restaurantId, newPlan) => {
    try {
      const endDate = newPlan === 'TRIAL' 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year for paid plans

      await axios.put(`/api/super-admin/smartserve/${restaurantId}/subscription`, {
        plan: newPlan,
        status: 'ACTIVE',
        startDate: new Date(),
        endDate
      });
      fetchData();
      closeBillingModal();
    } catch (error) {
      console.error('Error updating subscription:', error);
      alert('Failed to update subscription');
    }
  };

  const handleSuspendSubscription = async (restaurantId) => {
    if (window.confirm('Are you sure you want to suspend this subscription?')) {
      try {
        await axios.put(`/api/super-admin/smartserve/${restaurantId}/subscription`, {
          status: 'SUSPENDED'
        });
        fetchData();
        closeBillingModal();
      } catch (error) {
        console.error('Error suspending subscription:', error);
        alert('Failed to suspend subscription');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-purple-primary text-xl">Loading...</div>
      </div>
    );
  }

  // Calculate uptime percentage
  const activeRestaurants = restaurants.filter(r => r.isActive).length;
  const uptimePercentage = restaurants.length > 0 
    ? ((activeRestaurants / restaurants.length) * 100).toFixed(2)
    : 0;

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Top Navigation */}
      <nav className="bg-black border-b border-dark-border">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo & Menu */}
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-primary rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-white font-semibold text-lg">DevOps</span>
              </div>
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setActiveTab('overview')}
                  className={`text-sm transition-colors ${
                    activeTab === 'overview' 
                      ? 'text-white border-b-2 border-purple-primary pb-1' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Overview
                </button>
                <button 
                  onClick={() => setActiveTab('restaurants')}
                  className={`text-sm transition-colors ${
                    activeTab === 'restaurants' 
                      ? 'text-white border-b-2 border-purple-primary pb-1' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Restaurants
                </button>
                <button 
                  onClick={() => setActiveTab('billing')}
                  className={`text-sm transition-colors ${
                    activeTab === 'billing' 
                      ? 'text-white border-b-2 border-purple-primary pb-1' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Billing
                </button>
                <button 
                  onClick={() => setActiveTab('settings')}
                  className={`text-sm transition-colors ${
                    activeTab === 'settings' 
                      ? 'text-white border-b-2 border-purple-primary pb-1' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Settings
                </button>
                <button 
                  onClick={() => setActiveTab('support')}
                  className={`text-sm transition-colors ${
                    activeTab === 'support' 
                      ? 'text-white border-b-2 border-purple-primary pb-1' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Support Tools
                </button>
                <button className="text-gray-400 text-sm hover:text-white transition-colors">
                  Logs
                </button>
              </div>
            </div>

            {/* Search & User */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-dark-card border border-dark-border rounded-lg pl-10 pr-4 py-2 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-purple-primary w-64"
                />
              </div>
              <button className="relative p-2 hover:bg-dark-card rounded-lg transition-colors">
                <Bell className="w-5 h-5 text-gray-400" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 hover:bg-dark-card rounded-lg px-3 py-2 transition-colors"
              >
                <div className="w-8 h-8 bg-purple-primary rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-white">Senior Developer</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {activeTab === 'overview' ? 'Dashboard' : 
               activeTab === 'restaurants' ? 'Restaurant Management' : 
               activeTab === 'billing' ? 'Billing & Subscriptions' :
               activeTab === 'support' ? 'Support Tools' :
               'Platform Settings'}
            </h1>
            <p className="text-gray-400">
              {activeTab === 'overview' 
                ? 'Monitor your infrastructure and application health' 
                : activeTab === 'restaurants'
                ? 'Manage all registered restaurants and their details'
                : activeTab === 'billing'
                ? 'Manage subscriptions and billing for all clients'
                : activeTab === 'support'
                ? 'Password resets, impersonation, and support tickets'
                : 'Configure global platform settings and features'}
            </p>
          </div>
          {activeTab === 'restaurants' && (
            <div className="flex gap-2">
              <button
                onClick={handleFixMissingIds}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
                title="Fix restaurants without IDs"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Fix Missing IDs
              </button>
              <button
                onClick={openCreateModal}
                className="flex items-center gap-2 bg-purple-primary hover:bg-purple-light text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Restaurant
              </button>
            </div>
          )}
        </div>

        {/* Overview Tab Content */}
        {activeTab === 'overview' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Activity className="w-5 h-5 text-green-400" />}
            title="System Uptime"
            value={`${uptimePercentage}%`}
            subtitle="+2.5% from last month"
            timeframe="Last 30d"
            trend="up"
          />
          <StatCard
            icon={<Zap className="w-5 h-5 text-blue-400" />}
            title="API Requests"
            value={`${(stats?.totalOrders || 0) / 1000}k`}
            subtitle="-24ms avg response"
            timeframe="24h"
          />
          <StatCard
            icon={<Layers className="w-5 h-5 text-purple-400" />}
            title="Active Deployments"
            value={activeRestaurants}
            subtitle={`${restaurants.filter(r => r.subscription?.status === 'ACTIVE').length} healthy`}
            timeframe="Live"
            highlight
          />
          <StatCard
            icon={<AlertTriangle className="w-5 h-5 text-red-400" />}
            title="Critical Issues"
            value={restaurants.filter(r => !r.isActive).length}
            subtitle={`${restaurants.filter(r => r.subscription?.status === 'SUSPENDED').length} warnings pending`}
            timeframe="Unresolved"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Charts & Deployments */}
          <div className="lg:col-span-2 space-y-6">
            {/* API Performance Chart */}
            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-white mb-1">Orders & Revenue Trends</h2>
                  <p className="text-sm text-gray-400">Performance over the last {analyticsPeriod === '7days' ? '7 days' : analyticsPeriod === '30days' ? '30 days' : analyticsPeriod === '90days' ? '90 days' : '1 year'}</p>
                </div>
                <select
                  value={analyticsPeriod}
                  onChange={(e) => setAnalyticsPeriod(e.target.value)}
                  className="bg-dark-bg border border-dark-border rounded px-3 py-1 text-sm text-white focus:outline-none focus:border-purple-primary"
                >
                  <option value="7days">7 Days</option>
                  <option value="30days">30 Days</option>
                  <option value="90days">90 Days</option>
                  <option value="1year">1 Year</option>
                </select>
              </div>
              <div className="h-64">
                {analyticsLoading || !analyticsData ? (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    Loading analytics...
                  </div>
                ) : (() => {
                  // Determine number of days based on period
                  const periodDays = analyticsPeriod === '7days' ? 7
                    : analyticsPeriod === '30days' ? 30
                    : analyticsPeriod === '90days' ? 90
                    : 365;

                  // Build a full date scaffold for the period
                  const dateScaffold = Array.from({ length: periodDays }, (_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (periodDays - 1 - i));
                    return d.toISOString().slice(0, 10);
                  });

                  // Index API data by date
                  const apiDataMap = {};
                  (analyticsData.ordersOverTime || []).forEach(item => {
                    apiDataMap[item._id] = item;
                  });

                  // Merge scaffold with API data
                  const chartData = dateScaffold.map(date => ({
                    _id: date,
                    orders: apiDataMap[date]?.orders || 0,
                    revenue: apiDataMap[date]?.revenue || 0,
                  }));

                  // Check if there's any real data
                  const hasData = chartData.some(d => d.orders > 0 || d.revenue > 0);

                  // Format date label as MM/DD
                  const formatDate = (dateStr) => {
                    const [, month, day] = dateStr.split('-');
                    return `${month}/${day}`;
                  };

                  if (!hasData) {
                    return (
                      <div className="flex flex-col items-center justify-center h-full gap-2">
                        <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p className="text-gray-500 text-sm">No orders yet in this period</p>
                        <p className="text-gray-600 text-xs">Orders will appear here once restaurants start receiving them</p>
                      </div>
                    );
                  }

                  return (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="_id"
                        stroke="#9ca3af"
                        style={{ fontSize: '11px' }}
                        tickFormatter={formatDate}
                        interval={periodDays <= 7 ? 0 : periodDays <= 30 ? 4 : periodDays <= 90 ? 13 : 30}
                      />
                      <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                        labelStyle={{ color: '#f3f4f6' }}
                        labelFormatter={(label) => `Date: ${label}`}
                        formatter={(value, name) => [
                          name === 'Revenue ($)' ? `$${value.toFixed(2)}` : value,
                          name
                        ]}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="orders" stroke="#7c3aed" fillOpacity={1} fill="url(#colorOrders)" name="Orders" />
                      <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" name="Revenue ($)" />
                    </AreaChart>
                  </ResponsiveContainer>
                  );
                })()}
              </div>
            </div>

            {/* Deployments List */}
            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">Deployments</h2>
                <button className="text-sm text-purple-primary hover:text-purple-light">
                  View all
                </button>
              </div>
              <div className="space-y-4">
                {restaurants.slice(0, 4).map((restaurant) => (
                  <DeploymentCard key={restaurant._id} restaurant={restaurant} />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Events & Feature Flags */}
          <div className="space-y-6">
            {/* Plan Distribution Chart */}
            {analyticsData && analyticsData.planDistribution && (
              <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Plan Distribution</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.planDistribution.map(item => ({
                          name: item._id || 'TRIAL',
                          value: item.count
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analyticsData.planDistribution.map((entry, index) => {
                          const colors = ['#6b7280', '#10b981', '#3b82f6', '#7c3aed'];
                          return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                        })}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Recent Events */}
            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Recent Events</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                <EventItem
                  type="error"
                  title="Payment processing failed for subscription sub-3"
                  source="Payment Gateway"
                  time="7:38:33 pm"
                  status="Mark as resolved"
                />
                <EventItem
                  type="warning"
                  title="High response time detected: 890ms avg"
                  source="API Gateway"
                  time="7:09:23 pm"
                />
                <EventItem
                  type="info"
                  title="Version 2.4.1 deployed successfully to prod-1"
                  source="Deployment"
                  time="6:09:23 pm"
                />
                <EventItem
                  type="critical"
                  title="Connection pool exhausted for client-3"
                  source="Database"
                  time="4:04:33 pm"
                  status="Mark as resolved"
                />
              </div>
            </div>

            {/* Feature Flags */}
            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Feature Flags</h2>
              <div className="space-y-4">
                <FeatureFlag
                  title="AI Menu Recommendations"
                  description="Enable AI-powered menu item recommendations for customers"
                  tag="per_client"
                  enabled={true}
                />
                <FeatureFlag
                  title="Real-time Order Updates"
                  description="Push real-time order status updates to customer devices"
                  tag="global"
                  enabled={true}
                />
                <FeatureFlag
                  title="Advanced Analytics"
                  description="Enable advanced analytics dashboard for restaurant owners"
                  tag="per_client • 2 clients"
                  enabled={true}
                />
                <FeatureFlag
                  title="Multi-location Support"
                  description="Allow restaurant chains to manage multiple locations"
                  tag="per_client • 1 clients"
                  enabled={true}
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <QuickAction title="Deploy new version" />
                <QuickAction title="Create rollback point" />
                <QuickAction title="View analytics" />
              </div>
            </div>
          </div>
        </div>
          </>
        )}

        {/* Restaurants Tab Content */}
        {activeTab === 'restaurants' && (
          <div className="bg-dark-card border border-dark-border rounded-xl p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-border">
                    <th className="text-left text-sm font-semibold text-gray-400 pb-3">Restaurant</th>
                    <th className="text-left text-sm font-semibold text-gray-400 pb-3">Restaurant ID</th>
                    <th className="text-left text-sm font-semibold text-gray-400 pb-3">Owner</th>
                    <th className="text-left text-sm font-semibold text-gray-400 pb-3">Contact</th>
                    <th className="text-left text-sm font-semibold text-gray-400 pb-3">Plan</th>
                    <th className="text-left text-sm font-semibold text-gray-400 pb-3">Status</th>
                    <th className="text-left text-sm font-semibold text-gray-400 pb-3">Orders</th>
                    <th className="text-right text-sm font-semibold text-gray-400 pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {restaurants.map((restaurant) => (
                    <tr key={restaurant._id} className="border-b border-dark-border hover:bg-dark-bg transition-colors">
                      <td className="py-4">
                        <div>
                          <div className="text-white font-medium">{restaurant.restaurantName}</div>
                          <div className="text-xs text-gray-500">{restaurant.address || 'No address'}</div>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <code className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded text-xs font-mono">
                            {restaurant.restaurantId || 'N/A'}
                          </code>
                          {restaurant.restaurantId && (
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(restaurant.restaurantId);
                                alert('Restaurant ID copied to clipboard!');
                              }}
                              className="p-1 text-gray-400 hover:text-purple-400 transition-colors"
                              title="Copy Restaurant ID"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="text-gray-300">{restaurant.ownerName}</div>
                      </td>
                      <td className="py-4">
                        <div>
                          <div className="text-sm text-gray-300 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {restaurant.email}
                          </div>
                          {restaurant.phone && (
                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                              <Phone className="w-3 h-3" />
                              {restaurant.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-purple-400" />
                          <span className="text-sm text-gray-300">
                            {restaurant.subscription?.plan || 'TRIAL'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                          restaurant.isActive 
                            ? 'bg-green-500/10 text-green-400' 
                            : 'bg-red-500/10 text-red-400'
                        }`}>
                          <Circle className={`w-2 h-2 fill-current`} />
                          {restaurant.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="text-gray-300">{restaurant.stats?.totalOrders || 0}</div>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setCredentialsRestaurant(restaurant);
                              setShowCredentialsModal(true);
                              setNewPasswordForCredentials('');
                            }}
                            className="p-2 text-purple-400 hover:bg-dark-bg rounded transition-colors"
                            title="View Credentials"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(restaurant._id, restaurant.isActive)}
                            className={`p-2 rounded hover:bg-dark-bg transition-colors ${
                              restaurant.isActive ? 'text-yellow-400' : 'text-green-400'
                            }`}
                            title={restaurant.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {restaurant.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => openEditModal(restaurant)}
                            className="p-2 text-blue-400 hover:bg-dark-bg rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(restaurant._id, restaurant.restaurantName)}
                            className="p-2 text-red-400 hover:bg-dark-bg rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {restaurants.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No restaurants found. Click "Add Restaurant" to create one.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Billing Tab Content */}
        {activeTab === 'billing' && (
          <div className="space-y-6">
            {/* Subscription Plans Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {subscriptionPlans.map((plan) => {
                const planCount = restaurants.filter(r => r.subscription?.plan === plan.name).length;
                const planRevenue = plan.price * planCount;
                
                return (
                  <div key={plan.name} className="bg-dark-card border border-dark-border rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                      <span className="text-2xl font-bold text-purple-primary">${plan.price}</span>
                    </div>
                    <p className="text-sm text-gray-400 mb-4">{plan.duration}</p>
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Active Clients</span>
                        <span className="text-white font-semibold">{planCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Monthly Revenue</span>
                        <span className="text-green-400 font-semibold">${planRevenue.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-dark-border">
                      <div className="text-xs text-gray-500 space-y-1">
                        {plan.features.slice(0, 3).map((feature, idx) => (
                          <div key={idx}>• {feature}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Clients by Subscription */}
            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Client Subscriptions</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dark-border">
                      <th className="text-left text-sm font-semibold text-gray-400 pb-3">Restaurant</th>
                      <th className="text-left text-sm font-semibold text-gray-400 pb-3">Current Plan</th>
                      <th className="text-left text-sm font-semibold text-gray-400 pb-3">Status</th>
                      <th className="text-left text-sm font-semibold text-gray-400 pb-3">Start Date</th>
                      <th className="text-left text-sm font-semibold text-gray-400 pb-3">End Date</th>
                      <th className="text-left text-sm font-semibold text-gray-400 pb-3">Monthly Fee</th>
                      <th className="text-right text-sm font-semibold text-gray-400 pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {restaurants.map((restaurant) => {
                      const plan = subscriptionPlans.find(p => p.name === restaurant.subscription?.plan) || subscriptionPlans[0];
                      const subscription = restaurant.subscription || {};
                      
                      return (
                        <tr key={restaurant._id} className="border-b border-dark-border hover:bg-dark-bg transition-colors">
                          <td className="py-4">
                            <div className="text-white font-medium">{restaurant.restaurantName}</div>
                            <div className="text-xs text-gray-500">{restaurant.ownerName}</div>
                          </td>
                          <td className="py-4">
                            <span className={`px-3 py-1 rounded text-sm font-medium ${
                              subscription.plan === 'ENTERPRISE' ? 'bg-purple-500/20 text-purple-400' :
                              subscription.plan === 'PRO' ? 'bg-blue-500/20 text-blue-400' :
                              subscription.plan === 'BASIC' ? 'bg-green-500/20 text-green-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {subscription.plan || 'TRIAL'}
                            </span>
                          </td>
                          <td className="py-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                              subscription.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400' :
                              subscription.status === 'TRIAL' ? 'bg-yellow-500/10 text-yellow-400' :
                              subscription.status === 'SUSPENDED' ? 'bg-red-500/10 text-red-400' :
                              'bg-gray-500/10 text-gray-400'
                            }`}>
                              <Circle className="w-2 h-2 fill-current" />
                              {subscription.status || 'TRIAL'}
                            </span>
                          </td>
                          <td className="py-4">
                            <div className="text-sm text-gray-300">
                              {subscription.startDate ? new Date(subscription.startDate).toLocaleDateString() : '-'}
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="text-sm text-gray-300">
                              {subscription.endDate ? new Date(subscription.endDate).toLocaleDateString() : '-'}
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="text-white font-semibold">${plan.price}</div>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openBillingModal(restaurant)}
                                className="px-3 py-1 bg-purple-primary hover:bg-purple-light text-white text-sm rounded transition-colors"
                              >
                                Manage
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab Content */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {settingsLoading || !platformSettings ? (
              <div className="text-center py-12 text-gray-400">Loading settings...</div>
            ) : (
              <>
                {/* Regional Settings */}
                <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Regional Settings</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Currency</label>
                      <select
                        value={platformSettings.regional?.currency || 'USD'}
                        onChange={(e) => handleSettingChange('regional', 'currency', e.target.value)}
                        className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-primary"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="INR">INR (₹)</option>
                        <option value="JPY">JPY (¥)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Timezone</label>
                      <select
                        value={platformSettings.regional?.timezone || 'UTC'}
                        onChange={(e) => handleSettingChange('regional', 'timezone', e.target.value)}
                        className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-primary"
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">EST (New York)</option>
                        <option value="America/Los_Angeles">PST (Los Angeles)</option>
                        <option value="Europe/London">GMT (London)</option>
                        <option value="Asia/Tokyo">JST (Tokyo)</option>
                        <option value="Asia/Kolkata">IST (India)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Date Format</label>
                      <select
                        value={platformSettings.regional?.dateFormat || 'MM/DD/YYYY'}
                        onChange={(e) => handleSettingChange('regional', 'dateFormat', e.target.value)}
                        className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-primary"
                      >
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
                      <select
                        value={platformSettings.regional?.language || 'en'}
                        onChange={(e) => handleSettingChange('regional', 'language', e.target.value)}
                        className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-primary"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="ja">Japanese</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Tax Settings */}
                <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Tax Settings</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">Enable Tax</div>
                        <div className="text-sm text-gray-400">Apply tax to all restaurant orders</div>
                      </div>
                      <button 
                        onClick={() => handleSettingChange('tax', 'enabled', !platformSettings.tax?.enabled)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          platformSettings.tax?.enabled ? 'bg-purple-primary' : 'bg-gray-700'
                        }`}
                      >
                        <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          platformSettings.tax?.enabled ? 'translate-x-5' : ''
                        }`} />
                      </button>
                    </div>
                    {platformSettings.tax?.enabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Default Tax Rate (%)</label>
                          <input
                            type="number"
                            value={platformSettings.tax?.defaultRate || 0}
                            onChange={(e) => handleSettingChange('tax', 'defaultRate', parseFloat(e.target.value))}
                            className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-primary"
                            step="0.01"
                            min="0"
                            max="100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Tax Label</label>
                          <input
                            type="text"
                            value={platformSettings.tax?.taxLabel || 'Tax'}
                            onChange={(e) => handleSettingChange('tax', 'taxLabel', e.target.value)}
                            className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-primary"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Feature Toggles */}
                <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Feature Toggles</h2>
                  <div className="space-y-4">
                    {[
                      { key: 'customBranding', label: 'Custom Branding', desc: 'Allow restaurants to customize their branding' },
                      { key: 'advancedAnalytics', label: 'Advanced Analytics', desc: 'Enable advanced analytics and reporting' },
                      { key: 'paymentIntegration', label: 'Payment Integration', desc: 'Enable online payment processing' },
                      { key: 'qrCodeCustomization', label: 'QR Code Customization', desc: 'Allow custom QR code designs' },
                      { key: 'multiLocation', label: 'Multi-Location Support', desc: 'Support restaurant chains with multiple locations' },
                      { key: 'aiRecommendations', label: 'AI Recommendations', desc: 'Enable AI-powered menu recommendations' },
                    ].map((feature) => (
                      <div key={feature.key} className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-medium">{feature.label}</div>
                          <div className="text-sm text-gray-400">{feature.desc}</div>
                        </div>
                        <button 
                          onClick={() => handleSettingChange('features', feature.key, !platformSettings.features?.[feature.key])}
                          className={`relative w-11 h-6 rounded-full transition-colors ${
                            platformSettings.features?.[feature.key] ? 'bg-purple-primary' : 'bg-gray-700'
                          }`}
                        >
                          <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            platformSettings.features?.[feature.key] ? 'translate-x-5' : ''
                          }`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* System Settings */}
                <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                  <h2 className="text-xl font-bold text-white mb-4">System Settings</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">Maintenance Mode</div>
                        <div className="text-sm text-gray-400">Temporarily disable system access</div>
                      </div>
                      <button 
                        onClick={() => handleSettingChange('system', 'maintenanceMode', !platformSettings.system?.maintenanceMode)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          platformSettings.system?.maintenanceMode ? 'bg-red-500' : 'bg-gray-700'
                        }`}
                      >
                        <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          platformSettings.system?.maintenanceMode ? 'translate-x-5' : ''
                        }`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">Allow New Signups</div>
                        <div className="text-sm text-gray-400">Enable new restaurant registrations</div>
                      </div>
                      <button 
                        onClick={() => handleSettingChange('system', 'allowNewSignups', !platformSettings.system?.allowNewSignups)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          platformSettings.system?.allowNewSignups ? 'bg-purple-primary' : 'bg-gray-700'
                        }`}
                      >
                        <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          platformSettings.system?.allowNewSignups ? 'translate-x-5' : ''
                        }`} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Max Restaurants</label>
                        <input
                          type="number"
                          value={platformSettings.system?.maxRestaurants || 1000}
                          onChange={(e) => handleSettingChange('system', 'maxRestaurants', parseInt(e.target.value))}
                          className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-primary"
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Session Timeout (minutes)</label>
                        <input
                          type="number"
                          value={platformSettings.system?.sessionTimeout || 30}
                          onChange={(e) => handleSettingChange('system', 'sessionTimeout', parseInt(e.target.value))}
                          className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-primary"
                          min="5"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Email Settings */}
                <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Email Settings</h2>
                  <div className="space-y-4">
                    {[
                      { key: 'sendWelcomeEmail', label: 'Welcome Emails', desc: 'Send welcome email to new restaurants' },
                      { key: 'sendBillingReminders', label: 'Billing Reminders', desc: 'Send payment reminder emails' },
                      { key: 'sendSystemNotifications', label: 'System Notifications', desc: 'Send system update notifications' },
                    ].map((setting) => (
                      <div key={setting.key} className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-medium">{setting.label}</div>
                          <div className="text-sm text-gray-400">{setting.desc}</div>
                        </div>
                        <button 
                          onClick={() => handleSettingChange('email', setting.key, !platformSettings.email?.[setting.key])}
                          className={`relative w-11 h-6 rounded-full transition-colors ${
                            platformSettings.email?.[setting.key] ? 'bg-purple-primary' : 'bg-gray-700'
                          }`}
                        >
                          <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            platformSettings.email?.[setting.key] ? 'translate-x-5' : ''
                          }`} />
                        </button>
                      </div>
                    ))}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">Support Email</label>
                      <input
                        type="email"
                        value={platformSettings.email?.supportEmail || ''}
                        onChange={(e) => handleSettingChange('email', 'supportEmail', e.target.value)}
                        className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-primary"
                        placeholder="support@smartserve.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Subscription Defaults */}
                <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Subscription Defaults</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Trial Period (days)</label>
                      <input
                        type="number"
                        value={platformSettings.subscription?.defaultTrialDays || 30}
                        onChange={(e) => handleSettingChange('subscription', 'defaultTrialDays', parseInt(e.target.value))}
                        className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-primary"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Grace Period (days)</label>
                      <input
                        type="number"
                        value={platformSettings.subscription?.gracePeriodDays || 7}
                        onChange={(e) => handleSettingChange('subscription', 'gracePeriodDays', parseInt(e.target.value))}
                        className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-primary"
                        min="0"
                      />
                    </div>
                    <div className="flex items-end">
                      <div className="w-full">
                        <div className="flex items-center justify-between">
                          <label className="block text-sm font-medium text-gray-300 mb-2">Auto-Suspend</label>
                          <button 
                            onClick={() => handleSettingChange('subscription', 'autoSuspendOnExpiry', !platformSettings.subscription?.autoSuspendOnExpiry)}
                            className={`relative w-11 h-6 rounded-full transition-colors ${
                              platformSettings.subscription?.autoSuspendOnExpiry ? 'bg-purple-primary' : 'bg-gray-700'
                            }`}
                          >
                            <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                              platformSettings.subscription?.autoSuspendOnExpiry ? 'translate-x-5' : ''
                            }`} />
                          </button>
                        </div>
                        <div className="text-xs text-gray-400">Suspend on expiry</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveSettings}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-primary hover:bg-purple-light text-white rounded-lg transition-colors"
                  >
                    <Save className="w-5 h-5" />
                    Save All Settings
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {modalMode === 'create' ? 'Add New Restaurant' : 'Edit Restaurant'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-dark-bg rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Restaurant Name *
                </label>
                <input
                  type="text"
                  name="restaurantName"
                  value={formData.restaurantName}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-primary"
                  placeholder="Enter restaurant name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Owner Name *
                </label>
                <input
                  type="text"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-primary"
                  placeholder="Enter owner name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  disabled={modalMode === 'edit'}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-primary"
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-primary"
                  placeholder="Enter address"
                />
              </div>
              {modalMode === 'create' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-primary"
                    placeholder="Enter password"
                  />
                </div>
              )}
              {modalMode === 'edit' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    New Password (leave blank to keep current)
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-primary"
                    placeholder="Enter new password"
                  />
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 bg-dark-bg border border-dark-border text-gray-300 rounded-lg hover:bg-dark-border transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-primary text-white rounded-lg hover:bg-purple-light transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {modalMode === 'create' ? 'Create' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Billing/Subscription Management Modal */}
      {showBillingModal && billingRestaurant && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">{billingRestaurant.restaurantName}</h2>
                <p className="text-sm text-gray-400">Manage subscription and billing</p>
              </div>
              <button
                onClick={closeBillingModal}
                className="p-2 hover:bg-dark-bg rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Current Subscription Info */}
            <div className="bg-dark-bg border border-dark-border rounded-lg p-4 mb-6">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Current Subscription</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Plan</div>
                  <div className="text-white font-semibold">{billingRestaurant.subscription?.plan || 'TRIAL'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Status</div>
                  <div className={`font-semibold ${
                    billingRestaurant.subscription?.status === 'ACTIVE' ? 'text-green-400' :
                    billingRestaurant.subscription?.status === 'TRIAL' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {billingRestaurant.subscription?.status || 'TRIAL'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Start Date</div>
                  <div className="text-white">
                    {billingRestaurant.subscription?.startDate 
                      ? new Date(billingRestaurant.subscription.startDate).toLocaleDateString()
                      : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">End Date</div>
                  <div className="text-white">
                    {billingRestaurant.subscription?.endDate 
                      ? new Date(billingRestaurant.subscription.endDate).toLocaleDateString()
                      : '-'}
                  </div>
                </div>
              </div>
            </div>

            {/* Change Plan Section */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Change Plan</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {subscriptionPlans.map((plan) => (
                  <div
                    key={plan.name}
                    className={`border rounded-lg p-4 transition-all cursor-pointer ${
                      billingRestaurant.subscription?.plan === plan.name
                        ? 'border-purple-primary bg-purple-primary/5'
                        : 'border-dark-border bg-dark-bg hover:border-purple-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-semibold">{plan.name}</h4>
                      {billingRestaurant.subscription?.plan === plan.name && (
                        <span className="text-xs bg-purple-primary text-white px-2 py-0.5 rounded">Current</span>
                      )}
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">
                      ${plan.price}
                      <span className="text-sm text-gray-400 font-normal">/{plan.duration}</span>
                    </div>
                    <ul className="space-y-1 mb-4">
                      {plan.features.slice(0, 3).map((feature, idx) => (
                        <li key={idx} className="text-xs text-gray-400 flex items-start gap-1">
                          <span className="text-green-400 mt-0.5">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    {billingRestaurant.subscription?.plan !== plan.name && (
                      <button
                        onClick={() => handleSubscriptionChange(billingRestaurant._id, plan.name)}
                        className="w-full py-2 bg-purple-primary hover:bg-purple-600 text-white text-sm rounded transition-colors"
                      >
                        Switch to {plan.name}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Subscription Actions */}
            <div className="border-t border-dark-border pt-6">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Subscription Actions</h3>
              <div className="flex flex-wrap gap-3">
                {billingRestaurant.subscription?.status !== 'SUSPENDED' && (
                  <button
                    onClick={() => handleSuspendSubscription(billingRestaurant._id)}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition-colors text-sm flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Suspend Subscription
                  </button>
                )}
                {billingRestaurant.subscription?.status === 'SUSPENDED' && (
                  <button
                    onClick={async () => {
                      try {
                        await axios.put(`/api/super-admin/smartserve/${billingRestaurant._id}/subscription`, {
                          status: 'ACTIVE'
                        });
                        fetchData();
                        closeBillingModal();
                      } catch (error) {
                        console.error('Error reactivating subscription:', error);
                        alert('Failed to reactivate subscription');
                      }
                    }}
                    className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg transition-colors text-sm"
                  >
                    Reactivate Subscription
                  </button>
                )}
                <button
                  onClick={async () => {
                    const days = parseInt(prompt('Enter number of days to extend:'));
                    if (days && !isNaN(days)) {
                      try {
                        const currentEnd = billingRestaurant.subscription?.endDate 
                          ? new Date(billingRestaurant.subscription.endDate) 
                          : new Date();
                        const newEndDate = new Date(currentEnd.getTime() + days * 24 * 60 * 60 * 1000);
                        
                        await axios.put(`/api/super-admin/smartserve/${billingRestaurant._id}/subscription`, {
                          endDate: newEndDate
                        });
                        fetchData();
                        closeBillingModal();
                      } catch (error) {
                        console.error('Error extending subscription:', error);
                        alert('Failed to extend subscription');
                      }
                    }
                  }}
                  className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg transition-colors text-sm"
                >
                  Extend Subscription
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Key className="w-5 h-5 text-purple-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Reset Restaurant Password</h2>
                  <p className="text-sm text-gray-400">Search and select a restaurant to reset their password</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setSelectedResetRestaurant(null);
                  setRestaurantSearch('');
                  setResetPasswordData({ restaurantId: '', newPassword: '' });
                }}
                className="p-2 hover:bg-dark-bg rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Search Bar */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Search Restaurant</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={restaurantSearch}
                    onChange={(e) => setRestaurantSearch(e.target.value)}
                    placeholder="Search by restaurant name, email, or phone..."
                    className="w-full pl-10 pr-4 py-2 bg-dark-bg border border-dark-border text-white rounded-lg focus:outline-none focus:border-purple-primary"
                  />
                </div>
              </div>

              {/* Restaurant List */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Select Restaurant</label>
                <div className="max-h-64 overflow-y-auto space-y-2 bg-dark-bg border border-dark-border rounded-lg p-2">
                  {restaurants
                    .filter(r => 
                      restaurantSearch === '' ||
                      r.restaurantName.toLowerCase().includes(restaurantSearch.toLowerCase()) ||
                      r.ownerEmail.toLowerCase().includes(restaurantSearch.toLowerCase()) ||
                      r.ownerPhone?.includes(restaurantSearch)
                    )
                    .map((restaurant) => (
                      <div
                        key={restaurant._id}
                        onClick={() => {
                          setSelectedResetRestaurant(restaurant);
                          setResetPasswordData({ ...resetPasswordData, restaurantId: restaurant._id });
                        }}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${
                          selectedResetRestaurant?._id === restaurant._id
                            ? 'bg-purple-500/20 border-2 border-purple-primary'
                            : 'bg-dark-card border border-dark-border hover:border-purple-primary/50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-white font-semibold">{restaurant.restaurantName}</h3>
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                restaurant.subscription?.status === 'ACTIVE' 
                                  ? 'bg-green-500/20 text-green-400'
                                  : restaurant.subscription?.status === 'TRIAL'
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : 'bg-red-500/20 text-red-400'
                              }`}>
                                {restaurant.subscription?.plan || 'TRIAL'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400 mb-1">👤 {restaurant.ownerName}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {restaurant.ownerEmail}
                              </span>
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {restaurant.ownerPhone}
                              </span>
                            </div>
                          </div>
                          {selectedResetRestaurant?._id === restaurant._id && (
                            <CheckCircle2 className="w-5 h-5 text-purple-primary flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    ))}
                  {restaurants.filter(r => 
                    restaurantSearch === '' ||
                    r.restaurantName.toLowerCase().includes(restaurantSearch.toLowerCase()) ||
                    r.ownerEmail.toLowerCase().includes(restaurantSearch.toLowerCase()) ||
                    r.ownerPhone?.includes(restaurantSearch)
                  ).length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No restaurants found</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Restaurant Info */}
              {selectedResetRestaurant && (
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-purple-400 mb-2">Selected Restaurant</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-400">Restaurant:</span>
                      <p className="text-white font-medium">{selectedResetRestaurant.restaurantName}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Owner:</span>
                      <p className="text-white font-medium">{selectedResetRestaurant.ownerName}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Email:</span>
                      <p className="text-white font-medium">{selectedResetRestaurant.ownerEmail}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Phone:</span>
                      <p className="text-white font-medium">{selectedResetRestaurant.ownerPhone}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* New Password Input */}
              {selectedResetRestaurant && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">New Password</label>
                  <input
                    type="text"
                    value={resetPasswordData.newPassword}
                    onChange={(e) => setResetPasswordData({ ...resetPasswordData, newPassword: e.target.value })}
                    placeholder="Enter new password (min 8 characters)"
                    className="w-full px-4 py-2 bg-dark-bg border border-dark-border text-white rounded-lg focus:outline-none focus:border-purple-primary"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Tip: Use a strong password like "TempPass@{new Date().getFullYear()}"
                  </p>
                </div>
              )}

              {/* Warning */}
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                <p className="text-xs text-yellow-400">
                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                  <strong>Important:</strong> This will immediately change the restaurant owner's login password. 
                  Make sure to communicate the new password to them securely (via phone call or support ticket).
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setSelectedResetRestaurant(null);
                    setRestaurantSearch('');
                    setResetPasswordData({ restaurantId: '', newPassword: '' });
                  }}
                  className="flex-1 px-4 py-2 bg-dark-bg border border-dark-border text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetPassword}
                  disabled={!selectedResetRestaurant || !resetPasswordData.newPassword || resetPasswordData.newPassword.length < 8}
                  className="flex-1 px-4 py-2 bg-purple-primary hover:bg-purple-light text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  Reset Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Credentials Modal - Enhanced Version */}
      {showCredentialsModal && credentialsRestaurant && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <KeyRound className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Restaurant Credentials & Information</h2>
                  <p className="text-sm text-gray-400">{credentialsRestaurant.restaurantName}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCredentialsModal(false);
                  setCredentialsRestaurant(null);
                  setNewPasswordForCredentials('');
                }}
                className="p-2 hover:bg-dark-bg rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Information Section */}
              <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-semibold text-white">Basic Information</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Restaurant ID</label>
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-sm text-purple-400 font-mono bg-purple-500/10 px-2 py-1 rounded flex-1">
                        {credentialsRestaurant.restaurantId}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(credentialsRestaurant.restaurantId);
                          alert('Restaurant ID copied!');
                        }}
                        className="p-1.5 text-gray-400 hover:text-purple-400 transition-colors"
                        title="Copy Restaurant ID"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Restaurant Name</label>
                    <p className="text-sm text-white">{credentialsRestaurant.restaurantName}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Status</label>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                      credentialsRestaurant.isActive !== false
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}>
                      <Circle className="w-2 h-2 fill-current" />
                      {credentialsRestaurant.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {credentialsRestaurant.createdAt && (
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Created On</label>
                      <p className="text-sm text-white">{new Date(credentialsRestaurant.createdAt).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Owner Details Section */}
              <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-semibold text-white">Owner Details</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Owner Name</label>
                    <p className="text-sm text-white">{credentialsRestaurant.ownerName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Email</label>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-white truncate flex-1">{credentialsRestaurant.ownerEmail || credentialsRestaurant.email}</p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(credentialsRestaurant.ownerEmail || credentialsRestaurant.email);
                          alert('Email copied!');
                        }}
                        className="p-1.5 text-gray-400 hover:text-purple-400 transition-colors"
                        title="Copy Email"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Phone</label>
                    <p className="text-sm text-white">{credentialsRestaurant.ownerPhone || 'N/A'}</p>
                  </div>
                  {credentialsRestaurant.address && (
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Address</label>
                      <p className="text-sm text-white">{credentialsRestaurant.address}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Login Access Section */}
              <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Key className="w-4 h-4 text-green-400" />
                  <h3 className="text-sm font-semibold text-white">Login Access</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Dashboard URL</label>
                    <div className="flex items-center justify-between gap-2">
                      <a
                        href="http://localhost:5174/login"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-400 hover:text-blue-300 underline truncate flex-1"
                      >
                        http://localhost:5174/login
                      </a>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText('http://localhost:5174/login');
                          alert('URL copied!');
                        }}
                        className="p-1.5 text-gray-400 hover:text-purple-400 transition-colors"
                        title="Copy URL"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Username</label>
                    <p className="text-sm text-white font-mono">{credentialsRestaurant.ownerEmail || credentialsRestaurant.email}</p>
                  </div>
                  <div className="bg-yellow-500/5 border border-yellow-500/20 rounded p-2">
                    <div className="flex items-start gap-2">
                      <Lock className="w-3.5 h-3.5 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-yellow-400">
                        Password is encrypted and cannot be displayed. Use reset function below.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subscription Section */}
              <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="w-4 h-4 text-yellow-400" />
                  <h3 className="text-sm font-semibold text-white">Subscription</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Plan</label>
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      credentialsRestaurant.subscription?.plan === 'ENTERPRISE'
                        ? 'bg-purple-500/10 text-purple-400'
                        : credentialsRestaurant.subscription?.plan === 'PRO'
                        ? 'bg-blue-500/10 text-blue-400'
                        : credentialsRestaurant.subscription?.plan === 'BASIC'
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-gray-500/10 text-gray-400'
                    }`}>
                      {credentialsRestaurant.subscription?.plan || 'TRIAL'}
                    </span>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Status</label>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                      credentialsRestaurant.subscription?.status === 'ACTIVE'
                        ? 'bg-green-500/10 text-green-400'
                        : credentialsRestaurant.subscription?.status === 'TRIAL'
                        ? 'bg-blue-500/10 text-blue-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}>
                      <Circle className="w-2 h-2 fill-current" />
                      {credentialsRestaurant.subscription?.status || 'N/A'}
                    </span>
                  </div>
                  {credentialsRestaurant.subscription?.endDate && (
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Expires On</label>
                      <p className="text-sm text-white">{new Date(credentialsRestaurant.subscription.endDate).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Access Section */}
              {credentialsRestaurant.qrCode?.url && (
                <div className="bg-dark-bg border border-dark-border rounded-lg p-4 md:col-span-2">
                  <div className="flex items-center gap-2 mb-3">
                    <QrCode className="w-4 h-4 text-pink-400" />
                    <h3 className="text-sm font-semibold text-white">Customer Access - QR Code</h3>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* QR Code Image */}
                    <div className="flex flex-col items-center">
                      {qrCodeDataUrl ? (
                        <div className="bg-white p-3 rounded-lg">
                          <img 
                            src={qrCodeDataUrl} 
                            alt="QR Code" 
                            className="w-48 h-48"
                          />
                        </div>
                      ) : (
                        <div className="w-48 h-48 bg-dark-accent rounded-lg flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                        </div>
                      )}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => {
                            const link = document.createElement('a');
                            link.download = `qr-${credentialsRestaurant.restaurantName.replace(/\s+/g, '-')}.png`;
                            link.href = qrCodeDataUrl;
                            link.click();
                          }}
                          className="px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white text-xs rounded transition-colors flex items-center gap-1"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download QR
                        </button>
                        <button
                          onClick={() => window.print()}
                          className="px-3 py-1.5 bg-dark-accent hover:bg-dark-border text-white text-xs rounded transition-colors flex items-center gap-1"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                          Print
                        </button>
                      </div>
                    </div>
                    
                    {/* QR Code Info */}
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Restaurant ID</label>
                        <div className="flex items-center gap-2">
                          <code className="text-sm text-purple-400 bg-dark-accent px-2 py-1 rounded flex-1">{credentialsRestaurant.restaurantId}</code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(credentialsRestaurant.restaurantId);
                              alert('Restaurant ID copied!');
                            }}
                            className="p-1.5 text-gray-400 hover:text-purple-400 transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Customer Menu URL</label>
                        <div className="flex items-center gap-2">
                          <a
                            href={credentialsRestaurant.qrCode.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-400 hover:text-blue-300 underline truncate flex-1"
                          >
                            {credentialsRestaurant.qrCode.url}
                          </a>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(credentialsRestaurant.qrCode.url);
                              alert('QR Code URL copied!');
                            }}
                            className="p-1.5 text-gray-400 hover:text-purple-400 transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="bg-dark-accent/50 border border-dark-border rounded p-3 mt-2">
                        <p className="text-xs text-gray-400 mb-2">📱 Instructions:</p>
                        <ol className="text-xs text-gray-300 space-y-1 list-decimal list-inside">
                          <li>Print or display this QR code at customer tables</li>
                          <li>Customers scan to access the menu</li>
                          <li>Orders are sent directly to the admin dashboard</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Password Reset Section */}
            <div className="mt-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3 mb-4">
                <Lock className="w-5 h-5 text-yellow-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-yellow-400 mb-1">Password Reset</h3>
                  <p className="text-xs text-gray-400">
                    Passwords are encrypted and cannot be retrieved. Set a new password below and securely share it with the restaurant owner.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-2">New Password (minimum 8 characters)</label>
                  <input
                    type="text"
                    value={newPasswordForCredentials}
                    onChange={(e) => setNewPasswordForCredentials(e.target.value)}
                    placeholder="Enter new password for restaurant admin"
                    className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-primary text-sm"
                  />
                </div>
                <button
                  onClick={async () => {
                    if (!newPasswordForCredentials || newPasswordForCredentials.length < 8) {
                      alert('Password must be at least 8 characters long');
                      return;
                    }
                    if (!window.confirm(`Are you sure you want to reset the password for ${credentialsRestaurant.restaurantName}?\n\nThis will immediately change their login credentials.`)) {
                      return;
                    }
                    try {
                      await axios.post('/api/super-admin/support/reset-password', {
                        restaurantId: credentialsRestaurant._id,
                        newPassword: newPasswordForCredentials
                      });
                      alert(`Password reset successfully!\n\nNew Password: ${newPasswordForCredentials}\n\nPlease share this securely with the restaurant owner.`);
                      setNewPasswordForCredentials('');
                    } catch (error) {
                      alert(error.response?.data?.message || 'Failed to reset password');
                    }
                  }}
                  disabled={!newPasswordForCredentials || newPasswordForCredentials.length < 8}
                  className="w-full px-4 py-2.5 bg-purple-primary hover:bg-purple-light text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                >
                  <Lock className="w-4 h-4" />
                  Reset Password
                </button>
              </div>
            </div>

            {/* Security Warning */}
            <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />
                <div className="text-xs text-red-400">
                  <strong>Security Notice:</strong> Always communicate credentials securely via phone call, encrypted messaging, or support ticket. Never send passwords via plain email or SMS.
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="mt-6">
              <button
                onClick={() => {
                  setShowCredentialsModal(false);
                  setCredentialsRestaurant(null);
                  setNewPasswordForCredentials('');
                }}
                className="w-full px-4 py-2 bg-dark-bg border border-dark-border text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {showTicketModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedTicket.subject}</h2>
                <p className="text-sm text-gray-400">#{selectedTicket.ticketNumber}</p>
              </div>
              <button
                onClick={() => setShowTicketModal(false)}
                className="p-2 hover:bg-dark-bg rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Status</label>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => setSelectedTicket({ ...selectedTicket, status: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-bg border border-dark-border text-white rounded-lg focus:outline-none focus:border-purple-primary"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Priority</label>
                  <select
                    value={selectedTicket.priority}
                    onChange={(e) => setSelectedTicket({ ...selectedTicket, priority: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-bg border border-dark-border text-white rounded-lg focus:outline-none focus:border-purple-primary"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Add Message</label>
                <textarea
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  placeholder="Type your response..."
                  rows="4"
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-border text-white rounded-lg focus:outline-none focus:border-purple-primary resize-none"
                />
              </div>

              {selectedTicket.messages?.length > 0 && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Message History</label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedTicket.messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg ${
                          msg.sender === 'support' 
                            ? 'bg-purple-500/10 border border-purple-500/20' 
                            : 'bg-dark-bg border border-dark-border'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500">
                            {msg.sender === 'support' ? 'Support' : 'Customer'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(msg.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-white">{msg.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowTicketModal(false)}
                className="flex-1 px-4 py-2 bg-dark-bg border border-dark-border text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateTicket(selectedTicket._id, {
                  status: selectedTicket.status,
                  priority: selectedTicket.priority,
                  message: ticketMessage
                })}
                className="flex-1 px-4 py-2 bg-purple-primary hover:bg-purple-light text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Update & Send
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Support Tools Tab */}
      {activeTab === 'support' && (
        <div className="space-y-6">
          {/* Quick Info Banner */}
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <Info className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">How to Use Support Tools</h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <p><strong className="text-purple-400">Password Reset:</strong> When a restaurant owner contacts you about forgotten password, search for their restaurant and reset it. Always communicate the new password securely.</p>
                  <p><strong className="text-blue-400">Impersonation:</strong> Login as any restaurant to troubleshoot issues or verify their setup. Session expires in 2 hours.</p>
                  <p><strong className="text-green-400">Support Tickets:</strong> Track all customer support requests, add internal notes, and manage ticket lifecycle.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Password Reset Tool */}
            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Key className="w-5 h-5 text-purple-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Password Reset</h3>
                  <p className="text-sm text-gray-400">Search & reset restaurant passwords</p>
                </div>
              </div>

              <div className="bg-dark-bg border border-dark-border rounded-lg p-4 mb-4">
                <h4 className="text-sm font-semibold text-gray-400 mb-2">Common Scenarios:</h4>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• Restaurant owner forgot their password</li>
                  <li>• Account locked due to multiple failed attempts</li>
                  <li>• New owner taking over restaurant</li>
                  <li>• Security breach requiring password change</li>
                </ul>
              </div>
              
              <button
                onClick={() => setShowPasswordModal(true)}
                className="w-full px-4 py-3 bg-purple-primary hover:bg-purple-light text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                Open Password Reset Tool
              </button>
            </div>

            {/* Impersonation Tool */}
            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <UserCog className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Impersonation</h3>
                  <p className="text-sm text-gray-400">View as restaurant admin (2 hours)</p>
                </div>
              </div>

              <div className="bg-dark-bg border border-dark-border rounded-lg p-4 mb-4">
                <h4 className="text-sm font-semibold text-gray-400 mb-2">Recent Restaurants:</h4>
                <p className="text-xs text-gray-500 mb-3">Quick access to recently active restaurants</p>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {restaurants.slice(0, 5).map((restaurant) => (
                  <div
                    key={restaurant._id}
                    className="flex items-center justify-between p-3 bg-dark-bg border border-dark-border rounded-lg hover:border-blue-500/50 transition-all"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm text-white font-medium">{restaurant.restaurantName}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          restaurant.isActive 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {restaurant.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{restaurant.ownerEmail}</p>
                    </div>
                    <button
                      onClick={() => handleImpersonate(restaurant._id)}
                      className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-sm rounded transition-colors flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Login As
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Support Tickets Section */}
          <div className="lg:col-span-2 bg-dark-card border border-dark-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Ticket className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Support Tickets</h3>
                  <p className="text-sm text-gray-400">Manage customer support requests</p>
                </div>
              </div>
              <button
                className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Ticket
              </button>
            </div>

            {ticketsLoading ? (
              <div className="text-center py-12 text-gray-400">
                <Activity className="w-8 h-8 animate-spin mx-auto mb-2" />
                Loading tickets...
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Ticket className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No support tickets yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.map((ticket) => {
                  const statusColors = {
                    open: 'bg-blue-500/20 text-blue-400',
                    in_progress: 'bg-yellow-500/20 text-yellow-400',
                    resolved: 'bg-green-500/20 text-green-400',
                    closed: 'bg-gray-500/20 text-gray-400'
                  };

                  const priorityColors = {
                    low: 'text-gray-400',
                    medium: 'text-blue-400',
                    high: 'text-orange-400',
                    urgent: 'text-red-400'
                  };

                  return (
                    <div
                      key={ticket._id}
                      className="p-4 bg-dark-bg border border-dark-border rounded-lg hover:border-purple-primary/50 transition-all cursor-pointer"
                      onClick={() => openTicketModal(ticket)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-medium">{ticket.subject}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${statusColors[ticket.status]}`}>
                              {ticket.status.replace('_', ' ')}
                            </span>
                            <span className={`text-xs ${priorityColors[ticket.priority]}`}>
                              ● {ticket.priority}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 mb-2">{ticket.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>#{ticket.ticketNumber}</span>
                            <span>•</span>
                            <span>{ticket.restaurant?.restaurantName || 'N/A'}</span>
                            <span>•</span>
                            <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      </div>
                      {ticket.messages?.length > 0 && (
                        <div className="text-xs text-gray-400 flex items-center gap-2">
                          <Send className="w-3 h-3" />
                          {ticket.messages.length} message{ticket.messages.length !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, title, value, subtitle, timeframe, trend, highlight }) => (
  <div className={`bg-dark-card border ${highlight ? 'border-purple-primary' : 'border-dark-border'} rounded-xl p-6`}>
    <div className="flex items-center justify-between mb-4">
      <div className="p-2 bg-dark-bg rounded-lg">
        {icon}
      </div>
      <span className="text-xs text-gray-500">{timeframe}</span>
    </div>
    <div className="mb-2">
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-400">{title}</div>
    </div>
    <div className={`text-xs ${trend === 'up' ? 'text-green-400' : 'text-gray-400'}`}>
      {subtitle}
    </div>
  </div>
);

const DeploymentCard = ({ restaurant }) => {
  const statusColors = {
    ACTIVE: 'text-green-400',
    TRIAL: 'text-yellow-400',
    SUSPENDED: 'text-red-400',
    INACTIVE: 'text-gray-400'
  };

  const status = restaurant.subscription?.status || 'TRIAL';
  const isHealthy = restaurant.isActive && status === 'ACTIVE';

  return (
    <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isHealthy ? 'bg-green-500/10' : 'bg-yellow-500/10'
          }`}>
            <CheckCircle2 className={`w-5 h-5 ${isHealthy ? 'text-green-400' : 'text-yellow-400'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white font-medium">{restaurant.restaurantName}</span>
              <span className="text-xs px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded">
                production
              </span>
            </div>
            <span className="text-sm text-gray-400">{restaurant.ownerName}</span>
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded ${
          isHealthy ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
        }`}>
          ● {status.toLowerCase()}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-4 text-sm">
        <div>
          <div className="text-gray-500 text-xs mb-1">Version</div>
          <div className="text-white">2.4.1</div>
        </div>
        <div>
          <div className="text-gray-500 text-xs mb-1">Uptime</div>
          <div className="text-white">
            {isHealthy ? '99.8%' : '95.2%'}
          </div>
        </div>
        <div>
          <div className="text-gray-500 text-xs mb-1">Requests</div>
          <div className="text-white">{restaurant.stats?.totalOrders || 0}</div>
        </div>
        <div>
          <div className="text-gray-500 text-xs mb-1">Latency</div>
          <div className="text-white">145ms</div>
        </div>
      </div>
      <div className="flex gap-2 mt-3 pt-3 border-t border-dark-border">
        <button className="text-xs text-gray-400 hover:text-white transition-colors">Pause</button>
        <span className="text-gray-600">•</span>
        <button className="text-xs text-gray-400 hover:text-white transition-colors">View logs</button>
        <span className="text-gray-600">•</span>
        <button className="text-xs text-gray-400 hover:text-white transition-colors">Settings</button>
      </div>
    </div>
  );
};

const EventItem = ({ type, title, source, time, status }) => {
  const typeConfig = {
    error: { icon: XCircle, color: 'text-red-400', label: 'ERROR' },
    warning: { icon: AlertTriangle, color: 'text-yellow-400', label: 'WARNING' },
    info: { icon: Info, color: 'text-blue-400', label: 'INFO' },
    critical: { icon: AlertCircle, color: 'text-red-500', label: 'CRITICAL' }
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className="bg-dark-bg border border-dark-border rounded-lg p-3">
      <div className="flex items-start gap-3 mb-2">
        <Icon className={`w-4 h-4 ${config.color} mt-0.5 flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-semibold ${config.color}`}>{config.label}</span>
            <span className="text-xs text-gray-500">{time}</span>
          </div>
          <p className="text-sm text-white mb-1">{title}</p>
          <p className="text-xs text-gray-500">{source}</p>
          {status && (
            <button className="text-xs text-green-400 hover:text-green-300 mt-2">
              {status}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const FeatureFlag = ({ title, description, tag, enabled }) => (
  <div className="flex items-start justify-between gap-4">
    <div className="flex-1">
      <h3 className="text-white font-medium text-sm mb-1">{title}</h3>
      <p className="text-xs text-gray-400 mb-2">{description}</p>
      <span className="text-xs text-purple-400">{tag}</span>
    </div>
    <button className={`relative w-11 h-6 rounded-full transition-colors ${
      enabled ? 'bg-purple-primary' : 'bg-gray-700'
    }`}>
      <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
        enabled ? 'translate-x-5' : ''
      }`} />
    </button>
  </div>
);

const QuickAction = ({ title }) => (
  <button className="w-full flex items-center justify-between p-3 bg-purple-500/5 hover:bg-purple-500/10 border border-purple-500/20 hover:border-purple-500/40 rounded-lg transition-all group">
    <span className="text-sm text-white">{title}</span>
    <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-purple-400 transition-colors" />
  </button>
);

export default Dashboard;
