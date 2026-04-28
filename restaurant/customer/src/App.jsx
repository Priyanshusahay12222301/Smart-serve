import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import Landing from './pages/Landing';
import Menu from './pages/Menu';
import OrderConfirmation from './pages/OrderConfirmation';
import OrderTracking from './pages/OrderTracking';

function App() {
  return (
    <CartProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/:restaurantId" element={<Landing />} />
          <Route path="/menu/:restaurantId" element={<Menu />} />
          <Route path="/cart" element={<Menu />} />
          <Route path="/confirmation" element={<OrderConfirmation />} />
          <Route path="/track/:orderId" element={<OrderTracking />} />
        </Routes>
      </Router>
    </CartProvider>
  );
}

export default App;
