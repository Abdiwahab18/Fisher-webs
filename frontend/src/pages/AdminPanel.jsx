import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import NotificationBell from '../components/NotificationBell';
import Layout from '../components/Layout';

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [catches, setCatches] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  // const navigate = useNavigate()

  const [salesData, setSalesData] = useState([]);

  const [recentActivity] = useState([
    { id: 1, title: 'Fleet Alpha docked', subtitle: '2 days ago • Port of Seattle', icon: '⚓' },
    { id: 2, title: 'Storage temperature alert', subtitle: '5 days ago • Warehouse A8', icon: '⚠️' },
    { id: 3, title: 'New wholesale order #8293', subtitle: '1 week ago • North Pacific', icon: '🛒' },
    { id: 4, title: 'New Fleet Manager joined', subtitle: '3 hours ago • Capt. Doran Chen', icon: '👤' },
  ]);

  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      try {
        const [usersResponse, catchesResponse, ordersResponse, paymentsResponse] = await Promise.all([
          api.get('/users'),
          api.get('/catches'),
          api.get('/orders'),
          api.get('/payments'),
        ]);

        const usersData = usersResponse.data || [];
        const catchesData = catchesResponse.data || [];
        const paymentsData = paymentsResponse.data || [];
        const ordersData = (ordersResponse.data || []).map(order => ({
          ...order,
          total_price: Number(order.total_price) || 0,
        }));

        setUsers(usersData);
        setCatches(catchesData);
        setOrders(ordersData);
        setPayments(paymentsData);

        const days = Array.from({ length: 7 }, (_, index) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - index));
          const key = date.toISOString().slice(0, 10);
          return { day: date.toLocaleDateString('en-US', { weekday: 'short' }), key, sales: 0 };
        });

        const salesMap = new Map(days.map(day => [day.key, day]));
        ordersData.forEach(order => {
          const key = new Date(order.created_at).toISOString().slice(0, 10);
          if (salesMap.has(key)) {
            salesMap.get(key).sales += order.total_price;
          }
        });

        setSalesData(Array.from(salesMap.values()));
      } catch (err) {
        console.error(err);
        setError('Unable to load data.');
      }
    }

    loadData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('fisher_token');
    localStorage.removeItem('fisher_role');
    navigate('/login');
  };

  const handleUserStatusChange = async (userId, newStatus) => {
    try {
      const response = await api.patch(`/users/${userId}/status`, { status: newStatus });
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.id === userId ? { ...u, status: response.data.status } : u
        )
      );
    } catch (err) {
      setError('Unable to update user status.');
      console.error(err);
    }
  };


  const handleVerifyPayment = async (paymentId, status) => {
    try {
      await api.patch(`/payments/${paymentId}/verify`, { status });
      setPayments(payments.map(p => p.id === paymentId ? { ...p, status } : p));
      
      // Update orders based on payment status
      if (status === 'verified') {
         setOrders(orders.map(o => o.id === payments.find(p => p.id === paymentId)?.order_id ? { ...o, status: 'processing', payment_status: 'paid' } : o));
      } else {
         setOrders(orders.map(o => o.id === payments.find(p => p.id === paymentId)?.order_id ? { ...o, status: 'cancelled', payment_status: 'failed' } : o));
      }
    } catch (err) {
      setError('Unable to verify payment.');
      console.error(err);
    }
  };

  const generateCSV = (headers, rows) => {
    const escape = (val) => {
      if (val === null || val === undefined) return '';
      const s = String(val);
      return `"${s.replace(/"/g, '""')}"`;
    };
    const headerLine = headers.join(',');
    const lines = rows.map(row => headers.map(h => escape(row[h])).join(','));
    return [headerLine, ...lines].join('\n');
  };

  const generateReport = () => {
    const sections = [];

    if (users && users.length) {
      const userHeaders = ['id', 'name', 'email', 'role', 'status', 'created_at'];
      const userRows = users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status || 'Active',
        created_at: u.created_at || u.createdAt || '',
      }));
      sections.push('Users');
      sections.push(generateCSV(userHeaders, userRows));
    }

    if (catches && catches.length) {
      const catchHeaders = ['id', 'fish_name', 'weight', 'price', 'location', 'created_at'];
      const catchRows = catches.map(c => ({
        id: c.id,
        fish_name: c.fish_name,
        weight: c.weight,
        price: c.price,
        location: c.location || '',
        created_at: c.created_at || c.catch_date || '',
      }));
      sections.push('Catches');
      sections.push(generateCSV(catchHeaders, catchRows));
    }

    if (orders && orders.length) {
      const orderHeaders = ['id', 'user_id', 'total_price', 'status', 'created_at'];
      const orderRows = orders.map(o => ({
        id: o.id,
        user_id: o.user_id || o.userId || '',
        total_price: o.total_price || o.totalPrice || 0,
        status: o.status || '',
        created_at: o.created_at || o.createdAt || '',
      }));
      sections.push('Orders');
      sections.push(generateCSV(orderHeaders, orderRows));
    }

    if (!sections.length) {
      alert('No data to generate report');
      return;
    }

    const content = sections.join('\n\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const ts = new Date().toISOString().slice(0,19).replace(/[:T]/g, '-');
    a.download = `fishmarket-report-${ts}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const totalRevenue = orders.reduce((sum, order) => sum + (Number(order.total_price) || 0), 0);
  const activeOrders = orders.filter(order => order.status && !['delivered', 'completed'].includes(order.status.toLowerCase()));

  return (
    <Layout activePage="admin" className="bg-gradient-to-br from-slate-300 to-cyan-300 dark:from-slate-900 dark:to-slate-800">
      <div className="p-4 md:p-8 w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">Admin Dashboard</h1>
            <p className="text-slate-700 dark:text-slate-300 mt-1">System overview and management</p>
          </div>
          <button onClick={generateReport} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-slate-800">
            📥 Generate Report
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 dark:text-slate-100 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Total Users</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">{users.length}</p>
            <p className="text-slate-600 dark:text-slate-400 text-xs mt-3">Active accounts</p>
          </div>

          <div className="bg-white dark:bg-slate-800 dark:text-slate-100 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Total Fishermen</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">{users.filter(u => u.role === 'fisherman').length}</p>
            <p className="text-slate-600 dark:text-slate-400 text-xs mt-3">Registered suppliers</p>
          </div>

          <div className="bg-white dark:bg-slate-800 dark:text-slate-100 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Total Buyers</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">{users.filter(u => u.role === 'customer').length}</p>
            <p className="text-slate-600 dark:text-slate-400 text-xs mt-3">Active customers</p>
          </div>

          <div className="bg-slate-900 rounded-2xl p-6 shadow-md">
            <p className="text-slate-400 text-xs font-semibold uppercase">Total Revenue</p>
            <p className="text-3xl font-bold text-white mt-2">${orders.reduce((sum, o) => sum + (o.total_price || 0), 0).toLocaleString()}</p>
            <p className="text-slate-400 text-xs mt-3">From all orders</p>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 dark:text-slate-100 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Total Catches</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">{catches.length}</p>
            <p className="text-slate-600 dark:text-slate-400 text-xs mt-3">Listings in system</p>
          </div>

          <div className="bg-white dark:bg-slate-800 dark:text-slate-100 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Total Orders</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">{orders.length}</p>
            <p className="text-slate-600 dark:text-slate-400 text-xs mt-3">All transactions</p>
          </div>

          <div className="bg-white dark:bg-slate-800 dark:text-slate-100 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Pending Orders</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">{orders.filter(o => o.status === 'pending').length}</p>
            <p className="text-slate-600 dark:text-slate-400 text-xs mt-3">Awaiting fulfillment</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Sales Analytics */}
          <div className="col-span-1 lg:col-span-2 bg-white dark:bg-slate-800 dark:text-slate-100 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Revenue Analytics (Last 7 Days)</h2>
            </div>

            {/* Revenue Chart */}
            <div className="flex items-end justify-around h-48 gap-2">
              {salesData.length > 0 ? (
                salesData.map((data, idx) => {
                  const maxRevenue = Math.max(...salesData.map(d => d.sales), 1);
                  return (
                    <div key={idx} className="flex flex-col items-center flex-1">
                      <div
                        className="bg-gradient-to-t from-cyan-400 to-cyan-300 rounded-t w-full"
                        style={{ height: `${(data.sales / maxRevenue) * 150}px`, minHeight: '10px' }}
                        title={`${data.day}: $${data.sales.toFixed(0)}`}
                      ></div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">{data.day}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        ${data.sales >= 1000 ? (data.sales / 1000).toFixed(1) + 'k' : data.sales.toFixed(0)}
                      </p>
                    </div>
                  );
                })
              ) : (
                <p className="text-slate-500 dark:text-slate-400 text-center w-full">No revenue data available</p>
              )}
            </div>
          </div>

          {/* System Activity */}
          <div className="bg-white dark:bg-slate-800 dark:text-slate-100 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">System Activity</h2>
            <div className="space-y-4">
              <div className="flex gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                <span className="text-2xl">👥</span>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Total Users</p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">{users.length} registered</p>
                </div>
              </div>
              <div className="flex gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                <span className="text-2xl">🎣</span>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Active Fishermen</p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">{users.filter(u => u.role === 'fisherman').length} suppliers</p>
                </div>
              </div>
              <div className="flex gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                <span className="text-2xl">📦</span>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Pending Orders</p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">{orders.filter(o => o.status === 'pending').length} awaiting</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-2xl">✅</span>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Completed Orders</p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">{orders.filter(o => ['completed', 'delivered'].includes(o.status)).length} delivered</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Management Table */}
        <div className="bg-white dark:bg-slate-800 dark:text-slate-100 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">User Management</h2>
            <div className="flex flex-wrap gap-3 w-full xl:w-auto">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or email..."
                className="flex-1 min-w-[200px] px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="fisherman">Fisherman</option>
                <option value="customer">Customer</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
               <button className=' bg-green-500 p-2 rounded-xl text-center text-white'
               onClick={()=>navigate('/register')}>Add to user</button>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-slate-700 dark:text-slate-300">
              <thead className="border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">USER</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">ROLE</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {users.filter((user) => {
                  const q = searchTerm.trim().toLowerCase();
                  if (q) {
                    const name = (user.name || '').toLowerCase();
                    const email = (user.email || '').toLowerCase();
                    if (!name.includes(q) && !email.includes(q)) return false;
                  }
                  if (roleFilter !== 'all' && (user.role || '').toLowerCase() !== roleFilter) return false;
                  if (statusFilter !== 'all' && (user.status || 'active').toLowerCase() !== statusFilter) return false;
                  return true;
                }).length > 0 ? (
                  users
                    .filter((user) => {
                      const q = searchTerm.trim().toLowerCase();
                      if (q) {
                        const name = (user.name || '').toLowerCase();
                        const email = (user.email || '').toLowerCase();
                        if (!name.includes(q) && !email.includes(q)) return false;
                      }
                      if (roleFilter !== 'all' && (user.role || '').toLowerCase() !== roleFilter) return false;
                      if (statusFilter !== 'all' && (user.status || 'active').toLowerCase() !== statusFilter) return false;
                      return true;
                    })
                    .map((user) => (
                    <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 dark:bg-slate-900">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{user.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 capitalize">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300">
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <select
                          value={user.status || 'active'}
                          onChange={(e) => handleUserStatusChange(user.id, e.target.value)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold border-0 cursor-pointer ${
                            user.status === 'active' || !user.status
                              ? 'bg-green-100 text-green-700'
                              : user.status === 'inactive'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="py-8 text-center text-slate-500 dark:text-slate-400">
                      {error || 'No users found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden flex flex-col gap-4 mt-4">
            {users.filter((user) => {
              const q = searchTerm.trim().toLowerCase();
              if (q) {
                const name = (user.name || '').toLowerCase();
                const email = (user.email || '').toLowerCase();
                if (!name.includes(q) && !email.includes(q)) return false;
              }
              if (roleFilter !== 'all' && (user.role || '').toLowerCase() !== roleFilter) return false;
              if (statusFilter !== 'all' && (user.status || 'active').toLowerCase() !== statusFilter) return false;
              return true;
            }).length > 0 ? (
              users
                .filter((user) => {
                  const q = searchTerm.trim().toLowerCase();
                  if (q) {
                    const name = (user.name || '').toLowerCase();
                    const email = (user.email || '').toLowerCase();
                    if (!name.includes(q) && !email.includes(q)) return false;
                  }
                  if (roleFilter !== 'all' && (user.role || '').toLowerCase() !== roleFilter) return false;
                  if (statusFilter !== 'all' && (user.status || 'active').toLowerCase() !== statusFilter) return false;
                  return true;
                })
                .map((user) => (
                  <div key={user.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-900/50 shadow-sm flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold shadow-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{user.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize">
                        {user.role}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</span>
                      <select
                        value={user.status || 'active'}
                        onChange={(e) => handleUserStatusChange(user.id, e.target.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border-0 cursor-pointer shadow-sm ${
                          user.status === 'active' || !user.status
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : user.status === 'inactive'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                  </div>
                ))
            ) : (
              <div className="py-8 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-xl">
                {error || 'No users found'}
              </div>
            )}
          </div>
        </div>

        {/* Payment Verifications Table */}
        <div className="bg-white dark:bg-slate-800 dark:text-slate-100 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Payment Verifications</h2>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-slate-700 dark:text-slate-300">
              <thead className="border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">ORDER ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">BUYER</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">AMOUNT</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">REF / PHONE</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">STATUS</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {payments.length > 0 ? (
                  payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-slate-100 hover:bg-slate-50 dark:bg-slate-900">
                      <td className="py-4 px-4 font-semibold text-slate-900 dark:text-slate-100">#{payment.order_id}</td>
                      <td className="py-4 px-4">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{payment.buyer_name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{payment.buyer_email}</p>
                      </td>
                      <td className="py-4 px-4 font-bold text-cyan-600">${Number(payment.amount).toFixed(2)}</td>
                      <td className="py-4 px-4">
                        <p className="text-sm font-mono text-slate-700 dark:text-slate-300">{payment.reference}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{payment.sender_phone}</p>
                      </td>
                      <td className="py-4 px-4 capitalize">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          payment.status === 'verified' ? 'bg-green-100 text-green-700' :
                          payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 space-x-2">
                        {payment.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleVerifyPayment(payment.id, 'verified')}
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-semibold"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleVerifyPayment(payment.id, 'rejected')}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-semibold"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-500 dark:text-slate-400">
                      No payments found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden flex flex-col gap-4 mt-4">
            {payments.length > 0 ? (
              payments.map((payment) => (
                <div key={payment.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-900/50 shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-700 pb-3">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">Order #{payment.order_id}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{payment.buyer_name} • {payment.buyer_email}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      payment.status === 'verified' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Amount</p>
                      <p className="font-bold text-cyan-600">${Number(payment.amount).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Ref / Phone</p>
                      <p className="font-mono text-slate-900 dark:text-slate-100 text-xs">{payment.reference}</p>
                      <p className="text-xs text-slate-500">{payment.sender_phone}</p>
                    </div>
                  </div>

                  {payment.status === 'pending' && (
                    <div className="flex gap-2 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => handleVerifyPayment(payment.id, 'verified')}
                        className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:text-green-400 py-2 rounded-lg text-sm font-bold transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleVerifyPayment(payment.id, 'rejected')}
                        className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 py-2 rounded-lg text-sm font-bold transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-xl">
                No payments found
              </div>
            )}
          </div>
        </div>

        {error && <p className="mt-8 text-sm text-red-600">{error}</p>}
      </div>
    </Layout>
  );
}

export default AdminPanel;
