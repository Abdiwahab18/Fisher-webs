import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [catches, setCatches] = useState([]);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [salesData, setSalesData] = useState([
    { day: 'Mon', sales: 4000 },
    { day: 'Tue', sales: 3000 },
    { day: 'Wed', sales: 2000 },
    { day: 'Thu', sales: 2780 },
    { day: 'Fri', sales: 1890 },
    { day: 'Sat', sales: 2390 },
    { day: 'Sun', sales: 3490 },
  ]);

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
            <h1 className="text-4xl font-bold text-slate-900">Fleet Overview</h1>
            <p className="text-slate-700 mt-1">Real-time monitoring</p>
          </div>
          <button className="bg-slate-900 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-slate-800">
            📥 Generate Report
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-md">
            <p className="text-slate-500 text-sm font-semibold">TOTAL USERS</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-bold text-slate-900">{users.length}</span>
              <span className="text-green-500 text-sm">+{users.length > 0 ? Math.floor(Math.random() * 20) + 5 : 0}%</span>
            </div>
            <div className="h-1 bg-cyan-500 rounded-full mt-3"></div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-md">
            <p className="text-slate-500 text-sm font-semibold">TOTAL CATCHES</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-bold text-slate-900">{catches.length}</span>
              <span className="text-green-500 text-sm">+{catches.length > 0 ? Math.floor(Math.random() * 15) + 3 : 0}%</span>
            </div>
            <div className="h-1 bg-cyan-500 rounded-full mt-3"></div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-md">
            <p className="text-slate-500 text-sm font-semibold">TOTAL REVENUE</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-bold text-slate-900">
                ${catches.reduce((total, catch_) => total + (catch_.quantity * catch_.price), 0).toLocaleString()}
              </span>
              <span className="text-green-500 text-sm">+{catches.length > 0 ? Math.floor(Math.random() * 25) + 10 : 0}%</span>
            </div>
            <div className="h-1 bg-cyan-500 rounded-full mt-3"></div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Sales Analytics */}
          <div className="col-span-2 bg-white rounded-2xl p-6 shadow-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-slate-900">Sales Analytics</h2>
              <select className="text-sm border border-slate-300 rounded px-3 py-1 text-slate-600">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
              </select>
            </div>

            {/* Simple Chart */}
            <div className="flex items-end justify-around h-48 gap-2">
              {salesData.map((data) => (
                <div key={data.day} className="flex flex-col items-center">
                  <div
                    className="bg-gradient-to-t from-cyan-400 to-cyan-300 rounded-t w-12"
                    style={{ height: `${(data.sales / 4000) * 150}px` }}
                  ></div>
                  <p className="text-xs text-slate-600 mt-2">{data.day}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl p-6 shadow-md">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {orders.slice(0, 4).map((order) => (
                <div key={order.id} className="flex gap-3 pb-3 border-b border-slate-200 last:border-b-0">
                  <span className="text-xl">🛒</span>
                  <div className="flex-1 text-sm">
                    <p className="font-semibold text-slate-900">Order #{order.id}</p>
                    <p className="text-slate-500 text-xs">{order.status || 'pending'} • ${order.total_price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
              {orders.length === 0 && (
                <p className="text-slate-500 text-sm">No recent orders yet.</p>
              )}
            </div>
            <button className="w-full mt-4 text-cyan-600 text-sm font-semibold hover:text-cyan-700">
              View All Activity →
            </button>
          </div>
        </div>

        {/* User Management Table */}
        <div className="bg-white rounded-2xl p-6 shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-slate-900">User Management</h2>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Search users..."
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm"
              />
              <button className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50">
                🔽 Filter
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-slate-700">
              <thead className="border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">USER</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">ROLE</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">STATUS</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">RECENT ACTIVITY</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{user.name}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 capitalize">{user.role}</td>
                      <td className="py-4 px-4">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-700">
                          {user.status || 'Active'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-600">---</td>
                      <td className="py-4 px-4">
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
                    <td colSpan="5" className="py-8 text-center text-slate-500">
                      {error || 'No users found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {users.length > 0 && (
            <div className="mt-4 flex justify-between items-center text-xs text-slate-600">
              <p>Showing 1-{users.length} of {users.length} users</p>
              <div className="flex gap-2">
                <button className="px-2 py-1 rounded hover:bg-slate-100">←</button>
                <button className="px-2 py-1 rounded hover:bg-slate-100">→</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminPanel;
