import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

function CustomerShop() {
  const [catches, setCatches] = useState([]);
  const [filteredCatches, setFilteredCatches] = useState([]);
  const [error, setError] = useState('');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [priceRange, setPriceRange] = useState(200);
  const [favorites, setFavorites] = useState([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedCatch, setSelectedCatch] = useState(null);
  const navigate = useNavigate();
  const userRole = localStorage.getItem('fisher_role');

  useEffect(() => {
    loadFavorites();
    loadCatches();
  }, []);

  useEffect(() => {
    filterCatches();
  }, [catches, searchTerm, selectedCategory, selectedLocation, priceRange]);

  const loadCatches = async () => {
    try {
      const response = await api.get('/catches');
      setCatches(response.data);
      setError('');
    } catch (err) {
      setError('Unable to load catches.');
    }
  };

  const loadFavorites = () => {
    const saved = localStorage.getItem('buyer_favorites');
    setFavorites(saved ? JSON.parse(saved) : []);
  };

  const saveFavorites = (items) => {
    localStorage.setItem('buyer_favorites', JSON.stringify(items));
    setFavorites(items);
  };

  const toggleFavorite = (item) => {
    const current = favorites.find((favorite) => favorite.id === item.id);
    if (current) {
      saveFavorites(favorites.filter((favorite) => favorite.id !== item.id));
    } else {
      saveFavorites([...favorites, item]);
    }
  };

  const isFavorite = (item) => favorites.some((favorite) => favorite.id === item.id);

  const openDetails = (item) => {
    setSelectedCatch(item);
    setDetailModalOpen(true);
  };

  const closeDetails = () => {
    setSelectedCatch(null);
    setDetailModalOpen(false);
  };

  const filterCatches = () => {
    const filtered = catches.filter((catchItem) => {
      const matchesSearch = catchItem.fish_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All Categories' || catchItem.fish_name === selectedCategory;
      const matchesLocation = selectedLocation === 'All Locations' || catchItem.location === selectedLocation;
      const matchesPrice = Number(catchItem.price || 0) <= priceRange;
      return matchesSearch && matchesCategory && matchesLocation && matchesPrice;
    });

    setFilteredCatches(filtered);
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
          <div className="col-span-1 lg:col-span-2 relative">
            <input
              type="text"
              placeholder="Search fish by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm"
            />
            <span className="absolute right-3 top-2.5 text-slate-400">🔍</span>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option>All Categories</option>
              {[...new Set(catches.map((item) => item.fish_name))].map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">Location</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option>All Locations</option>
              {[...new Set(catches.map((item) => item.location || 'Unknown'))].map((location) => (
                <option key={location}>{location}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">Maximum price</label>
            <input
              type="range"
              min="0"
              max="300"
              value={priceRange}
              onChange={(e) => setPriceRange(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-sm text-slate-600 mt-2">Up to ${priceRange}</div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 shadow-sm flex-1">
            <p className="text-sm text-slate-500">Favorite listings</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{favorites.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm flex-1">
            <p className="text-sm text-slate-500">Available fish</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{filteredCatches.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm flex-1">
            <p className="text-sm text-slate-500">Recommended</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{Math.min(filteredCatches.length, 4)}</p>
          </div>
        </div>

        {/* Fish Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredCatches.length > 0 ? (
            filteredCatches.map((catch_) => (
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
                  <button
                    onClick={() => toggleFavorite(catch_)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${isFavorite(catch_) ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}
                  >
                    {isFavorite(catch_) ? '★ Favorite' : '☆ Save'}
                  </button>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-600">Quantity Available</span>
                    <span className="font-semibold text-slate-900">{catch_.quantity} kg</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-600">Price per kg</span>
                    <span className="text-xl font-bold text-slate-900">${catch_.price}</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Fisherman: {catch_.fisherman_name || 'Unknown'}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => addToCart(catch_, 1)}
                    className="w-full bg-cyan-500 text-white py-2 rounded-lg font-semibold hover:bg-cyan-600 text-sm"
                  >
                    Add to Cart
                  </button>
                  <button
                    onClick={() => openDetails(catch_)}
                    className="w-full border border-slate-300 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 py-2"
                  >
                    View Details
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

        {/* Detail Modal */}
        {detailModalOpen && selectedCatch && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{selectedCatch.fish_name}</h2>
                  <p className="text-sm text-slate-500">{selectedCatch.location || 'Location not specified'}</p>
                </div>
                <button onClick={closeDetails} className="text-slate-500 hover:text-slate-800">✕</button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                <div className="space-y-4">
                  {selectedCatch.image ? (
                    <div className="h-64 overflow-hidden rounded-3xl bg-slate-100">
                      {selectedCatch.image.toLowerCase().endsWith('.pdf') ? (
                        <object data={selectedCatch.image} type="application/pdf" className="w-full h-full">
                          <iframe src={selectedCatch.image} title="PDF Preview" className="w-full h-full" />
                        </object>
                      ) : (
                        <img src={selectedCatch.image} alt={selectedCatch.fish_name} className="w-full h-full object-cover" />
                      )}
                    </div>
                  ) : (
                    <div className="h-64 rounded-3xl bg-cyan-100 flex items-center justify-center text-5xl">🐟</div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <p className="text-xs uppercase text-slate-500">Price</p>
                      <p className="text-xl font-bold text-slate-900">${selectedCatch.price}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <p className="text-xs uppercase text-slate-500">Available</p>
                      <p className="text-xl font-bold text-slate-900">{selectedCatch.quantity} kg</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-5">
                  <div className="rounded-3xl border border-slate-200 p-5 bg-slate-50">
                    <h3 className="text-sm text-slate-500 uppercase tracking-[0.2em] mb-3">Fisherman Profile</h3>
                    <p className="font-semibold text-slate-900">{selectedCatch.fisherman_name || 'Unknown'}</p>
                    <p className="text-sm text-slate-600">{selectedCatch.fisherman_email || 'No email provided'}</p>
                    <p className="text-xs text-slate-500 mt-3">Contact the fisherman directly for delivery requests or special packing.</p>
                    {selectedCatch.fisherman_email && (
                      <a
                        href={`mailto:${selectedCatch.fisherman_email}`}
                        className="inline-flex mt-4 items-center gap-2 text-cyan-600 font-semibold hover:text-cyan-800"
                      >
                        📧 Contact fisherman
                      </a>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs uppercase text-slate-500">Catch Date</p>
                      <p className="font-medium text-slate-900">{selectedCatch.catch_date ? new Date(selectedCatch.catch_date).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-slate-500">Status</p>
                      <p className="font-medium text-slate-900">{selectedCatch.status || 'Listed'}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => {
                        addToCart(selectedCatch, 1);
                        closeDetails();
                      }}
                      className="w-full bg-cyan-500 text-white py-3 rounded-2xl font-semibold hover:bg-cyan-600"
                    >
                      Add to cart
                    </button>
                    <button
                      onClick={() => toggleFavorite(selectedCatch)}
                      className="w-full border border-slate-300 py-3 rounded-2xl text-slate-700 font-semibold hover:bg-slate-50"
                    >
                      {isFavorite(selectedCatch) ? 'Remove from favorites' : 'Save to favorites'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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
