import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

function Market() {
  const [catches, setCatches] = useState([]);
  const [filteredCatches, setFilteredCatches] = useState([]);
  const [error, setError] = useState('');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(!localStorage.getItem('fisher_token'));
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState('All Species');
  const [priceRange, setPriceRange] = useState(200);
  const [location, setLocation] = useState('Global Markets');
  const [freshness, setFreshness] = useState('All');
  const [sortBy, setSortBy] = useState('Recent');
  // PDF viewer state
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfModalUrl, setPdfModalUrl] = useState(null);

  const openPdfViewer = (url) => {
    setPdfModalUrl(url);
    setShowPdfModal(true);
  };

  const closePdfViewer = () => {
    setPdfModalUrl(null);
    setShowPdfModal(false);
  }; 
  const navigate = useNavigate();
  const userRole = localStorage.getItem('fisher_role');
  const isAuthenticated = !!localStorage.getItem('fisher_token');

  useEffect(() => {
    loadCatches();
  }, []);

  useEffect(() => {
    filterCatches();
  }, [catches, searchTerm, selectedSpecies, priceRange, freshness]);

  const loadCatches = async () => {
    try {
      const response = await api.get('/catches');
      const normalized = (response.data || []).map(item => ({
        ...item,
        price: Number(item.price) || 0,
        stock: Number(item.stock) || item.stock || 1,
      }));
      setCatches(normalized);
    } catch (err) {
      setError('Unable to load fish market.');
      console.error(err);
    }
  };

  const filterCatches = () => {
    let filtered = catches.filter(catchItem => {
      const price = Number(catchItem.price) || 0;
      const matchesSearch = catchItem.fish_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSpecies = selectedSpecies === 'All Species' || catchItem.fish_name.includes(selectedSpecies);
      const matchesPrice = price <= priceRange;
      const matchesFreshness = freshness === 'All' || (freshness === 'Premium' && catchItem.status === 'fresh');

      return matchesSearch && matchesSpecies && matchesPrice && matchesFreshness;
    });

    if (sortBy === 'Recent') {
      filtered.sort((a, b) => new Date(b.catch_date) - new Date(a.catch_date));
    } else if (sortBy === 'Price: Low to High') {
      filtered.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sortBy === 'Price: High to Low') {
      filtered.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    }

    setFilteredCatches(filtered);
  };

  const addToCart = (catchItem) => {
    if (!isAuthenticated) {
      setShowGuestModal(true);
      return;
    }

    const existingItem = cart.find(item => item.id === catchItem.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === catchItem.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        id: catchItem.id,
        fish_name: catchItem.fish_name,
        quantity: 1,
        price: Number(catchItem.price) || 0,
        weight: catchItem.weight,
        location: catchItem.location
      }]);
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) {
      removeFromCart(id);
    } else {
      setCart(cart.map(item =>
        item.id === id ? { ...item, quantity } : item
      ));
    }
  };

  const getTotalPrice = () => {
    const total = cart.reduce((sum, item) => sum + (item.quantity * (Number(item.price) || 0)), 0);
    return total.toFixed(2);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const placeOrder = async () => {
    if (!isAuthenticated) {
      alert('Please register or login before placing an order.');
      navigate('/register');
      return;
    }

    if (cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }

    try {
      const orderData = {
        total_price: parseFloat(getTotalPrice()),
        items: cart.map(item => ({
          fish_id: item.id,
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
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('fisher_token');
    localStorage.removeItem('fisher_role');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-40 bg-slate-700 text-white p-6 shadow-xl flex flex-col fixed left-0 top-0 h-screen">
        <h2 className="text-2xl font-bold mb-8 text-cyan-400">MarisSync</h2>
        
        <nav className="space-y-1 mb-8 flex-1">
          {userRole && (
            <>
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-3 px-4 py-2 rounded hover:bg-slate-600 w-full text-left text-sm"
              >
                <span>📊</span>
                <span>Dashboard</span>
              </button>
              {(userRole === 'fisherman' || userRole === 'admin') && (
                <button
                  onClick={() => navigate('/fisherman')}
                  className="flex items-center gap-3 px-4 py-2 rounded hover:bg-slate-600 w-full text-left text-sm"
                >
                  <span>🎣</span>
                  <span>Catches</span>
                </button>
              )}
            </>
          )}
          <button
            onClick={() => navigate('/market')}
            className="flex items-center gap-3 px-4 py-2 rounded bg-cyan-600 text-white w-full text-left text-sm"
          >
            <span>🛍️</span>
            <span>Market</span>
          </button>
          {userRole && (
            <>
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
            </>
          )}
        </nav>

        {userRole && (
          <div className="border-t border-slate-600 pt-4 space-y-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded hover:bg-red-600 w-full text-left text-sm text-red-200"
            >
              <span>🚪</span>
              <span>Logout</span>
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-40 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Global Fish Market</h1>
          <p className="text-slate-600">Live terminal for sustainable maritime trade</p>
        </div>

        {/* Search and Filters */}

        {showGuestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Guest Access</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    You can browse all fish in the market. To add items to your cart and place an order, please register or login.
                  </p>
                </div>
                <button
                  onClick={() => setShowGuestModal(false)}
                  className="rounded-full bg-slate-100 p-2 text-slate-700 hover:bg-slate-200"
                >
                  ✕
                </button>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <button
                  onClick={() => setShowGuestModal(false)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50 sm:w-auto"
                >
                  Continue browsing
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="w-full rounded-lg bg-cyan-600 px-4 py-2 text-white hover:bg-cyan-700 sm:w-auto"
                >
                  Register / Login
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Search catches...</label>
              <input
                type="text"
                placeholder="Search daily catches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>

            {/* Species Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Species</label>
              <select
                value={selectedSpecies}
                onChange={(e) => setSelectedSpecies(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                <option>All Species</option>
                <option>Tuna</option>
                <option>Salmon</option>
                <option>Snapper</option>
                <option>Crab</option>
                <option>Halibut</option>
                <option>Scallops</option>
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Price Range: ${priceRange}
              </label>
              <input
                type="range"
                min="0"
                max="300"
                value={priceRange}
                onChange={(e) => setPriceRange(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Freshness */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Freshness</label>
              <select
                value={freshness}
                onChange={(e) => setFreshness(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                <option>All</option>
                <option>Premium</option>
                <option>Frozen</option>
                <option>Cured</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                <option>Recent</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-8">
            {error}
          </div>
        )}

        {/* Fish Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {filteredCatches.length > 0 ? (
            filteredCatches.map(catchItem => (
              <div key={catchItem.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-48 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center overflow-hidden">
                  {catchItem.image ? (
                    // If PDF, show a small PDF preview area with a button to open full viewer
                    (catchItem.image.toLowerCase().endsWith('.pdf') ? (
                      <>
                        <object
                          data={catchItem.image}
                          type="application/pdf"
                          className="w-full h-full"
                          aria-label="PDF preview"
                        />
                        <button
                          onClick={() => openPdfViewer(catchItem.image)}
                          className="absolute bottom-2 left-2 bg-white/90 text-slate-800 px-3 py-1 rounded-md text-sm shadow"
                        >
                          View PDF
                        </button>
                      </>
                    ) : (
                      // Image URL (jpg/png/svg) — render as background-fit
                      <img
                        src={catchItem.image}
                        alt={catchItem.fish_name}
                        className="w-full h-full object-cover"
                      />
                    ))
                  ) : (
                    <span className="text-6xl">{catchItem.icon || '🐟'}</span>
                  )}

                  <button
                    onClick={() => addToCart(catchItem)}
                    className="absolute top-2 right-2 w-10 h-10 bg-white rounded-full shadow-md hover:bg-cyan-50 flex items-center justify-center"
                  >
                    ❤️
                  </button>
                </div>
                
                <div className="p-4">
                  <h3 className="font-bold text-lg text-slate-800 mb-1">{catchItem.fish_name}</h3>
                  
                  <div className="space-y-2 mb-3">
                    <div className="flex items-start gap-2">
                      <span>📍</span>
                      <div>
                        <p className="text-xs text-slate-600">{catchItem.location || 'Global Markets'}</p>
                        <p className="text-xs text-slate-500">
                          {catchItem.weight ? `${catchItem.weight}kg` : 'Weight N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-3 flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs text-slate-600">PRICE / KG</p>
                      <p className="text-lg font-bold text-slate-800">${(Number(catchItem.price) || 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">STOCK</p>
                      <p className="text-lg font-bold text-slate-800">{catchItem.stock || '1'} kg</p>
                    </div>
                  </div>

                  <button
                    onClick={() => addToCart(catchItem)}
                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded transition-colors flex items-center justify-center gap-2"
                  >
                    🛒 Add to Cart
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-slate-500 text-lg">No fish available matching your filters.</p>
            </div>
          )}
        </div>
      </main>

      {/* Cart Sidebar */}
      {showCart && (
        <div className="fixed right-0 top-0 h-screen w-80 bg-white shadow-2xl z-50 flex flex-col">
          <div className="bg-cyan-600 text-white p-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold">Shopping Cart</h2>
            <button
              onClick={() => setShowCart(false)}
              className="text-2xl hover:text-cyan-200"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length > 0 ? (
              cart.map(item => (
                <div key={item.id} className="bg-slate-100 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-slate-800">{item.fish_name}</h3>
                      <p className="text-sm text-slate-600">${(Number(item.price) || 0).toFixed(2)}/kg</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      🗑️
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="bg-slate-300 hover:bg-slate-400 w-8 h-8 rounded flex items-center justify-center"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                      className="w-12 text-center border border-slate-300 rounded"
                      min="1"
                    />
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="bg-slate-300 hover:bg-slate-400 w-8 h-8 rounded flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-sm font-bold text-slate-800 mt-2">
                    Total: ${(item.quantity * (Number(item.price) || 0)).toFixed(2)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-500 py-8">Your cart is empty</p>
            )}
          </div>

          <div className="border-t border-slate-200 p-6 space-y-4">
            <div className="flex justify-between items-center text-lg font-bold text-slate-800">
              <span>Total:</span>
              <span>${getTotalPrice()}</span>
            </div>
            <button
              onClick={placeOrder}
              disabled={cart.length === 0}
              className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-400 text-white font-bold py-3 px-4 rounded transition-colors"
            >
              Place Order
            </button>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white w-full h-full max-w-4xl max-h-[90vh] rounded-lg overflow-hidden relative">
            <div className="p-3 border-b flex justify-between items-center">
              <h3 className="font-semibold">PDF Preview</h3>
              <button onClick={closePdfViewer} className="text-slate-600 px-3 py-1 rounded hover:bg-slate-100">Close</button>
            </div>
            <div className="h-[calc(100%-56px)]">
              <object data={pdfModalUrl} type="application/pdf" className="w-full h-full">
                <iframe src={pdfModalUrl} className="w-full h-full" title="PDF Preview" />
              </object>
            </div>
          </div>
        </div>
      )}

      {/* Cart Button */}
      <button
        onClick={() => setShowCart(!showCart)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-cyan-600 hover:bg-cyan-700 text-white rounded-full shadow-lg flex items-center justify-center text-2xl transition-all hover:scale-110 z-40"
      >
        🛒
        {cart.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
            {getTotalItems()}
          </span>
        )}
      </button>
    </div>
  );
}

export default Market;
