import { useEffect, useState, useCallback, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useNotification } from '../context/NotificationContext';
import DriverDashboard from './DriverDashboard';

import Layout from '../components/Layout';
function Dashboard() {
  const userRole = localStorage.getItem('fisher_role');

  if (userRole === 'driver') {
    return <DriverDashboard />;
  }

  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('week');
  const [catches, setCatches] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [catchTrends, setCatchTrends] = useState([]);
  const [realTimeFeed, setRealTimeFeed] = useState([]);
  const [showPaymentsFilter, setShowPaymentsFilter] = useState(false);
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('All');
  const [earnings, setEarnings] = useState({ total_earnings: 0 });
  const [earningsTrends, setEarningsTrends] = useState([]);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const navigate = useNavigate();
  const isAdmin = userRole === 'admin';
  const isFisherman = userRole === 'fisherman';

  useEffect(() => {
    if (userRole === 'admin') {
      navigate('/admin');
    }
  }, [userRole, navigate]);

  const { notificationsHistory } = useNotification();
  const isCustomer = userRole === 'customer';

  const loadDashboard = useCallback(async () => {
    try {
      const [profileRes, catchesRes, ordersRes, paymentsRes] = await Promise.all([
        api.get('/users/me'),
        api.get(isAdmin ? '/catches' : isFisherman ? '/catches/my-catches' : '/catches'),
        api.get(isAdmin || isFisherman ? '/orders' : '/orders/my-orders'),
        (isAdmin || isFisherman || isCustomer) ? api.get('/payments') : Promise.resolve({ data: [] }),
      ]);

      const profile = profileRes.data;
      const catchesData = (catchesRes.data || []).map(item => ({
        ...item,
        weight: Number(item.weight) || 0,
        price: Number(item.price) || 0,
        status: String(item.status || 'listed').toLowerCase(),
      }));
      const ordersData = (ordersRes.data || [])
        .filter(item => {
          if (userRole !== 'customer' && userRole !== 'fisherman') return true;
          return String(item.payment_status || '').toLowerCase() === 'paid';
        })
        .map(item => ({
          ...item,
          total_price: Number(item.total_price) || 0,
        }));
      const paymentsData = (paymentsRes.data || []).map(item => ({
        ...item,
        amount: Number(item.amount) || 0,
        status: String(item.status || 'pending').toLowerCase(),
      }));

      setUser(profile);
      setCatches(catchesData);
      setOrders(ordersData);
      setPayments(paymentsData);

      // Load earnings data for fishermen
      if (isFisherman) {
        try {
          const [earningsRes, dailyEarningsRes] = await Promise.all([
            api.get('/earnings/summary'),
            api.get('/earnings/daily?days=7'),
          ]);
          setEarnings(earningsRes.data);
          setEarningsTrends(dailyEarningsRes.data || []);
        } catch (err) {
          console.error('Error loading earnings:', err);
        }
      }

      const days = Array.from({ length: 7 }, (_, index) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - index));
        return {
          key: date.toISOString().slice(0, 10),
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          value: 0,
        };
      });

      const trendMap = new Map(days.map(item => [item.key, item]));
      catchesData.forEach(item => {
        const key = new Date(item.created_at).toISOString().slice(0, 10);
        if (trendMap.has(key)) {
          trendMap.get(key).value += item.weight;
        }
      });

      setCatchTrends(Array.from(trendMap.values()));

      const newestOrder = ordersData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
      const newestCatch = catchesData[0];

      const feed = [];
      if (newestOrder) {
        feed.push({
          id: `order-${newestOrder.id}`,
          title: 'New Order Received',
          subtitle: `Order #${newestOrder.id} • $${newestOrder.total_price.toFixed(2)}`,
          time: getRelativeTime(newestOrder.created_at),
          icon: '🛒',
        });
      }
      if (newestCatch) {
        feed.push({
          id: `catch-${newestCatch.id}`,
          title: 'Latest Catch Logged',
          subtitle: `${newestCatch.fish_name} • ${newestCatch.weight.toFixed(2)} kg`,
          time: getRelativeTime(newestCatch.created_at),
          icon: '🐟',
        });
      }

      setRealTimeFeed(feed);
    } catch (err) {
      setError('Unable to load dashboard data.');
      console.error(err);
    }
  }, [isAdmin, isFisherman]);

  // initial load
  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // reload when notifications history changes (real-time events)
  const prevNotifCount = useRef((notificationsHistory || []).length);
  useEffect(() => {
    const curr = (notificationsHistory || []).length;
    if (curr > prevNotifCount.current) {
      loadDashboard();
    }
    prevNotifCount.current = curr;
  }, [notificationsHistory, loadDashboard]);

  useEffect(() => {
    const savedFavorites = localStorage.getItem('buyer_favorites');
    setFavoriteCount(savedFavorites ? JSON.parse(savedFavorites).length : 0);
  }, []);

  function getRelativeTime(dateString) {
    const date = new Date(dateString);
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes} mins ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hrs ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  }

  const handleLogout = () => {
    localStorage.removeItem('fisher_token');
    localStorage.removeItem('fisher_role');
    navigate('/login');
  };

  const totalCatchWeight = catches.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);
  const totalRevenue = orders
    .filter(item => item.payment_status?.toLowerCase() === 'paid')
    .reduce((sum, item) => sum + (Number(item.total_price) || 0), 0);
  const dailySales = orders
    .filter(order => new Date(order.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000))
    .filter(order => order.payment_status?.toLowerCase() === 'paid')
    .reduce((sum, item) => sum + (Number(item.total_price) || 0), 0);

  const filteredPayments = payments.filter((item) => {
    return filterPaymentStatus === 'All' || item.status === filterPaymentStatus;
  });

  const exportPayments = () => {
    if (!filteredPayments.length) {
      alert('No payments to export.');
      return;
    }
    const headers = ['order_id', 'amount', 'status', 'method', 'reference', 'date'];
    const rows = filteredPayments.map(p => [
      p.order_id,
      `$${p.amount.toFixed(2)}`,
      p.status.toUpperCase(),
      p.method || 'N/A',
      p.reference || 'N/A',
      new Date(p.created_at).toLocaleDateString('en-US'),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `recent-payments-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadReport = () => {
    const today = new Date().toISOString().slice(0, 10);
    let rows = [];
    let headers = [];
    let filename = '';

    if (isCustomer) {
      filename = `customer-report-${today}.csv`;
      headers = ['Report: Customer Spending & Orders', '', '', ''];
      rows = [
        ['--- PAYMENTS ---', '', '', ''],
        ['Status', 'Count', 'Total Amount', ''],
        ['Verified', payments.filter(p => p.status === 'verified').length, `$${payments.filter(p => p.status === 'verified').reduce((s, p) => s + p.amount, 0).toFixed(2)}`],
        ['Pending',  payments.filter(p => p.status === 'pending').length,  `$${payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0).toFixed(2)}`],
        ['Rejected', payments.filter(p => p.status === 'rejected').length, `$${payments.filter(p => p.status === 'rejected').reduce((s, p) => s + p.amount, 0).toFixed(2)}`],
        ['All-Time Total', payments.length, `$${payments.reduce((s, p) => s + p.amount, 0).toFixed(2)}`],
        ['', '', '', ''],
        ['--- ORDERS ---', '', '', ''],
        ['Status', 'Count', '', ''],
        ['Delivered',  orders.filter(o => ['delivered','completed'].includes((o.status||'').toLowerCase())).length],
        ['Processing', orders.filter(o => (o.status||'').toLowerCase() === 'processing').length],
        ['Pending',    orders.filter(o => (o.status||'').toLowerCase() === 'pending').length],
        ['Cancelled',  orders.filter(o => (o.status||'').toLowerCase() === 'cancelled').length],
        ['Total',      orders.length],
        ['', '', '', ''],
        ['--- PAYMENT DETAIL ---', '', '', ''],
        ['Order ID', 'Amount', 'Method', 'Status', 'Date'],
        ...payments.map(p => [p.order_id, `$${p.amount.toFixed(2)}`, p.method || 'N/A', p.status.toUpperCase(), new Date(p.created_at).toLocaleDateString('en-US')]),
      ];
    } else if (isFisherman) {
      filename = `fisherman-report-${today}.csv`;
      headers = ['Report: Fisherman Earnings & Catches', '', '', ''];
      rows = [
        ['--- EARNINGS ---', '', '', ''],
        ['Total Earnings', `$${Number(earnings.total_earnings || 0).toFixed(2)}`],
        ['Verified Payments', payments.filter(p => p.status === 'verified').length, `$${payments.filter(p => p.status === 'verified').reduce((s, p) => s + p.amount, 0).toFixed(2)}`],
        ['Pending Payments',  payments.filter(p => p.status === 'pending').length,  `$${payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0).toFixed(2)}`],
        ['', '', '', ''],
        ['--- CATCHES ---', '', '', ''],
        ['Total Catches', catches.length, '', ''],
        ['Total Weight (kg)', totalCatchWeight.toFixed(2)],
        ['Listed', catches.filter(c => c.status === 'listed').length],
        ['Sold',   catches.filter(c => c.status === 'sold').length],
        ['', '', '', ''],
        ['--- ORDERS ---', '', '', ''],
        ['Delivered',  orders.filter(o => ['delivered','completed'].includes((o.status||'').toLowerCase())).length],
        ['Processing', orders.filter(o => (o.status||'').toLowerCase() === 'processing').length],
        ['Pending',    orders.filter(o => (o.status||'').toLowerCase() === 'pending').length],
        ['Total',      orders.length],
      ];
    } else {
      // Admin
      filename = `admin-report-${today}.csv`;
      headers = ['Report: Admin Overview', '', '', ''];
      rows = [
        ['--- PAYMENTS ---', '', '', ''],
        ['Verified', payments.filter(p => p.status === 'verified').length, `$${payments.filter(p => p.status === 'verified').reduce((s, p) => s + p.amount, 0).toFixed(2)}`],
        ['Pending',  payments.filter(p => p.status === 'pending').length,  `$${payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0).toFixed(2)}`],
        ['Rejected', payments.filter(p => p.status === 'rejected').length, `$${payments.filter(p => p.status === 'rejected').reduce((s, p) => s + p.amount, 0).toFixed(2)}`],
        ['Total Revenue', '', `$${payments.filter(p => p.status === 'verified').reduce((s, p) => s + p.amount, 0).toFixed(2)}`],
        ['', '', '', ''],
        ['--- ORDERS ---', '', '', ''],
        ['Delivered',  orders.filter(o => ['delivered','completed'].includes((o.status||'').toLowerCase())).length],
        ['Processing', orders.filter(o => (o.status||'').toLowerCase() === 'processing').length],
        ['Pending',    orders.filter(o => (o.status||'').toLowerCase() === 'pending').length],
        ['Cancelled',  orders.filter(o => (o.status||'').toLowerCase() === 'cancelled').length],
        ['Total',      orders.length],
        ['', '', '', ''],
        ['--- CATCHES ---', '', '', ''],
        ['Total Catches', catches.length],
        ['Total Weight (kg)', totalCatchWeight.toFixed(2)],
        ['Listed', catches.filter(c => c.status === 'listed').length],
        ['Sold',   catches.filter(c => c.status === 'sold').length],
      ];
    }

    const csvLines = [
      headers.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','),
      ...rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([csvLines], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const activeOrdersCount = orders.filter(
    order => order.status && !['delivered', 'completed'].includes(order.status.toLowerCase())
  ).length;
  const newOrdersCount = orders.filter(
    order => Date.now() - new Date(order.created_at).getTime() < 24 * 60 * 60 * 1000
  ).length;
  const currentDateString = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const greetingName = user?.name?.split(' ')[0] || 'Captain';

  const maxValue = catchTrends.length ? Math.max(...catchTrends.map(d => d.value)) : 1;

  return (
    <Layout activePage="dashboard" className="bg-gradient-to-br from-slate-300 to-cyan-300 dark:from-slate-900 dark:to-slate-800">
      <div className="p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">Fleet Overview</h1>
            <p className="text-slate-700 dark:text-slate-300 mt-1">Good morning, {greetingName}. Here is your latest fleet and sales summary.</p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 dark:text-slate-100 rounded-lg px-4 py-2 shadow">
              <span>🔔</span>
              <span className="text-sm font-semibold">{newOrdersCount} New Orders</span>
            </div>
            <div className="text-slate-700 dark:text-slate-300 text-sm">
              📅 {currentDateString}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 dark:text-slate-100 rounded-2xl p-5 shadow-md">
            <div className="flex justify-between items-start mb-3">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">{isFisherman ? 'TOTAL FISH CATCH' : 'AVAILABLE FISH'}</p>
              <span className="text-xl">🎣</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{isFisherman ? totalCatchWeight.toFixed(2) : catches.length}</span>
              <span className="text-xs font-semibold">{isFisherman ? 'kg' : 'listings'}</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold mt-2">{isFisherman ? `Across ${catches.length} logged catches` : 'Live market inventory'}</p>
          </div>

          {isFisherman ? (
            <div className="bg-white dark:bg-slate-800 dark:text-slate-100 rounded-2xl p-5 shadow-md">
              <div className="flex justify-between items-start mb-3">
                <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">EARNINGS</p>
                <span className="text-xl">💰</span>
              </div>
              <div>
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">${Number(earnings.total_earnings || 0).toFixed(2)}</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold mt-2">Completed orders</p>
            </div>
          ) : isCustomer ? (
            <div className="bg-white dark:bg-slate-800 dark:text-slate-100 rounded-2xl p-5 shadow-md">
              <div className="flex justify-between items-start mb-3">
                <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">TOTAL SPENT</p>
                <span className="text-xl">💸</span>
              </div>
              <div>
                <span className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                  ${payments.reduce((sum, p) => sum + (p.status === 'verified' ? p.amount : 0), 0).toFixed(2)}
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold mt-2">Verified payments total</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 dark:text-slate-100 rounded-2xl p-5 shadow-md">
              <div className="flex justify-between items-start mb-3">
                <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">FAVORITE LISTINGS</p>
                <span className="text-xl">⭐</span>
              </div>
              <div>
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{favoriteCount}</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold mt-2">Saved buy recommendations</p>
            </div>
          )
          }

          <div className="bg-white dark:bg-slate-800 dark:text-slate-100 rounded-2xl p-5 shadow-md">
            <div className="flex justify-between items-start mb-3">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">{isFisherman ? 'DAILY SALES' : 'RECENT ORDERS'}</p>
              <span className="text-xl">💳</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{isFisherman ? `$${dailySales.toFixed(2)}` : orders.length}</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold mt-2">{isFisherman ? 'Last 24 hours' : 'Orders in your history'}</p>
          </div>

          <div className="bg-white dark:bg-slate-800 dark:text-slate-100 rounded-2xl p-5 shadow-md">
            <div className="flex justify-between items-start mb-3">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">ACTIVE ORDERS</p>
              <span className="text-xl">📦</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{activeOrdersCount}</span>
            </div>
            <span className="text-cyan-600 text-xs font-semibold mt-2 inline-block bg-cyan-100 px-2 py-1 rounded">Open</span>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Catch Trends */}
          <div className="col-span-1 lg:col-span-2 bg-white dark:bg-slate-800 dark:text-slate-100 rounded-2xl p-6 shadow-md">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Catch Trends</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Weekly performance by species</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('week')}
                  className={`px-3 py-1 rounded text-xs font-semibold ${
                    activeTab === 'week'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setActiveTab('month')}
                  className={`px-3 py-1 rounded text-xs font-semibold ${
                    activeTab === 'month'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  Month
                </button>
              </div>
            </div>

            {/* Chart */}
            <div className="flex items-end justify-around h-56 gap-2">
              {catchTrends.map((data) => (
                <div key={data.day} className="flex flex-col items-center flex-1">
                  <div
                    className="w-full bg-gradient-to-t from-cyan-500 to-cyan-300 rounded-t-lg transition-all hover:from-cyan-600 hover:to-cyan-400"
                    style={{ height: `${(data.value / maxValue) * 200}px` }}
                  ></div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 font-medium">{data.day}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time Feed */}
          <div className="bg-white dark:bg-slate-800 dark:text-slate-100 rounded-2xl p-6 shadow-md">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Real-time Feed</h2>
            <div className="space-y-4">
              {realTimeFeed.map((item) => (
                <div key={item.id} className="flex gap-3 pb-4 border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                  <span className="text-2xl flex-shrink-0">{item.icon}</span>
                  <div className="flex-1 text-sm">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.subtitle}</p>
                    <p className="text-xs text-slate-400 mt-1">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/notifications')}
              className="w-full mt-4 text-cyan-600 text-sm font-semibold hover:text-cyan-700"
            >
              View All Notifications
            </button>
          </div>
        </div>

        {/* Recent Payments - Customer View */}
        {isCustomer && (
          <div className="bg-white dark:bg-slate-800 dark:text-slate-100 rounded-2xl p-6 shadow-md mb-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Recent Payments</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">History of all your payments</p>
              </div>
              <span className="bg-cyan-100 text-cyan-700 text-xs font-bold px-3 py-1 rounded-full">
                {payments.length} Payment{payments.length !== 1 ? 's' : ''}
              </span>
            </div>

            {payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Order</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Method</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Reference</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                        <td className="py-4 px-4">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">#{payment.order_id}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-bold text-cyan-600 dark:text-cyan-400">${payment.amount.toFixed(2)}</span>
                        </td>
                        <td className="py-4 px-4 text-slate-600 dark:text-slate-300 capitalize">
                          {payment.method || 'N/A'}
                        </td>
                        <td className="py-4 px-4 text-slate-500 dark:text-slate-400 text-xs font-mono">
                          {payment.reference ? payment.reference.slice(0, 20) + (payment.reference.length > 20 ? '…' : '') : 'N/A'}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                            payment.status === 'verified'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                              : payment.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              payment.status === 'verified' ? 'bg-green-500' : payment.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}></span>
                            {payment.status ? payment.status.toUpperCase() : 'PENDING'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-500 dark:text-slate-400 text-xs">
                          {new Date(payment.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-3xl mb-4">💳</div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">No payments yet</p>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Your payment history will appear here after you make a purchase.</p>
              </div>
            )}
          </div>
        )}

        {/* Recent Payments - Admin / Fisherman View */}
        {!isCustomer && (
        <div className="bg-white dark:bg-slate-800 dark:text-slate-100 rounded-2xl p-6 shadow-md mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Recent Payments</h2>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPaymentsFilter(!showPaymentsFilter)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-900"
              >
                🔽 Filter
              </button>
              <button
                onClick={exportPayments}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-900"
              >
                📥 Export
              </button>
            </div>
          </div>
          {showPaymentsFilter && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Payment Status</label>
                <select
                  value={filterPaymentStatus}
                  onChange={(e) => setFilterPaymentStatus(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2"
                >
                  <option>All</option>
                  <option value="pending">PENDING</option>
                  <option value="verified">VERIFIED</option>
                  <option value="rejected">REJECTED</option>
                </select>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">ORDER</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">AMOUNT</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">METHOD</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">REFERENCE</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">STATUS</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">DATE</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length > 0 ? (
                  filteredPayments.map((payment) => (
                    <tr key={payment.id} className="border-b border-slate-100 hover:bg-slate-50 dark:bg-slate-900">
                      <td className="py-4 px-4 text-slate-900 dark:text-slate-100">#{payment.order_id}</td>
                      <td className="py-4 px-4 text-slate-700 dark:text-slate-300">${payment.amount.toFixed(2)}</td>
                      <td className="py-4 px-4 text-slate-700 dark:text-slate-300">{payment.method || 'N/A'}</td>
                      <td className="py-4 px-4 text-slate-700 dark:text-slate-300">{payment.reference || 'N/A'}</td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          payment.status === 'verified'
                            ? 'bg-green-100 text-green-700'
                            : payment.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {payment.status ? payment.status.toUpperCase() : 'PENDING'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-700 dark:text-slate-300">{new Date(payment.created_at).toLocaleDateString('en-US')}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-6 px-4 text-center text-sm text-slate-500 dark:text-slate-400">
                      No payments match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* Reports Section - All Roles */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">📊 Reports</h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {isCustomer ? 'Your spending & order overview' : isFisherman ? 'Your earnings & catch overview' : 'Platform-wide overview'}
              </span>
            </div>
            <button
              onClick={downloadReport}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold rounded-xl shadow transition-all hover:shadow-md active:scale-95"
            >
              📥 Download Report
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* ---- CUSTOMER CARDS ---- */}
            {isCustomer && (
              <>
                {/* Spending Overview */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-md">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">💰 Spending Overview</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Total Paid</span>
                      <span className="font-bold text-green-600 dark:text-green-400">
                        ${payments.filter(p => p.status === 'verified').reduce((s, p) => s + p.amount, 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Pending</span>
                      <span className="font-bold text-yellow-500">
                        ${payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Rejected</span>
                      <span className="font-bold text-red-500">
                        ${payments.filter(p => p.status === 'rejected').reduce((s, p) => s + p.amount, 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="border-t border-slate-100 dark:border-slate-700 pt-3 flex justify-between items-center">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">All Time</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        ${payments.reduce((s, p) => s + p.amount, 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Method Breakdown */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-md">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">💳 Payment Methods</p>
                  {(() => {
                    const methods = payments.reduce((acc, p) => { const m = p.method || 'Other'; acc[m] = (acc[m] || 0) + 1; return acc; }, {});
                    const total = payments.length || 1;
                    return Object.keys(methods).length > 0 ? (
                      <div className="space-y-3">
                        {Object.entries(methods).map(([method, count]) => (
                          <div key={method}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="capitalize text-slate-600 dark:text-slate-400">{method}</span>
                              <span className="font-semibold text-slate-900 dark:text-slate-100">{count} payment{count !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full transition-all" style={{ width: `${(count / total) * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-sm text-slate-400 dark:text-slate-500 mt-4">No payment data yet.</p>;
                  })()}
                </div>

                {/* Order Status Summary */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-md">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">📦 Order Summary</p>
                  <div className="space-y-3">
                    {[
                      { label: 'Delivered',  color: 'bg-green-500', count: orders.filter(o => ['delivered','completed'].includes((o.status||'').toLowerCase())).length },
                      { label: 'Processing', color: 'bg-blue-500',  count: orders.filter(o => (o.status||'').toLowerCase() === 'processing').length },
                      { label: 'Pending',    color: 'bg-yellow-400',count: orders.filter(o => (o.status||'').toLowerCase() === 'pending').length },
                      { label: 'Cancelled',  color: 'bg-red-400',   count: orders.filter(o => (o.status||'').toLowerCase() === 'cancelled').length },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${item.color}`}></span>
                          <span className="text-sm text-slate-600 dark:text-slate-400">{item.label}</span>
                        </div>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{item.count}</span>
                      </div>
                    ))}
                    <div className="border-t border-slate-100 dark:border-slate-700 pt-3 flex justify-between">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Total Orders</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{orders.length}</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ---- FISHERMAN CARDS ---- */}
            {isFisherman && (
              <>
                {/* Earnings Overview */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-md">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">💰 Earnings Overview</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Total Earnings</span>
                      <span className="font-bold text-green-600 dark:text-green-400">${Number(earnings.total_earnings || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Verified Payments</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {payments.filter(p => p.status === 'verified').length} — ${payments.filter(p => p.status === 'verified').reduce((s, p) => s + p.amount, 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Pending Payments</span>
                      <span className="font-bold text-yellow-500">
                        {payments.filter(p => p.status === 'pending').length} — ${payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="border-t border-slate-100 dark:border-slate-700 pt-3 flex justify-between items-center">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Daily Sales</span>
                      <span className="font-bold text-cyan-600 dark:text-cyan-400">${dailySales.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Catch Summary */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-md">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">🎣 Catch Summary</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Total Catches</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{catches.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Total Weight</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{totalCatchWeight.toFixed(2)} kg</span>
                    </div>
                    {[{label:'Listed',color:'bg-cyan-400'},{label:'Sold',color:'bg-green-500'},{label:'Expired',color:'bg-slate-400'}].map(s => (
                      <div key={s.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${s.color}`}></span>
                          <span className="text-sm text-slate-600 dark:text-slate-400">{s.label}</span>
                        </div>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{catches.filter(c => c.status === s.label.toLowerCase()).length}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-md">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">📦 Order Summary</p>
                  <div className="space-y-3">
                    {[
                      { label: 'Delivered',  color: 'bg-green-500', count: orders.filter(o => ['delivered','completed'].includes((o.status||'').toLowerCase())).length },
                      { label: 'Processing', color: 'bg-blue-500',  count: orders.filter(o => (o.status||'').toLowerCase() === 'processing').length },
                      { label: 'Pending',    color: 'bg-yellow-400',count: orders.filter(o => (o.status||'').toLowerCase() === 'pending').length },
                      { label: 'Cancelled',  color: 'bg-red-400',   count: orders.filter(o => (o.status||'').toLowerCase() === 'cancelled').length },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${item.color}`}></span>
                          <span className="text-sm text-slate-600 dark:text-slate-400">{item.label}</span>
                        </div>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{item.count}</span>
                      </div>
                    ))}
                    <div className="border-t border-slate-100 dark:border-slate-700 pt-3 flex justify-between">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Total Orders</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{orders.length}</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ---- ADMIN CARDS ---- */}
            {isAdmin && (
              <>
                {/* Payments Overview */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-md">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">💳 Payments Overview</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Total Revenue</span>
                      <span className="font-bold text-green-600 dark:text-green-400">${payments.filter(p => p.status === 'verified').reduce((s, p) => s + p.amount, 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Verified</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{payments.filter(p => p.status === 'verified').length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Pending</span>
                      <span className="font-bold text-yellow-500">{payments.filter(p => p.status === 'pending').length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Rejected</span>
                      <span className="font-bold text-red-500">{payments.filter(p => p.status === 'rejected').length}</span>
                    </div>
                    <div className="border-t border-slate-100 dark:border-slate-700 pt-3 flex justify-between items-center">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">All Payments</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{payments.length}</span>
                    </div>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-md">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">📦 Order Summary</p>
                  <div className="space-y-3">
                    {[
                      { label: 'Delivered',  color: 'bg-green-500', count: orders.filter(o => ['delivered','completed'].includes((o.status||'').toLowerCase())).length },
                      { label: 'Processing', color: 'bg-blue-500',  count: orders.filter(o => (o.status||'').toLowerCase() === 'processing').length },
                      { label: 'Pending',    color: 'bg-yellow-400',count: orders.filter(o => (o.status||'').toLowerCase() === 'pending').length },
                      { label: 'Cancelled',  color: 'bg-red-400',   count: orders.filter(o => (o.status||'').toLowerCase() === 'cancelled').length },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${item.color}`}></span>
                          <span className="text-sm text-slate-600 dark:text-slate-400">{item.label}</span>
                        </div>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{item.count}</span>
                      </div>
                    ))}
                    <div className="border-t border-slate-100 dark:border-slate-700 pt-3 flex justify-between">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Total Orders</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{orders.length}</span>
                    </div>
                  </div>
                </div>

                {/* Catch Overview */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-md">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">🎣 Catch Overview</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Total Listings</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{catches.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Total Weight</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{totalCatchWeight.toFixed(2)} kg</span>
                    </div>
                    {[{label:'Listed',color:'bg-cyan-400'},{label:'Sold',color:'bg-green-500'}].map(s => (
                      <div key={s.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${s.color}`}></span>
                          <span className="text-sm text-slate-600 dark:text-slate-400">{s.label}</span>
                        </div>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{catches.filter(c => c.status === s.label.toLowerCase()).length}</span>
                      </div>
                    ))}
                    <div className="border-t border-slate-100 dark:border-slate-700 pt-3 flex justify-between items-center">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Active Listings</span>
                      <span className="font-bold text-cyan-600 dark:text-cyan-400">{catches.filter(c => c.status === 'listed').length}</span>
                    </div>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Layout>
  );
}

export default Dashboard;
