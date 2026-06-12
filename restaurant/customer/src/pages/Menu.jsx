import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { menuAPI } from '../services/api';
import { ShoppingCart, Plus, Minus, X, Store, ChevronRight, Image as ImageIcon } from 'lucide-react';

const DEMO_MENU = [
  { _id: 'd1', name: 'Classic Burger', price: 12.99, category: 'Burgers', description: 'Juicy beef patty with lettuce, tomato, and house sauce', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80' },
  { _id: 'd2', name: 'Margherita Pizza', price: 14.99, category: 'Pizza', description: 'Classic tomato sauce with fresh mozzarella and basil', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80' },
  { _id: 'd3', name: 'Caesar Salad', price: 9.99, category: 'Salads', description: 'Crisp romaine, parmesan, croutons with Caesar dressing', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400&q=80' },
  { _id: 'd4', name: 'Pasta Carbonara', price: 15.99, category: 'Pasta', description: 'Creamy egg sauce with pancetta and parmesan', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400&q=80' },
  { _id: 'd5', name: 'Grilled Salmon', price: 22.99, category: 'Mains', description: 'Atlantic salmon with seasonal vegetables and lemon butter', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&q=80' },
  { _id: 'd6', name: 'Chocolate Lava Cake', price: 7.99, category: 'Desserts', description: 'Warm chocolate cake with a molten center, served with ice cream', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=80' },
];

const Menu = () => {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const CURRENCY_SYMBOL = import.meta.env.VITE_CURRENCY_SYMBOL || '₹';

  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    const backendBase = (import.meta.env.VITE_API_BASE_URL || '').replace('/api', '');
    return `${backendBase}${url}`;
  };
  const { cart, addToCart, updateQuantity, removeFromCart, getTotalItems, getTotalPrice, isOpen, toggleCart, setIsOpen, setRestaurantId } = useCart();
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setRestaurantId(restaurantId);
    fetchMenuData();
  }, [restaurantId]);

  const fetchMenuData = async () => {
    // Use demo data if restaurantId is 'demo' or in demo mode
    if (!restaurantId || restaurantId === 'demo') {
      setMenuItems(DEMO_MENU);
      const cats = [...new Set(DEMO_MENU.map(item => item.category))];
      setCategories(['All', ...cats]);
      setLoading(false);
      return;
    }
    try {
      console.log('Fetching menu for restaurant:', restaurantId);
      const itemsRes = await menuAPI.getAll(restaurantId);
      console.log('Menu response:', itemsRes.data);
      const items = itemsRes.data.data || [];
      if (items.length === 0) {
        // Empty menu from DB — show demo items as fallback
        setMenuItems(DEMO_MENU);
        const cats = [...new Set(DEMO_MENU.map(item => item.category))];
        setCategories(['All', ...cats]);
      } else {
        setMenuItems(items);
        const cats = [...new Set(items.map(item => item.category))];
        setCategories(['All', ...cats]);
      }
      setError(null);
    } catch (error) {
      console.error('Failed to fetch menu — using demo items:', error);
      // Fallback to demo menu instead of showing error
      setMenuItems(DEMO_MENU);
      const cats = [...new Set(DEMO_MENU.map(item => item.category))];
      setCategories(['All', ...cats]);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  const filteredItems = selectedCategory === 'All'
    ? menuItems
    : menuItems.filter(item => item.category === selectedCategory);

  const getItemQuantity = (itemId) => {
    const cartItem = cart.find(item => item._id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  const MenuItem = ({ item }) => {
    const quantity = getItemQuantity(item._id);

    const handleAddToCart = () => {
      console.log('Adding item to cart:', item);
      addToCart(item);
      console.log('Cart after adding:', cart);
    };

    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="aspect-video overflow-hidden bg-gray-100 flex items-center justify-center">
          {item.imageUrl ? (
            <img
              src={getImageUrl(item.imageUrl)}
              alt={item.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500';
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-400">
              <ImageIcon className="w-12 h-12 mb-1 stroke-1" />
              <span className="text-xs">No image</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-primary-600">{CURRENCY_SYMBOL}{item.price.toFixed(2)}</span>
            {quantity === 0 ? (
              <button
                onClick={handleAddToCart}
                className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateQuantity(item._id, quantity - 1)}
                  className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <Minus className="w-4 h-4 text-gray-700" />
                </button>
                <span className="font-semibold text-lg w-6 text-center">{quantity}</span>
                <button
                  onClick={() => updateQuantity(item._id, quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center bg-primary-500 hover:bg-primary-600 text-white rounded-full transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const CartSlideout = () => (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Cart Slideout */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-bold text-gray-900">Your Order</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Your cart is empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item._id} className="flex gap-4 bg-gray-50 rounded-lg p-3">
                    {item.imageUrl ? (
                      <img
                        src={getImageUrl(item.imageUrl)}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-lg"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500';
                        }}
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-200 flex flex-col items-center justify-center text-gray-400 rounded-lg">
                        <ImageIcon className="w-6 h-6 stroke-1" />
                        <span className="text-[10px]">No image</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{CURRENCY_SYMBOL}{item.price.toFixed(2)} each</p>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center bg-white border border-gray-300 rounded-full hover:bg-gray-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-medium w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center bg-primary-500 text-white rounded-full hover:bg-primary-600"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item._id)}
                          className="ml-auto text-red-500 hover:text-red-700"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{CURRENCY_SYMBOL}{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {cart.length > 0 && (
            <div className="border-t p-4 space-y-4">
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary-600">{CURRENCY_SYMBOL}{getTotalPrice().toFixed(2)}</span>
              </div>
              <button
                onClick={() => {
                  console.log('Navigating to confirmation with cart:', cart);
                  navigate('/confirmation');
                }}
                className="block w-full bg-primary-500 hover:bg-primary-600 text-white text-center py-3 rounded-lg font-semibold transition-colors"
              >
                Place Order
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Our Menu</h1>
                <p className="text-sm text-gray-500">Order from our menu</p>
              </div>
            </div>
            <button
              onClick={toggleCart}
              className="relative p-3 bg-primary-50 hover:bg-primary-100 rounded-full transition-colors"
            >
              <ShoppingCart className="w-6 h-6 text-primary-600" />
              {getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Categories */}
      <div className="bg-white border-b sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.filter(item => item.isAvailable).map((item) => (
            <MenuItem key={item._id} item={item} />
          ))}
        </div>

        {filteredItems.filter(item => item.isAvailable).length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No items available in this category</p>
          </div>
        )}
      </div>

      {/* Floating Cart Button (Mobile) */}
      {getTotalItems() > 0 && (
        <button
          onClick={toggleCart}
          className="fixed bottom-6 right-6 bg-primary-500 hover:bg-primary-600 text-white px-6 py-4 rounded-full shadow-lg flex items-center gap-3 font-semibold transition-colors lg:hidden"
        >
          <ShoppingCart className="w-5 h-5" />
          <span>{getTotalItems()} Items</span>
          <span>•</span>
          <span>{CURRENCY_SYMBOL}{getTotalPrice().toFixed(2)}</span>
        </button>
      )}

      {/* Cart Slideout */}
      <CartSlideout />
    </div>
  );
};

export default Menu;
