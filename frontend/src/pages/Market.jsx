import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import Layout from '../components/Layout';

function Market() {
  const [catches, setCatches] = useState([]);
  const [filteredCatches, setFilteredCatches] = useState([]);
  const [fishermen, setFishermen] = useState([]);
  const [error, setError] = useState('');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [cartMessages, setCartMessages] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState('All Species');
  const [selectedLocation, setSelectedLocation] = useState('Global Markets');
  const [deliveryInfo, setDeliveryInfo] = useState('');
  const [priceRange, setPriceRange] = useState(300);
  const [freshness, setFreshness] = useState('All');
  const [sortBy, setSortBy] = useState('Recent');
  const [selectedFishermanId, setSelectedFishermanId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [cartFeedback, setCartFeedback] = useState('');
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
    loadFishermen();
  }, []);

  useEffect(() => {
    filterCatches();
  }, [catches, searchTerm, selectedSpecies, selectedLocation, priceRange, freshness, sortBy, selectedFishermanId]);

  const loadCatches = async () => {
    try {
      const response = await api.get('/catches');
      const normalized = (response.data || []).map(item => ({
        ...item,
        price: Number(item.price) || 0,
        weight: Number(item.weight) || 0,
      }));
      setCatches(normalized);
    } catch (err) {
      setError('Unable to load fish market.');
      console.error(err);
    }
  };

  const loadFishermen = async () => {
    try {
      const response = await api.get('/users/fishermen');
      setFishermen(response.data || []);
    } catch (err) {
      console.error('Unable to load fishermen', err);
    }
  };

  const filterCatches = () => {
    let filtered = catches.filter(catchItem => {
      const price = Number(catchItem.price) || 0;
      const matchesSearch = catchItem.fish_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSpecies = selectedSpecies === 'All Species' || catchItem.fish_name.includes(selectedSpecies);
      const matchesLocation = selectedLocation === 'Global Markets' || (catchItem.location || '').toLowerCase().includes(selectedLocation.toLowerCase());
      const matchesPrice = price <= priceRange;
      const matchesFreshness = freshness === 'All' || (freshness === 'Premium' && catchItem.status === 'fresh');
      const matchesFisherman = !selectedFishermanId || catchItem.fisherman_id === selectedFishermanId;
      const isAvailable = Number(catchItem.weight) > 0 && catchItem.status !== 'sold';

      return matchesSearch && matchesSpecies && matchesLocation && matchesPrice && matchesFreshness && matchesFisherman && isAvailable;
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

    const availableStock = Number( catchItem.weight) || 0;

    const existingItem = cart.find(item => item.id === catchItem.id);
    if (existingItem) {
      if (existingItem.weight + 1 > availableStock) {
        alert(`Only ${availableStock} kg available in stock.`);
        return;
      }
      setCart(cart.map(item =>
        item.id === catchItem.id
          ? { ...item, weight: item.weight + 1 }
          : item
      ));
    } else {
      if (availableStock < 1) {
        alert('Item is out of stock.');
        return;
      }
      setCart([...cart, {
        id: catchItem.id,
        fish_name: catchItem.fish_name,
        weight: 1,
        price: Number(catchItem.price) || 0,
        location: catchItem.location,
        availableStock: availableStock
      }]);
    }

    setCartFeedback(`${catchItem.fish_name} added to cart`);
    setTimeout(() => setCartFeedback(''), 2500);
  };

  const handleBuyNow = async (catchItem) => {
    if (!isAuthenticated) {
      setShowGuestModal(true);
      return;
    }

    const availableStock = Number(catchItem.weight) || 0;
    if (availableStock < 1) {
      alert('Item is out of stock.');
      return;
    }

    try {
      const orderData = {
        total_price: parseFloat((Number(catchItem.price) || 0).toFixed(2)),
        items: [{
          fish_id: catchItem.id,
          weight: 1,
          price: catchItem.price
        }],
        delivery_info: deliveryInfo || 'Direct Purchase'
      };

      const response = await api.post('/orders', orderData);
      navigate('/checkout', { 
        state: { 
          orderId: response.data.order.id, 
          totalAmount: orderData.total_price, 
          items: orderData.items 
        } 
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to place order.');
      console.error(err);
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };
  const updateWeight = (id, weight) => {
    if (weight <= 0) {
      removeFromCart(id);
    } else {
      setCart(cart.map(item => {
        if (item.id === id) {
          if (weight > item.availableStock) {
            setCartMessages(prev => ({ ...prev, [id]: `Only ${item.availableStock} kg available in stock.` }));
            setTimeout(() => {
              setCartMessages(prev => {
                const newMsgs = { ...prev };
                delete newMsgs[id];
                return newMsgs;
              });
            }, 3000);
            return { ...item, weight: item.availableStock };
          }
          return { ...item, weight };
        }
        return item;
      }));
    }
  };

  const getTotalPrice = () => {
    const total = cart.reduce((sum, item) => sum + (item.weight * (Number(item.price) || 0)), 0);
    return total.toFixed(2);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.weight, 0);
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
      if (!deliveryInfo.trim()) {
        setError('Delivery/contact information is required.');
        return;
      }

      const orderData = {
        total_price: parseFloat(getTotalPrice()),
        items: cart.map(item => ({
          fish_id: item.id,
          weight: item.weight,
          price: item.price
        })),
        delivery_info: deliveryInfo
      };
      console.log(orderData);

      const response = await api.post('/orders', orderData);
      setCart([]);
      setDeliveryInfo('');
      setShowCart(false);
      navigate('/checkout', { 
        state: { 
          orderId: response.data.order.id, 
          totalAmount: orderData.total_price, 
          items: orderData.items 
        } 
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to place order.');
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('fisher_token');
    localStorage.removeItem('fisher_role');
    navigate('/login');
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const getFishermanVarieties = (fishermanId) => {
    const fishermanCatches = catches.filter(
      (item) => item.fisherman_id === fishermanId && Number(item.weight) > 0 && item.status !== 'sold'
    );
    return new Set(fishermanCatches.map((item) => item.fish_name)).size;
  };

  const getFishermanProductCount = (fishermanId) => {
    return catches.filter(
      (item) => item.fisherman_id === fishermanId && Number(item.weight) > 0 && item.status !== 'sold'
    ).length;
  };

  const selectFisherman = (fishermanId) => {
    setSelectedFishermanId(fishermanId);
    setSearchTerm('');
    setSelectedSpecies('All Species');
    setSelectedLocation('Global Markets');
    setPriceRange(300);
    setFreshness('All');
    setShowFilters(false);
  };

  const goBackToFishermen = () => {
    setSelectedFishermanId(null);
    setSearchTerm('');
    setSelectedSpecies('All Species');
    setSelectedLocation('Global Markets');
    setPriceRange(300);
    setFreshness('All');
    setShowFilters(false);
  };

  const selectedFisherman = fishermen.find((f) => f.id === selectedFishermanId);

  return (
    <Layout activePage="market" className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
      <div className="p-4 md:p-8">
        <div className="mx-auto max-w-7xl">
          {!selectedFishermanId ? (
          
            <section>
              <div className="text-center max-w-2xl mx-auto mb-10">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Fisherman Spotlight
                </h2>
                <p className="mt-3 text-sm md:text-base text-slate-500 dark:text-slate-400">
                  Choose a fisherman to browse their fresh catches.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {fishermen.map((fisherman, idx) => {
                  const varieties = getFishermanVarieties(fisherman.id);
                  const productCount = getFishermanProductCount(fisherman.id);
                  return (
                    <button
                      key={fisherman.id || idx}
                      type="button"
                      onClick={() => selectFisherman(fisherman.id)}
                      className="rounded-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-center transition hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                      <div className="mx-auto mb-3 h-14 w-14 overflow-hidden rounded-full ring-2 ring-slate-50 dark:ring-slate-700">
                        {fisherman.profile_picture ? (
                          <img
                            src={fisherman.profile_picture}
                            alt={fisherman.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <img
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${fisherman.name}`}
                            alt={fisherman.name}
                            className="h-full w-full object-cover bg-slate-100"
                          />
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{fisherman.name}</h3>
                      {/* <p className="mt-0.5 inline-flex items-center justify-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {fisherman.location || 'North Bay'}
                      </p> */}

                      <div className="mt-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 px-2 py-2">
                        <p className="text-base font-bold text-slate-900 dark:text-white">{varieties || 0}</p>
                        <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">Varieties</p>
                      </div>

                      <span className="mt-3 inline-block w-full rounded-lg bg-slate-900 dark:bg-slate-700 py-2 text-xs font-semibold text-white">
                        View Products{productCount > 0 ? ` (${productCount})` : ''}
                      </span>
                    </button>
                  );
                })}

                {fishermen.length === 0 && (
                  <div className="col-span-full rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 py-12 text-center text-slate-500">
                    No fishermen found yet. Check back soon!
                  </div>
                )}
              </div>
            </section>
          ) : (
            /* Step 2: Selected fisherman's products */
            <section className="mb-10">
              <button
                onClick={goBackToFishermen}
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-6"
              >
                <span aria-hidden="true">←</span> Back to Fishermen
              </button>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 overflow-hidden rounded-full ring-2 ring-slate-100 dark:ring-slate-700 shrink-0">
                    {selectedFisherman?.profile_picture ? (
                      <img
                        src={selectedFisherman.profile_picture}
                        alt={selectedFisherman?.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedFisherman?.name}`}
                        alt={selectedFisherman?.name}
                        className="h-full w-full object-cover bg-slate-100"
                      />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                      {selectedFisherman?.name || 'Fisherman'}&apos;s Catch
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {filteredCatches.length} product{filteredCatches.length !== 1 ? 's' : ''} available today
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 shadow-sm transition hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  {showFilters ? 'Hide Filters' : 'Filter Products'}
                </button>
              </div>

              {showFilters && (
              <div className="mt-6 grid gap-4 rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Search</label>
                  <input
                    type="text"
                    placeholder="Search catches..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Species</label>
                  <select
                    value={selectedSpecies}
                    onChange={(e) => setSelectedSpecies(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 outline-none"
                  >
                    <option>All Species</option>
                    <option>Tuna</option>
                    <option>Salmon</option>
                    <option>Snapper</option>
                    <option>Crab</option>
                    <option>Kingfish</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Location</label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 outline-none"
                  >
                    <option>Global Markets</option>
                    {[...new Set(catches.map((item) => item.location || 'Unknown'))].map((locationOption) => (
                      <option key={locationOption}>{locationOption}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Price up to ${priceRange}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="300"
                    value={priceRange}
                    onChange={(e) => setPriceRange(parseInt(e.target.value))}
                    className="mt-4 w-full accent-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Freshness</label>
                  <select
                    value={freshness}
                    onChange={(e) => setFreshness(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 outline-none"
                  >
                    <option>All</option>
                    <option>Premium</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Sort by</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 outline-none"
                  >
                    <option>Recent</option>
                    <option>Price: Low to High</option>
                    <option>Price: High to Low</option>
                  </select>
                </div>
              </div>
            )}

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl mt-6">
              {error}
            </div>
          )}

          <div id="market-grid" className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCatches.length > 0 ? (
              filteredCatches.map((catchItem) => {
                const weight = Number(catchItem.weight ) || 0;
                const isOutOfStock = weight <= 0;
                const isPremium = catchItem.status !== 'fresh';

                return (
                  <article
                    key={catchItem.id}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg transition-shadow hover:shadow-xl"
                  >
                    <div className="relative overflow-hidden bg-slate-100 dark:bg-slate-700">
                      {catchItem.image ? (
                        catchItem.image.toLowerCase().endsWith('.pdf') ? (
                          <div className="relative aspect-[4/3] bg-slate-200 dark:bg-slate-600">
                            <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500">PDF Preview</div>
                            <button
                              onClick={() => openPdfViewer(catchItem.image)}
                              className="absolute bottom-3 left-3 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow"
                            >
                              View PDF
                            </button>
                          </div>
                        ) : (
                          <img
                            src={catchItem.image}
                            alt={catchItem.fish_name}
                            className="aspect-[7/3] w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                        )
                      ) : (
                        <div className="flex aspect-[4/3] items-center justify-center text-5xl bg-slate-50 dark:bg-slate-700">
                          {catchItem.icon || '🐟'}
                        </div>
                      )}

                      <span
                        className={`absolute left-3 top-1 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                          isPremium
                            ? 'bg-sky-100 text-sky-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {isPremium ? 'Premium Catch' : 'Fresh Today'}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                          {catchItem.fish_name}
                        </h3>
                        <p className="shrink-0 text-right text-sm">
                          <span className="font-bold text-slate-900 dark:text-white">
                            ${(Number(catchItem.price) || 0).toFixed(2)}
                          </span>
                          <span className="text-slate-400 dark:text-slate-500"> per KG</span>
                        </p>
                      </div>

                      <div className="mt-3 text-xs">
                        <span className="rounded-md bg-slate-100 dark:bg-slate-700 px-2 py-1 font-medium text-slate-600 dark:text-slate-300">
                          {weight}KG Avail.
                        </span>
                      </div>

                      <div className="mt-3 flex items-center gap-2.5 border-t border-slate-100 dark:border-slate-700 pt-3">
                        <img
                          src={catchItem.fisherman_profile_picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${catchItem.fisherman_name || 'Fisher'}`}
                          alt={catchItem.fisherman_name || 'Fisher'}
                          className="h-8 w-8 shrink-0 rounded-full bg-slate-100 object-cover"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                            {catchItem.fisherman_name || 'Local Fisher'}
                          </p>
                          <p className="truncate text-xs text-slate-400">
                            {catchItem.location || 'North Bay'} • {formatTimeAgo(catchItem.catch_date)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => addToCart(catchItem)}
                          disabled={isOutOfStock}
                          className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                            isOutOfStock
                              ? 'cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500'
                              : 'bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600'
                          }`}
                        >
                          Add to Cart
                        </button>
                        <button
                          onClick={() => handleBuyNow(catchItem)}
                          disabled={isOutOfStock}
                          className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                            isOutOfStock
                              ? 'cursor-not-allowed bg-slate-300 text-slate-500'
                              : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500'
                          }`}
                        >
                          Buy Now
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="col-span-full rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 py-16 text-center">
                <p className="text-4xl mb-3">🐟</p>
                <p className="text-slate-600 dark:text-slate-400 font-medium">No fish available matching your filters.</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedSpecies('All Species');
                    setSelectedLocation('Global Markets');
                    setPriceRange(300);
                    setFreshness('All');
                  }}
                  className="mt-4 text-sm font-semibold text-slate-900 dark:text-white underline underline-offset-2 hover:no-underline"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </section>
          )}
        </div>
      </div>
      {/* Cart Sidebar */}
      {showCart && (
        <div className="fixed right-0 top-0 h-screen w-80 bg-white dark:bg-slate-800 shadow-2xl z-50 flex flex-col">
          <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
            <h2 className="text-xl font-bold">Shopping Cart</h2>
            <button onClick={() => setShowCart(false)} className="text-xl hover:text-slate-300">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length > 0 ? (
              cart.map(item => (
                <div key={item.id} className="bg-slate-50 dark:bg-slate-700 p-4 rounded-xl border border-slate-100 dark:border-slate-600">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{item.fish_name}</h3>
                      <p className="text-sm text-slate-500">${(Number(item.price) || 0).toFixed(2)}/kg</p>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700">✕</button>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => updateWeight(item.id, item.weight - 1)} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 w-8 h-8 rounded-lg flex items-center justify-center font-bold hover:bg-slate-50">-</button>
                    <span className="font-semibold w-6 text-center">{item.weight}</span>
                    <button onClick={() => updateWeight(item.id, item.weight + 1)} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 w-8 h-8 rounded-lg flex items-center justify-center font-bold hover:bg-slate-50">+</button>
                  </div>
                  {cartMessages[item.id] && <p className="text-red-500 text-xs mt-2">{cartMessages[item.id]}</p>}
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-3 border-t border-slate-200 pt-2">
                    Total: ${(item.weight * (Number(item.price) || 0)).toFixed(2)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-500 py-8">Your cart is empty</p>
            )}
          </div>

          <div className="border-t border-slate-100 dark:border-slate-700 p-6 bg-slate-50 dark:bg-slate-800">
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Delivery Details</label>
              <textarea
                value={deliveryInfo}
                onChange={(e) => setDeliveryInfo(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-slate-900 bg-white dark:bg-slate-700"
                rows={2}
                placeholder="Enter address..."
              />
            </div>
            <div className="flex justify-between items-center text-lg font-bold text-slate-900 dark:text-white mb-4">
              <span>Total:</span>
              <span>${getTotalPrice()}</span>
            </div>
            <button
              onClick={placeOrder}
              disabled={cart.length === 0}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl transition-colors"
            >
              Checkout
            </button>
          </div>
        </div>
      )}

      {showGuestModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-800 p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Guest Access</h2>
            <p className="mt-2 text-slate-600 dark:text-slate-400">Please register or login to place an order.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowGuestModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={() => navigate('/register')} className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800">Login / Register</button>
            </div>
          </div>
        </div>
      )}

      {showPdfModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-4xl max-h-[90vh] rounded-xl overflow-hidden relative flex flex-col">
            <div className="p-3 border-b flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <h3 className="font-semibold text-slate-900 dark:text-white">PDF Preview</h3>
              <button onClick={closePdfViewer} className="text-slate-500 hover:bg-slate-200 px-3 py-1 rounded">Close</button>
            </div>
            <div className="flex-1">
              <object data={pdfModalUrl} type="application/pdf" className="w-full h-full">
                <iframe src={pdfModalUrl} className="w-full h-full" title="PDF Preview" />
              </object>
            </div>
          </div>
        </div>
      )}

      {/* Cart feedback toast */}
      {cartFeedback && (
        <div className="fixed bottom-24 right-8 z-50 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-lg animate-pulse">
          ✓ {cartFeedback}
        </div>
      )}

      {/* Cart Button */}
      <button
        onClick={() => setShowCart(!showCart)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-xl flex items-center justify-center text-xl transition-all hover:scale-105 z-40"
      >
        🛒
        {cart.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white">
            {getTotalItems()}
          </span>
        )}
      </button>
    </Layout>
  );
}

export default Market;
