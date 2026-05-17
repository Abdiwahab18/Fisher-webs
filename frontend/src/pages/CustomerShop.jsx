import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

function CustomerShop() {
  const [catches, setCatches] = useState([]);
  const [error, setError] = useState('');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const navigate = useNavigate();
  const userRole = localStorage.getItem('fisher_role');

  useEffect(() => {
    loadCatches();
  }, []);

  const loadCatches = async () => {
    try {
      const response = await api.get('/catches');
      setCatches(response.data);
    } catch (err) {
      setError('Unable to load catches.');
    }
  };

  const addToCart = (catchItem, quantity) => {
    const existingItem = cart.find(item => item.fish_id === catchItem.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.fish_id === catchItem.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setCart([...cart, {
        fish_id: catchItem.id,
        fish_name: catchItem.fish_name,
        quantity: quantity,
        price: catchItem.price,
        image: catchItem.image
      }]);
    }
  };

  const removeFromCart = (fish_id) => {
    setCart(cart.filter(item => item.fish_id !== fish_id));
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.quantity * item.price), 0);
  };

  const placeOrder = async () => {
    try {
      const orderData = {
        total_price: getTotalPrice(),
        items: cart.map(item => ({
          fish_id: item.fish_id,
          quantity: item.quantity,
          price: item.price
        }))
      };

      await api.post('/orders', orderData);
      setCart([]);
      setShowCart(false);
      alert('Order placed successfully!');
    } catch (err) {
      setError('Unable to place order.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex">
      {/* Sidebar */}
      <aside className="w-40 bg-slate-700 text-white p-6 shadow-xl flex flex-col">
        <h2 className="text-xl font-bold mb-8">MarisSync</h2>

        <nav className="space-y-1 mb-8 flex-1">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-3 px-4 py-2 rounded hover:bg-slate-600 w-full text-left text-sm"
          >
            <span>📊</span>
            <span>Dashboard</span>
          </button>
          {/* Catches - Admin only (admins can access all pages) */}
          {userRole === 'admin' && (
            <button
              onClick={() => navigate('/fisherman')}
              className="flex items-center gap-3 px-4 py-2 rounded hover:bg-slate-600 w-full text-left text-sm"
            >
              <span>🎣</span>
              <span>Catches</span>
            </button>
          )}
          <button
            onClick={() => navigate('/market')}
            className="flex items-center gap-3 px-4 py-2 rounded hover:bg-slate-600 w-full text-left text-sm"
          >
            <span>🛍️</span>
            <span>Market</span>
          </button>
          <button
            onClick={() => navigate('/orders')}
            className="flex items-center gap-3 px-4 py-2 rounded hover:bg-slate-600 w-full text-left text-sm"
          >
            <span>📦</span>
            <span>Orders</span>
          </button>
          {userRole === 'admin' && (
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center gap-3 px-4 py-2 rounded hover:bg-slate-600 w-full text-left text-sm"
            >
              <span>👨‍💼</span>
              <span>Admin Panel</span>
            </button>
          )}
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-3 px-4 py-2 rounded hover:bg-slate-600 w-full text-left text-sm"
          >
            <span>⚙️</span>
            <span>Settings</span>
          </button>
        </nav>

        <div className="mb-6 border-t border-slate-600 pt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-semibold">
              C
            </div>
            <div>
              <p className="font-semibold text-sm">Customer</p>
              <p className="text-xs text-slate-400">Buyer</p>
            </div>
          </div>

          <button
            onClick={() => setShowCart(true)}
            className="w-full bg-cyan-500 text-slate-900 font-semibold py-2 rounded-lg text-sm hover:bg-cyan-400 relative"
          >
            🛒 Cart ({cart.length})
          </button>
        </div>

        <button className="w-full text-slate-300 hover:text-white text-sm text-left px-4 py-2 rounded hover:bg-slate-600">
          🚪 Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">Fresh Catch Market</h1>
          <p className="text-slate-600 mt-2">
            Discover premium seafood from local fishermen. Fresh, sustainable, and delivered to your door.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search fish species..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm"
            />
            <span className="absolute right-3 top-2.5 text-slate-400">🔍</span>
          </div>
          <button className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50">
            ☰ Filter
          </button>
          <button
            onClick={() => setShowCart(true)}
            className="px-4 py-2 bg-cyan-500 text-white rounded-lg text-sm font-semibold hover:bg-cyan-600"
          >
            🛒 Cart ({cart.length})
          </button>
        </div>

        {/* Fish Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {catches.length > 0 ? (
            catches.map((catch_) => (
              <div key={catch_.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {catch_.image ? (
                      <img src={catch_.image} alt={catch_.fish_name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 font-semibold">
                        {catch_.fish_name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-slate-900">{catch_.fish_name}</h3>
                      <p className="text-xs text-slate-500">{catch_.location || 'Location not specified'}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                    Fresh
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-600">Quantity Available</span>
                    <span className="font-semibold text-slate-900">{catch_.quantity} kg</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Price per kg</span>
                    <span className="text-xl font-bold text-slate-900">${catch_.price}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => addToCart(catch_, 1)}
                    className="flex-1 bg-cyan-500 text-white py-2 rounded-lg font-semibold hover:bg-cyan-600 text-sm"
                  >
                    Add to Cart
                  </button>
                  <button
                    onClick={() => addToCart(catch_, 5)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    +5kg
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-slate-500">No catches available at the moment.</p>
            </div>
          )}
        </div>

        {/* Cart Modal */}
        {showCart && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-slate-900">Your Cart</h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              {cart.length > 0 ? (
                <>
                  <div className="space-y-3 mb-4">
                    {cart.map((item) => (
                      <div key={item.fish_id} className="flex justify-between items-center py-2 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          {item.image ? (
                            <img src={item.image} alt={item.fish_name} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 font-semibold text-xs">
                              {item.fish_name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{item.fish_name}</p>
                            <p className="text-xs text-slate-500">{item.quantity}kg × ${item.price}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">${(item.quantity * item.price).toFixed(2)}</span>
                          <button
                            onClick={() => removeFromCart(item.fish_id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-slate-200 pt-4 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900">Total</span>
                      <span className="font-bold text-slate-900">${getTotalPrice().toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    onClick={placeOrder}
                    className="w-full bg-cyan-500 text-white py-3 rounded-lg font-semibold hover:bg-cyan-600"
                  >
                    Place Order
                  </button>
                </>
              ) : (
                <p className="text-center text-slate-500 py-8">Your cart is empty</p>
              )}
            </div>
          </div>
        )}

        {error && <p className="mt-8 text-sm text-red-600">{error}</p>}
      </main>
    </div>
  );
}

export default CustomerShop;
