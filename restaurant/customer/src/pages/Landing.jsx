import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Crown } from 'lucide-react';
import api from '../services/api';

const Landing = () => {
  const navigate = useNavigate();
  const { restaurantId: restaurantIdFromUrl } = useParams();
  const { setTableNumber, setRestaurantId } = useCart();
  const [table, setTable] = useState('');
  const [currentRestaurantId, setCurrentRestaurantId] = useState('');
  const [restaurantData, setRestaurantData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [manualCode, setManualCode] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);

  useEffect(() => {
    // Fetch restaurant data using unique ID from QR code URL
    const fetchRestaurant = async () => {
      try {
        if (restaurantIdFromUrl) {
          // Customer scanned QR code - fetch by unique restaurantId
          const response = await api.get(`/customer/restaurant/id/${restaurantIdFromUrl}`);
          console.log('Restaurant response:', response.data);
          if (response.data.success) {
            setCurrentRestaurantId(response.data.data._id); // MongoDB _id for API calls
            setRestaurantData(response.data.data);
            console.log('Restaurant loaded:', response.data.data.restaurantName);
          }
        } else {
          // Demo mode - fetch "Delicious Bites" for testing
          const response = await api.get('/customer/restaurant/Delicious Bites');
          console.log('Restaurant response:', response.data);
          if (response.data.success) {
            setCurrentRestaurantId(response.data.data._id);
            setRestaurantData(response.data.data);
            console.log('Restaurant ID set:', response.data.data._id);
          }
        }
      } catch (error) {
        console.error('Error fetching restaurant:', error);
        alert('Restaurant not found. Please scan a valid QR code.');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurant();
  }, [restaurantIdFromUrl]);

  const handleManualCodeSubmit = async () => {
    if (!manualCode.trim()) {
      alert('Please enter a restaurant code');
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(`/customer/restaurant/id/${manualCode}`);
      if (response.data.success) {
        setCurrentRestaurantId(response.data.data._id);
        setRestaurantData(response.data.data);
        setShowManualEntry(false);
        alert(`Restaurant loaded: ${response.data.data.restaurantName}`);
      }
    } catch (error) {
      console.error('Error loading restaurant:', error);
      alert('Invalid restaurant code. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('🔥 BUTTON CLICKED! Form submitted - Table:', table, 'Restaurant ID:', currentRestaurantId);
    
    if (!table.trim()) {
      alert('Please enter a table number');
      return;
    }
    
    if (!currentRestaurantId) {
      alert('Restaurant not loaded. Please refresh the page.');
      return;
    }
    
    setTableNumber(parseInt(table));
    setRestaurantId(currentRestaurantId);
    const menuUrl = `/menu/${currentRestaurantId}`;
    console.log('✅ Navigating to:', menuUrl);
    navigate(menuUrl);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-t-4 border-primary-400">
          <div className="p-8">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                <Crown className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">Smart Serve</h1>
              <div className="flex justify-center gap-1 mb-4">
                <span className="text-primary-500 text-xl">★</span>
                <span className="text-primary-500 text-xl">★</span>
                <span className="text-primary-500 text-xl">★</span>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                An exquisite culinary journey awaits. Scan your table's QR code or
                <br />
                enter your table number to begin
              </p>
            </div>

            {/* Demo Message */}
            <div className="mb-6 p-3 bg-primary-50 border border-primary-200 rounded-lg">
              <p className="text-sm text-primary-800">
                {restaurantData ? (
                  <>
                    <span className="font-semibold">Welcome to {restaurantData.restaurantName}!</span>
                    <br />
                    <span className="text-xs text-green-600 mt-1">✓ Restaurant Code: {restaurantData.restaurantId}</span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold">Demo Experience:</span> Enter any table number to explore our menu
                  </>
                )}
              </p>
            </div>

            {/* Manual Code Entry Option */}
            {!restaurantIdFromUrl && (
              <div className="mb-6">
                {!showManualEntry ? (
                  <button
                    type="button"
                    onClick={() => setShowManualEntry(true)}
                    className="w-full text-center text-sm text-primary-600 hover:text-primary-700 underline"
                  >
                    Camera not working? Enter restaurant code manually
                  </button>
                ) : (
                  <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                    <label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Restaurant Code
                    </label>
                    <input
                      type="text"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      placeholder="Enter code (e.g., REST-mjszg42g-XGKEH)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleManualCodeSubmit}
                        className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 rounded-lg text-sm"
                      >
                        Load Restaurant
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowManualEntry(false)}
                        className="px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 rounded-lg text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">
                  Table Number
                </label>
                <input
                  type="number"
                  value={table}
                  onChange={(e) => setTable(e.target.value)}
                  placeholder="Enter your table"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                  min="1"
                />
              </div>

              <button
                type="submit"
                onClick={(e) => {
                  console.log('🔥 DIRECT CLICK EVENT!', { table, restaurantId });
                }}
                className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Begin Your Experience
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center">
              <div className="flex-1 border-t border-gray-200"></div>
              <span className="px-4 text-gray-400 text-sm">✦</span>
              <div className="flex-1 border-t border-gray-200"></div>
            </div>

            {/* Admin Link */}
            <div className="text-center">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Restaurant Portal
              </p>
              <a
                href="http://localhost:3001"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Admin Access →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
