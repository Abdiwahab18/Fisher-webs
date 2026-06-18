import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import Layout from '../components/Layout';

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
  const navigate = useNavigate();
  const userRole = localStorage.getItem('fisher_role');
  const isAdmin = userRole === 'admin';
  const isFisherman = userRole === 'fisherman';
  const canManageOrders = isAdmin || isFisherman;

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

        const rawOrders = (response.data || []).map((item) => ({
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
      } catch (err) {
        setError('Unable to load data.');
        console.error(err);
      }
    }

    loadUserAndOrders();
  }, [canManageOrders]);

  const handleLogout = () => {
    localStorage.removeItem('fisher_token');
    localStorage.removeItem('fisher_role');
    navigate('/login');
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
    const csvContent = [
      headers.join(','),
      ...filteredOrders.map(order => {
        const date = new Date(order.created_at).toLocaleDateString();
            const productName = order.items?.[0]?.fish_name || 'Mixed catch';
            const productWeight = order.items?.[0]?.weight ? `${order.items[0].weight}kg` : '';
            const product = productWeight ? `${productName} (${productWeight})` : productName;
          order.status,
          order.payment_status || 'pending',
          order.total_price.toFixed(2);
        
      })].join(',');
    

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'orders_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalOrders = orders.length;
  const pendingOrders = orders.filter((order) => order.status?.toLowerCase() === 'pending').length;
  const completedOrders = orders.filter((order) => ['delivered', 'completed'].includes(order.status?.toLowerCase())).length;
  const totalRevenue = orders.reduce((total, order) => total + (Number(order.total_price) || 0), 0).toFixed(2);

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
                    <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-400 text-xs tracking-wider uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-semibold text-slate-900 dark:text-white">#{order.id}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{new Date(order.created_at).toLocaleDateString()}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-medium text-slate-900 dark:text-white">
                          {order.items?.[0]?.fish_name || 'Mixed catch'}
                        </div>
                        <div className=" text-xs text-slate-500 dark:text-slate-400 mt-1">{ ` ${order.items[0].weight}kg` }</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-medium text-slate-900 dark:text-white">ID: {order.user_id}</div>
                          {order.delivery_info && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate max-w-[120px]" title={order.delivery_info}>
                              {order.delivery_info}
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
                        <td className="py-4 px-6">
                          {canManageOrders ? (
                            !['completed', 'delivered', 'cancelled', 'rejected'].includes(order.status?.toLowerCase()) ? (
                              <div className="flex flex-col gap-2">
                                {order.status?.toLowerCase() === 'processing' && (
                                  <button
                                    onClick={() => handleStatusUpdate(order.id, 'completed')}
                                    className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900/40 dark:hover:bg-green-900/60 dark:text-green-400 rounded-lg text-xs font-bold transition-colors shadow-sm"
                                  >
                                    Complete
                                  </button>
                                )}
                                {order.payment_status?.toLowerCase() !== 'paid' && (
                                  <button
                                    onClick={() => handleStatusUpdate(order.id, 'rejected')}
                                    className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-900/40 dark:hover:bg-red-900/60 dark:text-red-400 rounded-lg text-xs font-bold transition-colors shadow-sm"
                                  >
                                    Reject
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs italic">No actions</span>
                            )
                          ) : (
                            !['completed', 'delivered', 'cancelled', 'rejected'].includes(order.status?.toLowerCase()) && order.payment_status?.toLowerCase() !== 'paid' ? (
                              <div className="flex flex-col gap-2">
                                <button
                                  onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                                  className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-900/40 dark:hover:bg-red-900/60 dark:text-red-400 rounded-lg text-xs font-bold transition-colors shadow-sm"
                                >
                                  Cancel Order
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs italic">No actions</span>
                            )
                          )}
                        </td>
                      </tr>
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
                          {order.items?.[0]?.fish_name || 'Mixed catch'}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 block mb-0.5">Customer ID</span>
                        <span className="font-medium text-slate-900 dark:text-white">{order.user_id}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 block mb-0.5">Payment</span>
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          order.payment_status === 'paid' ? 'text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400' :
                          order.payment_status === 'pending' ? 'text-yellow-700 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          order.payment_status === 'failed' ? 'text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400' :
                          'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {order.payment_status || 'pending'}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 block mb-0.5">Total</span>
                        <span className="font-bold text-slate-900 dark:text-white">${order.total_price.toFixed(2)}</span>
                      </div>
                    </div>

                    {canManageOrders ? (
                      !['completed', 'delivered', 'cancelled', 'rejected'].includes(order.status?.toLowerCase()) && (
                        <div className="mt-1 flex gap-2">
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
                        <div className="mt-1 flex gap-2">
                          <button
                            onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                            className="flex-1 py-2 bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-900/40 dark:hover:bg-red-900/60 dark:text-red-400 rounded-lg text-xs font-bold transition-colors shadow-sm"
                          >
                            Cancel Order
                          </button>
                        </div>
                      )
                    )}
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
