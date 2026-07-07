import { Fragment, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import Layout from '../components/Layout';
import { io } from 'socket.io-client';

// Icons
const ChartIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>;
const FishIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.121 15.536c-1.171 1.952-3.07 1.096-4.242 0 1.172 1.096 3.07 1.952 4.242 0zM17 10c0 3.866-3.582 7-8 7s-8-3.134-8-7 3.582-7 8-7 8 3.134 8 7z" /></svg>;
const MarketIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>;
const OrdersIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
const SettingsIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const LogoutIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;

function Orders() {
  const [orders, setOrders] = useState([]);
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedOrders, setExpandedOrders] = useState({});
  const [drivers, setDrivers] = useState([]);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const navigate = useNavigate();
  const userRole = localStorage.getItem('fisher_role');
  const isAdmin = userRole === 'admin';
  const isFisherman = userRole === 'fisherman';
  const canManageOrders = isAdmin || isFisherman;

  const getOrderProductInfo = (order) => {
    const items = order.items || [];
    if (items.length === 0) {
      return { name: 'No items', weight: 0 };
    }
    if (items.length === 1) {
      return {
        name: items[0].fish_name,
        weight: Number(items[0].weight) || 0
      };
    }
    const totalWeight = items.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);
    return {
      name: 'Mixed fish',
      weight: totalWeight
    };
  };

  const pageTitle = canManageOrders ? 'Catch Orders' : 'Your Orders';
  const pageSubtitle = canManageOrders
    ? 'View all orders that include your catches, and update the status as you fulfill them.'
    : 'Track the orders you placed in the market.';

  useEffect(() => {
    async function loadUserAndOrders() {
      try {
        const userRes = await api.get('/users/me');
        setUser(userRes.data);

        const endpoint = canManageOrders ? '/orders' : '/orders/my-orders';
        const response = await api.get(endpoint);

        const rawOrders = (response.data || [])
          .filter((item) => {
            if (userRole !== 'customer' && userRole !== 'fisherman') return true;
            return String(item.payment_status || '').toLowerCase() === 'paid';
          })
          .map((item) => ({
            ...item,
            total_price: Number(item.total_price) || 0,
            status: item.status || 'pending',
          }));

        const ordersWithItems = await Promise.all(
          rawOrders.map(async (order) => {
            try {
              const itemsRes = await api.get(`/orders/${order.id}/items`);
              return {
                ...order,
                items: itemsRes.data || [],
              };
            } catch {
              return {
                ...order,
                items: [],
              };
            }
          })
        );

        setOrders(ordersWithItems);
        if (canManageOrders) {
          try {
            const driversRes = await api.get('/drivers');
            setDrivers(driversRes.data || []);
          } catch {
            setDrivers([]);
          }
        }
      } catch (err) {
        setError('Unable to load data.');
        console.error(err);
      }
    }

    loadUserAndOrders();
  }, [canManageOrders]);

  useEffect(() => {
    const token = localStorage.getItem('fisher_token');
    const userId = localStorage.getItem('fisher_user_id');
    if (!token) return;

    const socketURL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';
    const socket = io(socketURL, {
      auth: { token },
      reconnection: true
    });

    socket.on('connect', () => {
      if (userId) socket.emit('join-user', userId);
    });

    socket.on('order-updated', (data) => {
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          Number(order.id) === Number(data.orderId)
            ? { 
                ...order, 
                status: data.status || order.status, 
                delivery_status: data.delivery_status || order.delivery_status,
                driver_id: data.driver_id || order.driver_id
              }
            : order
        )
      );
    });

    socket.on('payment-updated', (data) => {
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          Number(order.id) === Number(data.orderId)
            ? { ...order, payment_status: 'paid' }
            : order
        )
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const getStepStatus = (order, step) => {
    const status = order.status?.toLowerCase();
    const payStatus = order.payment_status?.toLowerCase();
    const delStatus = order.delivery_status?.toLowerCase();
    const hasDriver = !!order.driver_id;

    switch (step) {
      case 1: // Placed
        return 'completed';
      case 2: // Paid
        return (payStatus === 'paid' || !['pending'].includes(status)) ? 'completed' : 'pending';
      case 3: // Driver Assigned
        return (hasDriver || ['assigned', 'picked_up', 'delivered'].includes(delStatus) || ['out_for_delivery', 'delivered', 'completed'].includes(status)) ? 'completed' : 'pending';
      case 4: // Out for Delivery (Picked Up)
        return (['picked_up', 'delivered'].includes(delStatus) || ['out_for_delivery', 'delivered', 'completed'].includes(status)) ? 'completed' : 'pending';
      case 5: // Delivered
        return (delStatus === 'delivered' || ['delivered', 'completed'].includes(status)) ? 'completed' : 'pending';
      default:
        return 'pending';
    }
  };

  const getActiveStep = (order) => {
    if (getStepStatus(order, 5) === 'completed') return 6; // All done
    if (getStepStatus(order, 4) === 'completed') return 5; // Delivering
    if (getStepStatus(order, 3) === 'completed') return 4; // Picking up
    if (getStepStatus(order, 2) === 'completed') return 3; // Waiting for driver
    return 2; // Waiting for payment
  };

  const getOrderDriver = (order) => {
    if (!order.driver_id || drivers.length === 0) return null;
    return drivers.find((driver) => Number(driver.user_id) === Number(order.driver_id));
  };

  const toggleExpandOrder = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('fisher_token');
    localStorage.removeItem('fisher_role');
    navigate('/login');
  };

  const handleAssignDriver = async (orderId) => {
    if (!selectedDriverId) {
      setError('Please select a driver first.');
      return;
    }
    try {
      await api.post(`/orders/${orderId}/assign-driver`, { driver_id: selectedDriverId, estimated_delivery_time: deliveryTime });
      setSelectedDriverId('');
      setDeliveryTime('');
      setError('');
      setExpandedOrders(prev => ({ ...prev, [orderId]: true }));
      const response = await api.get(canManageOrders ? '/orders' : '/orders/my-orders');
      const rawOrders = (response.data || [])
        .filter((item) => {
          if (!canManageOrders) {
            return String(item.payment_status || '').toLowerCase() === 'paid';
          }
          return true;
        })
        .map((item) => ({ ...item, total_price: Number(item.total_price) || 0, status: item.status || 'pending' }));
      setOrders(rawOrders);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to assign driver.');
    }
  };

  const handleConfirmReceipt = async (orderId) => {
    try {
      await api.post(`/orders/${orderId}/confirm-received`);
      const response = await api.get(canManageOrders ? '/orders' : '/orders/my-orders');
      const rawOrders = (response.data || [])
        .filter((item) => {
          if (!canManageOrders) {
            return String(item.payment_status || '').toLowerCase() === 'paid';
          }
          return true;
        })
        .map((item) => ({ ...item, total_price: Number(item.total_price) || 0, status: item.status || 'pending' }));
      setOrders(rawOrders);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to confirm receipt.');
    }
  };

  const handleCompleteOrder = async (orderId) => {
    try {
      await api.post(`/orders/${orderId}/complete-order`);
      const response = await api.get(canManageOrders ? '/orders' : '/orders/my-orders');
      const rawOrders = (response.data || [])
        .filter((item) => {
          if (!canManageOrders) {
            return String(item.payment_status || '').toLowerCase() === 'paid';
          }
          return true;
        })
        .map((item) => ({ ...item, total_price: Number(item.total_price) || 0, status: item.status || 'pending' }));
      setOrders(rawOrders);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to complete order.');
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const response = await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
         Number( order.id) ===Number(orderId)  ? { ...order, status: response.data.status } : order
        )
      );
    } catch (err) {
      setError('Unable to update order status.');
      console.error(err);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const term = searchTerm.trim().toLowerCase();
    
    if (statusFilter !== 'all' && order.status?.toLowerCase() !== statusFilter) {
      return false;
    }

    if (!term) return true;

    const orderIdMatches = String(order.id).toLowerCase().includes(term);
    const statusMatches = order.status?.toLowerCase().includes(term);
    const itemMatches = order.items?.some((item) =>
      item.fish_name?.toLowerCase().includes(term)
    );
    const userIdMatches = String(order.user_id).toLowerCase().includes(term);
    return orderIdMatches || statusMatches || itemMatches || userIdMatches;
  });

  const handleExport = () => {
    if (filteredOrders.length === 0) return;

    const headers = ['Order ID', 'Date', 'Product', 'Customer ID', 'Status', 'Payment Status', 'Total Price'];
    const rows = filteredOrders.map(order => {
      const date = new Date(order.created_at).toLocaleDateString();
      const { name: productName, weight: totalWeight } = getOrderProductInfo(order);
      const product = totalWeight > 0 ? `${productName} (${totalWeight}kg)` : productName;
      return [
        order.id,
        date,
        product,
        order.user_id,
        order.status,
        order.payment_status || 'pending',
        order.total_price.toFixed(2)
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'orders_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const totalOrders = orders.length;
  const pendingOrders = orders.filter((order) => order.status?.toLowerCase() === 'pending').length;
  const completedOrders = orders.filter((order) => ['delivered', 'completed'].includes(order.status?.toLowerCase())).length;
  const totalRevenue = orders
    .filter(order => order.payment_status?.toLowerCase() === 'paid')
    .reduce((total, order) => total + (Number(order.total_price) || 0), 0)
    .toFixed(2);

  return (
    <Layout activePage="orders" className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans">
      <div className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <div className="mb-8 text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span className="hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer" onClick={() => navigate('/dashboard')}>Operations</span>
            <span>/</span>
            <span className="text-slate-900 dark:text-white">Order Management</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{pageTitle}</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm max-w-2xl">{pageSubtitle}</p>
            {isFisherman && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-cyan-200 dark:border-cyan-900/50 bg-cyan-50 dark:bg-cyan-900/20 px-4 py-2.5 text-sm font-medium text-cyan-800 dark:text-cyan-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Only orders containing your own catch listings are shown here.
              </div>
            )}
          </div>

          {/* Collapsible Delivery Scanner Guide
          <div className="mb-8 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 dark:from-cyan-950/20 dark:to-indigo-950/20 rounded-2xl border border-cyan-200/50 dark:border-cyan-900/30 p-6">
            <div className="flex justify-between items-center cursor-pointer" onClick={() => setShowGuide(!showGuide)}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-cyan-500/20 rounded-xl text-cyan-700 dark:text-cyan-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    Delivery Scanner & Autopilot Guide 🚚
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-500 text-white uppercase font-bold tracking-wider">Demo Tool</span>
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Click to understand how the order delivery system runs automatically</p>
                </div>
              </div>
              <span className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                {showGuide ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                )}
              </span>
            </div>

            {showGuide && (
              <div className="mt-6 pt-6 border-t border-cyan-200/30 dark:border-cyan-900/30 grid grid-cols-1 md:grid-cols-5 gap-4 text-center">
                <div className="p-3 bg-white/50 dark:bg-slate-900/30 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold mx-auto mb-2 text-sm">1</div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Order Placed</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Pending payment and verification</p>
                </div>
                
                <div className="p-3 bg-white/50 dark:bg-slate-900/30 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                  <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 flex items-center justify-center font-bold mx-auto mb-2 text-sm">2</div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Paid / Processing</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Order verified and waiting for a driver</p>
                </div>

                <div className="p-3 bg-white/50 dark:bg-slate-900/30 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold mx-auto mb-2 text-sm">3</div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Driver Assigned</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Driver accepted delivery job</p>
                </div>

                <div className="p-3 bg-white/50 dark:bg-slate-900/30 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold mx-auto mb-2 text-sm">4</div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">In Transit</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Catches picked up and on the way</p>
                </div>

                <div className="p-3 bg-white/50 dark:bg-slate-900/30 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 flex items-center justify-center font-bold mx-auto mb-2 text-sm">5</div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Delivered</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Arrived safely at customer address</p>
                </div>

                <div className="col-span-1 md:col-span-5 text-xs text-slate-500 dark:text-slate-400 mt-3 text-left bg-white/40 dark:bg-slate-900/20 p-3.5 rounded-xl border border-slate-200/30 dark:border-slate-700/30">
                  💡 <strong>How to test this manually:</strong> Use the <strong>🔍 Track Status</strong> button to open the scanner and watch the order progress update live as the payment, driver pickup, and delivery steps change.
                </div>
              </div>
            )}
          </div> */}

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search orders by ID, product, or status..."
                className="w-full px-5 py-3 pl-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 outline-none transition-shadow shadow-sm"
              />
              <span className="absolute left-4 top-3.5 text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </span>
            </div>
            
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 outline-none shadow-sm cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="cancelled">cancelled</option>
                <option value="rejected">rejected</option>
                <option value="completed">Completed</option>
                 <option value="processing">processing</option>
               
              </select>

              <button
                onClick={handleExport}
                className="px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm flex items-center gap-2"
                title="Export as CSV"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Export
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Total Orders</p>
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{totalOrders}</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Pending Orders</p>
                <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{pendingOrders}</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Completed</p>
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{completedOrders}</p>
            </div>

            <div className="bg-cyan-600 dark:bg-cyan-900/40 rounded-2xl p-6 shadow-md border border-cyan-500 dark:border-cyan-800 hover:shadow-lg transition-shadow relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
              <div className="flex items-center justify-between mb-4 relative z-10">
                <p className="text-cyan-100 dark:text-cyan-300 text-xs font-bold uppercase tracking-wider">Total Revenue</p>
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
              </div>
              <p className="text-3xl font-extrabold text-white relative z-10">${totalRevenue}</p>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-8 overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 border-b border-slate-100 dark:border-slate-700/50">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Orders</h2>
              <button 
                onClick={() => navigate('/market')}
                className="mt-4 sm:mt-0 px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-semibold shadow-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                New Order
              </button>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700/50">
                  <tr>
                    <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-400 text-xs tracking-wider uppercase">Order Info</th>
                    <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-400 text-xs tracking-wider uppercase">Product</th>
                    <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-400 text-xs tracking-wider uppercase">Customer</th>
                    <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-400 text-xs tracking-wider uppercase">Status</th>
                    <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-400 text-xs tracking-wider uppercase">Payment</th>
                    <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-400 text-xs tracking-wider uppercase">Total</th>
                   
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                      <Fragment key={order.id}>
                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="font-semibold text-slate-900 dark:text-white">#{order.id}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{new Date(order.created_at).toLocaleDateString()}</div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-medium text-slate-900 dark:text-white">
                              {getOrderProductInfo(order).name}
                            </div>
                            {getOrderProductInfo(order).weight > 0 && (
                              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {`${getOrderProductInfo(order).weight}kg`}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-medium text-slate-900 dark:text-white">Customer: {order.customer_name || order.name || order.user_id}</div>
                            {order.delivery_info && (
                              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate max-w-[120px]" title={order.delivery_info}>
                                {order.delivery_info}
                              </div>
                            )}
                            {order.driver_id && (
                              <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                Assigned Driver: {getOrderDriver(order)?.name}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                order.status === 'delivered' || order.status === 'completed'
                                  ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800/50 dark:text-green-400'
                                  : order.status === 'pending_verification'
                                  ? 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800/50 dark:text-orange-400'
                                  : order.status === 'pending'
                                  ? 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800/50 dark:text-yellow-400'
                                  : order.status === 'processing'
                                  ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800/50 dark:text-blue-400'
                                  : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${order.status === 'delivered' || order.status === 'completed' ? 'bg-green-500' : order.status === 'pending' ? 'bg-yellow-500' : order.status === 'processing' ? 'bg-blue-500' : 'bg-slate-400'}`}></span>
                              <span className="capitalize">{order.status.replace('_', ' ')}</span>
                            </span>

                            <button
                              onClick={() => toggleExpandOrder(order.id)}
                              className="mt-1.5 flex items-center gap-1 text-[10px] text-cyan-600 hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-300 font-bold tracking-wide uppercase transition-colors"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2" /></svg>
                              {expandedOrders[order.id] ? 'Hide Scanner' : '🔍 Track Status'}
                            </button>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                              order.payment_status === 'paid' ? 'text-green-700 dark:text-green-400' :
                              order.payment_status === 'pending' ? 'text-yellow-700 dark:text-yellow-400' :
                              order.payment_status === 'failed' ? 'text-red-700 dark:text-red-400' :
                              'text-slate-600 dark:text-slate-400'
                            }`}>
                              {order.payment_status || 'pending'}
                            </span>
                          </td>
                          <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">${order.total_price.toFixed(2)}</td>
                          {/* <td className="py-4 px-6">
                            <div className="flex flex-col gap-2">
                              {canManageOrders ? (
                                !['completed', 'delivered', 'cancelled', 'rejected'].includes(order.status?.toLowerCase()) && (
                                  <>
                                    {order.status?.toLowerCase() === 'processing' && (
                                      <button
                                        onClick={() => handleStatusUpdate(order.id, 'completed')}
                                        className="w-full px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900/40 dark:hover:bg-green-900/60 dark:text-green-400 rounded-lg text-xs font-bold transition-colors shadow-sm"
                                      >
                                        Complete
                                      </button>
                                    )}
                                    {order.payment_status?.toLowerCase() !== 'paid' && (
                                      <button
                                        onClick={() => handleStatusUpdate(order.id, 'rejected')}
                                        className="w-full px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-900/40 dark:hover:bg-red-900/60 dark:text-red-400 rounded-lg text-xs font-bold transition-colors shadow-sm"
                                      >
                                        Reject
                                      </button>
                                    )}
                                  </>
                                )
                              ) : (
                                !['completed', 'delivered', 'cancelled', 'rejected'].includes(order.status?.toLowerCase()) && order.payment_status?.toLowerCase() !== 'paid' && (
                                  <button
                                    onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                                    className="w-full px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-900/40 dark:hover:bg-red-900/60 dark:text-red-400 rounded-lg text-xs font-bold transition-colors shadow-sm"
                                  >
                                    Cancel Order
                                  </button>
                                )
                              )}



                              {['completed', 'delivered', 'cancelled', 'rejected'].includes(order.status?.toLowerCase()) && (
                                <span className="text-slate-400 text-xs italic">No actions</span>
                              )}
                            </div>
                          </td> */}
                        </tr>

                        {expandedOrders[order.id] && (
                          <tr key={`expanded-${order.id}`}>
                            <td colSpan="7" className="bg-slate-50/70 dark:bg-slate-900/30 px-6 py-5 border-b border-slate-100 dark:border-slate-700/50">
                              <div className="max-w-3xl mx-auto py-2 text-left">
                                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                                  <span className="flex h-2.5 w-2.5 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                                  </span>
                                  Delivery Scanner Status (Order #{order.id})
                                </h4>
                              
                              {/* Timeline Stepper */}
                              <div className="relative flex items-center justify-between mb-8 px-4">
                                <div className="absolute left-6 right-6 top-4 h-[3px] bg-slate-200 dark:bg-slate-700 -z-0 rounded"></div>
                                <div 
                                  className="absolute left-6 top-4 h-[3px] bg-cyan-500 transition-all duration-500 -z-0 rounded"
                                  style={{ width: `${((getActiveStep(order) - 1) / 4) * 88}%` }}
                                ></div>

                                {/* Step 1 */}
                                <div className="relative flex flex-col items-center z-10">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${
                                    getStepStatus(order, 1) === 'completed'
                                      ? 'bg-cyan-500 border-cyan-500 text-white shadow-md shadow-cyan-200 dark:shadow-none'
                                      : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-500'
                                  }`}>
                                    ✓
                                  </div>
                                  <span className="text-[10px] font-bold mt-2 text-slate-700 dark:text-slate-300 uppercase tracking-wider">Placed</span>
                                </div>

                                {/* Step 2 */}
                                <div className="relative flex flex-col items-center z-10">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${
                                    getStepStatus(order, 2) === 'completed'
                                      ? 'bg-cyan-500 border-cyan-500 text-white shadow-md shadow-cyan-200 dark:shadow-none'
                                      : getActiveStep(order) === 2
                                      ? 'bg-white dark:bg-slate-800 border-cyan-500 text-cyan-500 animate-pulse'
                                      : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-500'
                                  }`}>
                                    {getStepStatus(order, 2) === 'completed' ? '✓' : '2'}
                                  </div>
                                  <span className="text-[10px] font-bold mt-2 text-slate-700 dark:text-slate-300 uppercase tracking-wider">Paid</span>
                                </div>

                                {/* Step 3 */}
                                <div className="relative flex flex-col items-center z-10">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${
                                    getStepStatus(order, 3) === 'completed'
                                      ? 'bg-cyan-500 border-cyan-500 text-white shadow-md shadow-cyan-200 dark:shadow-none'
                                      : getActiveStep(order) === 3
                                      ? 'bg-white dark:bg-slate-800 border-cyan-500 text-cyan-500 animate-pulse'
                                      : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-500'
                                  }`}>
                                    {getStepStatus(order, 3) === 'completed' ? '✓' : '3'}
                                  </div>
                                  <span className="text-[10px] font-bold mt-2 text-slate-700 dark:text-slate-300 uppercase tracking-wider">Assigned</span>
                                </div>

                                {/* Step 4 */}
                                <div className="relative flex flex-col items-center z-10">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${
                                    getStepStatus(order, 4) === 'completed'
                                      ? 'bg-cyan-500 border-cyan-500 text-white shadow-md shadow-cyan-200 dark:shadow-none'
                                      : getActiveStep(order) === 4
                                      ? 'bg-white dark:bg-slate-800 border-cyan-500 text-cyan-500 animate-pulse'
                                      : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-500'
                                  }`}>
                                    {getStepStatus(order, 4) === 'completed' ? '✓' : '4'}
                                  </div>
                                  <span className="text-[10px] font-bold mt-2 text-slate-700 dark:text-slate-300 uppercase tracking-wider">Transit</span>
                                </div>

                                {/* Step 5 */}
                                <div className="relative flex flex-col items-center z-10">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${
                                    getStepStatus(order, 5) === 'completed'
                                      ? 'bg-cyan-500 border-cyan-500 text-white shadow-md shadow-cyan-200 dark:shadow-none'
                                      : getActiveStep(order) === 5
                                      ? 'bg-white dark:bg-slate-800 border-cyan-500 text-cyan-500 animate-pulse'
                                      : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-500'
                                  }`}>
                                    {getStepStatus(order, 5) === 'completed' ? '✓' : '5'}
                                  </div>
                                  <span className="text-[10px] font-bold mt-2 text-slate-700 dark:text-slate-300 uppercase tracking-wider">Delivered</span>
                                </div>
                              </div>

                              {/* Detailed Status Logs */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                                {isFisherman && (
                                  <div className="md:col-span-2 rounded-xl border border-cyan-200 dark:border-cyan-900/50 bg-cyan-50/60 dark:bg-cyan-950/20 p-4">
                                    <div className="text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400 mb-2">Assign Driver</div>
                                    <div className="flex flex-col md:flex-row gap-2">
                                      <select value={selectedDriverId} onChange={(e) => setSelectedDriverId(e.target.value)} className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm">
                                        <option value="">Select a driver</option>
                                        {drivers.map((driver) => (
                                          <option key={driver.id} value={driver.id}>{driver.name} {driver.phone ? `• ${driver.phone}` : ''}</option>
                                        ))}
                                      </select>
                                      <input value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} placeholder="Est. delivery time" className="md:w-48 px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                                      <button onClick={() => handleAssignDriver(order.id)} className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-semibold">Assign Driver</button>
                                    </div>
                                  </div>
                                )}
                                <div>
                                  <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">Scanner Details</span>
                                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                    {getActiveStep(order) === 2 && '💳 Awaiting payment verification.'}
                                    {getActiveStep(order) === 3 && '📦 Paid successfully. Waiting for a delivery driver to accept this job.'}
                                    {getActiveStep(order) === 4 && `🚚 Driver is traveling to pick up fish catches from the fisherman.`}
                                    {getActiveStep(order) === 5 && `🚲 Driver is currently in transit to deliver catches to your address.`}
                                    {getActiveStep(order) === 6 && '🎉 Delivered! Thank you for purchasing.'}
                                  </p>
                                  {order.delivery_info && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                      <strong>Delivery Address / Info:</strong> {order.delivery_info}
                                    </p>
                                  )}
                                </div>
                                <div className="border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-700/50 pt-4 md:pt-0 md:pl-5 flex flex-col justify-center">
                                  <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">Driver Information</span>
                                  {order.driver_id ? (
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-400 flex items-center justify-center text-xs font-bold uppercase">
                                        DR
                                      </div>
                                      <div>
                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 font-sans">
                                          {order.driver_name || getOrderDriver(order)?.name || 'Assigned Driver'}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                          {order.driver_phone || getOrderDriver(order)?.phone || `Driver ID: #${order.driver_id}`}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                          {order.driver_vehicle_type 
                                            ? `${order.driver_vehicle_type}${order.driver_vehicle_number ? ` • ${order.driver_vehicle_number}` : ''}` 
                                            : getOrderDriver(order)?.vehicle_type 
                                            ? `${getOrderDriver(order).vehicle_type}${getOrderDriver(order)?.vehicle_number ? ` • ${getOrderDriver(order).vehicle_number}` : ''}` 
                                            : 'Vehicle info not available'}
                                        </p>
                                        {order.estimated_delivery_time && <p className="text-xs text-cyan-600 dark:text-cyan-400">ETA: {order.estimated_delivery_time}</p>}
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 italic">No driver assigned yet.</p>
                                  )}
                                </div>
                              </div>

                              <div className="mt-5 flex flex-wrap gap-2">
                                {order.delivery_status === 'delivered' && !order.customer_confirmed && (
                                  <button onClick={() => handleConfirmReceipt(order.id)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold">✅ I Received My Order</button>
                                )}
                                {isFisherman && order.customer_confirmed && order.status !== 'completed' && (
                                  <button onClick={() => handleCompleteOrder(order.id)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold">Mark Completed</button>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                      </Fragment>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-500 dark:text-slate-400">
                        <div className="flex flex-col items-center">
                          <svg className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                          <p>No orders found matching your search.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden flex flex-col divide-y divide-slate-100 dark:divide-slate-700/50">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <div key={order.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">#{order.id}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{new Date(order.created_at).toLocaleDateString()}</div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        order.status === 'delivered' || order.status === 'completed'
                          ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800/50 dark:text-green-400'
                          : order.status === 'pending_verification'
                          ? 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800/50 dark:text-orange-400'
                          : order.status === 'pending'
                          ? 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800/50 dark:text-yellow-400'
                          : order.status === 'processing'
                          ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800/50 dark:text-blue-400'
                          : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                      }`}>
                        <span className="capitalize">{order.status.replace('_', ' ')}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50 mt-1">
                      <div>
                        <span className="text-xs text-slate-500 block mb-0.5">Product</span>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {getOrderProductInfo(order).name} {getOrderProductInfo(order).weight > 0 ? `(${getOrderProductInfo(order).weight}kg)` : ''}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 block mb-0.5">Customer</span>
                        <span className="font-medium text-slate-900 dark:text-white">{order.customer_name || order.name || order.user_id}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 block mb-0.5">Driver</span>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {order.driver_id ? (order.driver_name || getOrderDriver(order)?.name || `#${order.driver_id}`) : 'Not assigned'}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 block mb-0.5">Total</span>
                        <span className="font-bold text-slate-900 dark:text-white">${order.total_price.toFixed(2)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleExpandOrder(order.id)}
                      className="w-full mt-1 py-2 flex items-center justify-center gap-1.5 text-xs text-cyan-600 hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-300 font-bold border border-cyan-200/50 dark:border-cyan-900/30 rounded-lg bg-cyan-50/30 dark:bg-cyan-950/10 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2" /></svg>
                      {expandedOrders[order.id] ? 'Hide Delivery Scanner' : '🔍 Track Delivery Status'}
                    </button>

                    {expandedOrders[order.id] && (
                      <div className="mt-2 p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 text-left">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-1.5">
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                          </span>
                          Delivery Scanner Status
                        </h4>
                        
                        {/* Stepper (Vertical for mobile) */}
                        <div className="flex flex-col gap-5 relative pl-4 before:content-[''] before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200 dark:before:bg-slate-700">
                          {/* Step 1 */}
                          <div className="relative flex items-start gap-3">
                            <div className={`absolute left-[-13px] w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${
                              getStepStatus(order, 1) === 'completed' ? 'bg-cyan-500 border-cyan-500 text-white shadow-sm' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-500'
                            }`}>
                              ✓
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none">Order Placed</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Order created successfully</p>
                            </div>
                          </div>

                          {/* Step 2 */}
                          <div className="relative flex items-start gap-3">
                            <div className={`absolute left-[-13px] w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${
                              getStepStatus(order, 2) === 'completed' ? 'bg-cyan-500 border-cyan-500 text-white shadow-sm' : getActiveStep(order) === 2 ? 'bg-white border-cyan-500 text-cyan-500 animate-pulse' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-500'
                            }`}>
                              {getStepStatus(order, 2) === 'completed' ? '✓' : '2'}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none">Paid / Processing</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Payment verified</p>
                            </div>
                          </div>

                          {/* Step 3 */}
                          <div className="relative flex items-start gap-3">
                            <div className={`absolute left-[-13px] w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${
                              getStepStatus(order, 3) === 'completed' ? 'bg-cyan-500 border-cyan-500 text-white shadow-sm' : getActiveStep(order) === 3 ? 'bg-white border-cyan-500 text-cyan-500 animate-pulse' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-500'
                            }`}>
                              {getStepStatus(order, 3) === 'completed' ? '✓' : '3'}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none">Driver Assigned</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Driver accepted delivery job</p>
                            </div>
                          </div>

                          {/* Step 4 */}
                          <div className="relative flex items-start gap-3">
                            <div className={`absolute left-[-13px] w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${
                              getStepStatus(order, 4) === 'completed' ? 'bg-cyan-500 border-cyan-500 text-white shadow-sm' : getActiveStep(order) === 4 ? 'bg-white border-cyan-500 text-cyan-500 animate-pulse' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-500'
                            }`}>
                              {getStepStatus(order, 4) === 'completed' ? '✓' : '4'}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none">In Transit</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Catches picked up by driver</p>
                            </div>
                          </div>

                          {/* Step 5 */}
                          <div className="relative flex items-start gap-3">
                            <div className={`absolute left-[-13px] w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${
                              getStepStatus(order, 5) === 'completed' ? 'bg-cyan-500 border-cyan-500 text-white shadow-sm' : getActiveStep(order) === 5 ? 'bg-white border-cyan-500 text-cyan-500 animate-pulse' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-500'
                            }`}>
                              {getStepStatus(order, 5) === 'completed' ? '✓' : '5'}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none">Delivered</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Arrived safely at location</p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/50 text-[11px] text-slate-600 dark:text-slate-400">
                          <p><strong>Scanner details:</strong></p>
                          <p className="mt-1 text-slate-800 dark:text-slate-200 font-medium">
                            {getActiveStep(order) === 2 && '💳 Awaiting payment verification.'}
                            {getActiveStep(order) === 3 && '📦 Paid successfully. Waiting for driver.'}
                            {getActiveStep(order) === 4 && `🚚 Driver is traveling to pick up catches.`}
                            {getActiveStep(order) === 5 && `🚲 Driver is delivering catches.`}
                            {getActiveStep(order) === 6 && '🎉 Delivered successfully!'}
                          </p>
                          {order.driver_id && (
                            <p className="mt-2 text-slate-500">
                              <strong>Driver:</strong> {order.driver_name || getOrderDriver(order)?.name || 'Assigned Driver'} (ID: #{order.driver_id})
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="mt-2 flex flex-col gap-2">
                      {canManageOrders ? (
                        !['completed', 'delivered', 'cancelled', 'rejected'].includes(order.status?.toLowerCase()) && (
                          <div className="flex gap-2 w-full">
                            {order.status?.toLowerCase() === 'processing' && (
                              <button
                                onClick={() => handleStatusUpdate(order.id, 'completed')}
                                className="flex-1 py-2 bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900/40 dark:hover:bg-green-900/60 dark:text-green-400 rounded-lg text-xs font-bold transition-colors shadow-sm"
                              >
                                Mark Complete
                              </button>
                            )}
                            {order.payment_status?.toLowerCase() !== 'paid' && (
                              <button
                                onClick={() => handleStatusUpdate(order.id, 'rejected')}
                                className="flex-1 py-2 bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-900/40 dark:hover:bg-red-900/60 dark:text-red-400 rounded-lg text-xs font-bold transition-colors shadow-sm"
                              >
                                Reject
                              </button>
                            )}
                          </div>
                        )
                      ) : (
                        !['completed', 'delivered', 'cancelled', 'rejected'].includes(order.status?.toLowerCase()) && order.payment_status?.toLowerCase() !== 'paid' && (
                          <button
                            onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                            className="w-full py-2 bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-900/40 dark:hover:bg-red-900/60 dark:text-red-400 rounded-lg text-xs font-bold transition-colors shadow-sm"
                          >
                            Cancel Order
                          </button>
                        )
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                  <div className="flex flex-col items-center">
                    <svg className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    <p>No orders found matching your search.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-700/50 text-xs text-slate-500 dark:text-slate-400 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <span>Showing {filteredOrders.length} orders</span>
            </div>
          </div>
          
          {error && (
            <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}

export default Orders;