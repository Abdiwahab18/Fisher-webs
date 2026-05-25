import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [catches, setCatches] = useState([]);
  const [orders, setOrders] = useState([]);
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
        const [usersResponse, catchesResponse, ordersResponse] = await Promise.all([
          api.get('/users'),
          api.get('/catches'),
          api.get('/orders'),
        ]);

        const usersData = usersResponse.data || [];
        const catchesData = catchesResponse.data || [];
        const ordersData = (ordersResponse.data || []).map(order => ({
          ...order,
          total_price: Number(order.total_price) || 0,
        }));

        setUsers(usersData);
        setCatches(catchesData);
        setOrders(ordersData);

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

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user? This action cannot be undone.')) return;

    try {
      await api.delete(`/users/${id}`);
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete user.');
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
      const catchHeaders = ['id', 'fish_name', 'quantity', 'price', 'location', 'created_at'];
      const catchRows = catches.map(c => ({
        id: c.id,
        fish_name: c.fish_name,
        quantity: c.quantity,
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
    a.download = `marissync-report-${ts}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const totalRevenue = orders.reduce((sum, order) => sum + (Number(order.total_price) || 0), 0);
  const activeOrders = orders.filter(order => order.status && !['delivered', 'completed'].includes(order.status.toLowerCase()));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-400 to-cyan-400 flex">
      {/* Sidebar */}
      <aside className="w-40 bg-slate-700 text-white p-6 shadow-xl">
        <h2 className="text-xl font-bold mb-8">MarisSync</h2>
        
        <nav className="space-y-2 mb-8">
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded w-full text-left text-sm ${
                isActive ? 'bg-cyan-500 text-white' : 'text-slate-100 hover:bg-slate-600'
              }`
            }
          >
            <span>📊</span>
            <span className="text-sm">Overview</span>
          </NavLink>
          <NavLink
            to="/fisherman"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded w-full text-left text-sm ${
                isActive ? 'bg-cyan-500 text-white' : 'text-slate-100 hover:bg-slate-600'
              }`
            }
          >
            <span>🎣</span>
            <span>Catches</span>
          </NavLink>
          <NavLink
            to="/market"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded w-full text-left text-sm ${
                isActive ? 'bg-cyan-500 text-white' : 'text-slate-100 hover:bg-slate-600'
              }`
            }
          >
            <span>🛍️</span>
            <span>Market</span>
          </NavLink>
          <NavLink
            to="/orders"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded w-full text-left text-sm ${
                isActive ? 'bg-cyan-500 text-white' : 'text-slate-100 hover:bg-slate-600'
              }`
            }
          >
            <span>📦</span>
            <span>Orders</span>
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded w-full text-left text-sm ${
                isActive ? 'bg-cyan-500 text-white' : 'text-slate-100 hover:bg-slate-600'
              }`
            }
          >
            <span>⚙️</span>
            <span>Settings</span>
          </NavLink>
        </nav>

        <button className="w-full bg-cyan-500 text-slate-900 font-semibold py-2 rounded-lg mb-8 text-sm hover:bg-cyan-400">
          🎣 Log Catch
        </button>

        <div className="border-t border-slate-600 pt-4 space-y-2">
          <button className="flex items-center gap-3 px-4 py-2 rounded hover:bg-slate-600 w-full text-left text-sm">
            <span>❓</span>
            <span>Support</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 rounded hover:bg-slate-600 w-full text-left text-sm"
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-slate-700 mt-1">System overview and management</p>
          </div>
          <button onClick={generateReport} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-slate-800">
            📥 Generate Report
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <p className="text-slate-500 text-xs font-semibold uppercase">Total Users</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{users.length}</p>
            <p className="text-slate-600 text-xs mt-3">Active accounts</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <p className="text-slate-500 text-xs font-semibold uppercase">Total Fishermen</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{users.filter(u => u.role === 'fisherman').length}</p>
            <p className="text-slate-600 text-xs mt-3">Registered suppliers</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <p className="text-slate-500 text-xs font-semibold uppercase">Total Buyers</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{users.filter(u => u.role === 'customer').length}</p>
            <p className="text-slate-600 text-xs mt-3">Active customers</p>
          </div>

          <div className="bg-slate-900 rounded-2xl p-6 shadow-md">
            <p className="text-slate-400 text-xs font-semibold uppercase">Total Revenue</p>
            <p className="text-3xl font-bold text-white mt-2">${orders.reduce((sum, o) => sum + (o.total_price || 0), 0).toLocaleString()}</p>
            <p className="text-slate-400 text-xs mt-3">From all orders</p>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <p className="text-slate-500 text-xs font-semibold uppercase">Total Catches</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{catches.length}</p>
            <p className="text-slate-600 text-xs mt-3">Listings in system</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <p className="text-slate-500 text-xs font-semibold uppercase">Total Orders</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{orders.length}</p>
            <p className="text-slate-600 text-xs mt-3">All transactions</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <p className="text-slate-500 text-xs font-semibold uppercase">Pending Orders</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">{orders.filter(o => o.status === 'pending').length}</p>
            <p className="text-slate-600 text-xs mt-3">Awaiting fulfillment</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Sales Analytics */}
          <div className="col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-slate-900">Revenue Analytics (Last 7 Days)</h2>
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
                      <p className="text-xs text-slate-600 mt-2">{data.day}</p>
                      <p className="text-xs text-slate-500">${(data.sales / 1000).toFixed(1)}k</p>
                    </div>
                  );
                })
              ) : (
                <p className="text-slate-500 text-center w-full">No revenue data available</p>
              )}
            </div>
          </div>

          {/* System Activity */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">System Activity</h2>
            <div className="space-y-4">
              <div className="flex gap-3 pb-3 border-b border-slate-200">
                <span className="text-2xl">👥</span>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 text-sm">Total Users</p>
                  <p className="text-slate-500 text-xs">{users.length} registered</p>
                </div>
              </div>
              <div className="flex gap-3 pb-3 border-b border-slate-200">
                <span className="text-2xl">🎣</span>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 text-sm">Active Fishermen</p>
                  <p className="text-slate-500 text-xs">{users.filter(u => u.role === 'fisherman').length} suppliers</p>
                </div>
              </div>
              <div className="flex gap-3 pb-3 border-b border-slate-200">
                <span className="text-2xl">📦</span>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 text-sm">Pending Orders</p>
                  <p className="text-slate-500 text-xs">{orders.filter(o => o.status === 'pending').length} awaiting</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-2xl">✅</span>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 text-sm">Completed Orders</p>
                  <p className="text-slate-500 text-xs">{orders.filter(o => ['completed', 'delivered'].includes(o.status)).length} delivered</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Management Table */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-slate-900">User Management</h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or email..."
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm"
              />

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="fisherman">Fisherman</option>
                <option value="customer">Customer</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-slate-700">
              <thead className="border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">USER</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">ROLE</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">STATUS</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">ACTIONS</th>
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
                    <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{user.name}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 capitalize">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
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
                      <td className="py-4 px-4 space-x-2">
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-500 hover:text-red-700 text-sm font-semibold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-500">
                      {error || 'No users found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {error && <p className="mt-8 text-sm text-red-600">{error}</p>}
      </main>
    </div>
  );
}

export default AdminPanel;
