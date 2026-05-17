import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('week');
  const [catches, setCatches] = useState([]);
  const [orders, setOrders] = useState([]);
  const [catchTrends, setCatchTrends] = useState([]);
  const [recentCatches, setRecentCatches] = useState([]);
  const [realTimeFeed, setRealTimeFeed] = useState([]);
  const navigate = useNavigate();
  const userRole = localStorage.getItem('fisher_role');
  const isAdmin = userRole === 'admin';

  useEffect(() => {
    if (userRole === 'admin') {
      navigate('/admin');
    }
  }, [userRole, navigate]);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [profileRes, catchesRes, ordersRes] = await Promise.all([
          api.get('/users/me'),
          api.get(isAdmin ? '/catches' : '/catches/my-catches'),
          api.get(isAdmin ? '/orders' : '/orders/my-orders'),
        ]);

        const profile = profileRes.data;
        const catchesData = (catchesRes.data || []).map(item => ({
          ...item,
          quantity: Number(item.quantity) || 0,
          price: Number(item.price) || 0,
        }));
        const ordersData = (ordersRes.data || []).map(item => ({
          ...item,
          total_price: Number(item.total_price) || 0,
        }));

        setUser(profile);
        setCatches(catchesData);
        setOrders(ordersData);

        const recent = catchesData
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5)
          .map((item, index) => ({
            id: item.id || index,
            species: item.fish_name,
            weight: `${item.quantity.toFixed(2)} kg`,
            location: item.location || 'Unknown',
            time: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'LISTED',
            icon: '🐟',
          }));

        setRecentCatches(recent);

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
            trendMap.get(key).value += item.quantity;
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
            subtitle: `${newestCatch.fish_name} • ${newestCatch.quantity.toFixed(2)} kg`,
            time: getRelativeTime(newestCatch.created_at),
            icon: '🐟',
          });
        }
        if (!feed.length) {
          feed.push({
            id: 'empty',
            title: 'Waiting for new data',
            subtitle: 'No catches or orders have been logged yet.',
            time: '—',
            icon: '📡',
          });
        }

        setRealTimeFeed(feed);
      } catch (err) {
        setError('Unable to load dashboard data.');
        console.error(err);
      }
    }

    loadDashboard();
  }, [isAdmin]);

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

  const totalCatchWeight = catches.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const totalRevenue = orders.reduce((sum, item) => sum + (Number(item.total_price) || 0), 0);
  const dailySales = orders
    .filter(order => new Date(order.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000))
    .reduce((sum, item) => sum + (Number(item.total_price) || 0), 0);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-300 to-cyan-300 flex">
      {/* Sidebar */}
      <aside className="w-40 bg-slate-700 text-white p-6 shadow-xl flex flex-col">
        <h2 className="text-xl font-bold mb-8">MarisSync</h2>
        
        <nav className="space-y-1 mb-8 flex-1">
          <div className="flex items-center gap-3 px-4 py-2 rounded bg-cyan-600 text-white text-sm">
            <span>📊</span>
            <span>Dashboard</span>
          </div>
          
          {/* Catches - Fisherman + Admin only */}
          {(userRole === 'fisherman' || userRole === 'admin') && (
            <button
              onClick={() => navigate('/fisherman')}
              className="flex items-center gap-3 px-4 py-2 rounded hover:bg-slate-600 w-full text-left text-sm"
            >
              <span>🎣</span>
              <span>Catches</span>
            </button>
          )}
          
          {/* Market - All authenticated users */}
          <button
            onClick={() => navigate('/market')}
            className="flex items-center gap-3 px-4 py-2 rounded hover:bg-slate-600 w-full text-left text-sm"
          >
            <span>🛍️</span>
            <span>Market</span>
          </button>
          
          {/* Orders - All authenticated users */}
          <button
            onClick={() => navigate('/orders')}
            className="flex items-center gap-3 px-4 py-2 rounded hover:bg-slate-600 w-full text-left text-sm"
          >
            <span>📦</span>
            <span>Orders</span>
          </button>
          
          {/* Admin Panel - Admin only */}
          {userRole === 'admin' && (
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center gap-3 px-4 py-2 rounded hover:bg-slate-600 w-full text-left text-sm"
            >
              <span>👨‍💼</span>
              <span>Admin Panel</span>
            </button>
          )}
          
          {/* Settings - All authenticated users */}
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-3 px-4 py-2 rounded hover:bg-slate-600 w-full text-left text-sm"
          >
            <span>⚙️</span>
            <span>Settings</span>
          </button>
        </nav>

        {/* User Section */}
        <div className="mb-6 border-t border-slate-600 pt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-semibold">
              {user?.name?.charAt(0) || 'E'}
            </div>
            <div>
              <p className="font-semibold text-sm">{user?.name || 'Captain'}</p>
              <p className="text-xs text-slate-400">{user?.role || 'Fisherman'}</p>
            </div>
          </div>

          <button className="w-full bg-cyan-500 text-slate-900 font-semibold py-2 rounded-lg text-sm hover:bg-cyan-400">
            + Log Catch
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="w-full text-slate-300 hover:text-white text-sm text-left px-4 py-2 rounded hover:bg-slate-600"
        >
          🚪 Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Fleet Overview</h1>
            <p className="text-slate-700 mt-1">Good morning, {greetingName}. Here is your latest fleet and sales summary.</p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-2 shadow">
              <span>🔔</span>
              <span className="text-sm font-semibold">{newOrdersCount} New Orders</span>
            </div>
            <div className="text-slate-700 text-sm">
              📅 {currentDateString}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 shadow-md">
            <div className="flex justify-between items-start mb-3">
              <p className="text-slate-500 text-xs font-semibold">TOTAL FISH CATCH</p>
              <span className="text-xl">🎣</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{totalCatchWeight.toFixed(2)}</span>
              <span className="text-xs font-semibold">kg</span>
            </div>
            <p className="text-slate-500 text-xs font-semibold mt-2">Across {catches.length} logged catches</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-md">
            <div className="flex justify-between items-start mb-3">
              <p className="text-slate-500 text-xs font-semibold">DAILY SALES</p>
              <span className="text-xl">💰</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-slate-900">${dailySales.toFixed(2)}</span>
            </div>
            <p className="text-slate-500 text-xs font-semibold mt-2">Last 24 hours</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-md">
            <div className="flex justify-between items-start mb-3">
              <p className="text-slate-500 text-xs font-semibold">REVENUE</p>
              <span className="text-xl">📊</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">${totalRevenue.toFixed(2)}</span>
            </div>
            <p className="text-slate-500 text-xs font-semibold mt-2">Based on {orders.length} orders</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-md">
            <div className="flex justify-between items-start mb-3">
              <p className="text-slate-500 text-xs font-semibold">ACTIVE ORDERS</p>
              <span className="text-xl">📦</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-slate-900">{activeOrdersCount}</span>
            </div>
            <span className="text-cyan-600 text-xs font-semibold mt-2 inline-block bg-cyan-100 px-2 py-1 rounded">Open</span>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Catch Trends */}
          <div className="col-span-2 bg-white rounded-2xl p-6 shadow-md">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Catch Trends</h2>
                <p className="text-xs text-slate-500 mt-1">Weekly performance by species</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('week')}
                  className={`px-3 py-1 rounded text-xs font-semibold ${
                    activeTab === 'week'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setActiveTab('month')}
                  className={`px-3 py-1 rounded text-xs font-semibold ${
                    activeTab === 'month'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                  <p className="text-xs text-slate-600 mt-3 font-medium">{data.day}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time Feed */}
          <div className="bg-white rounded-2xl p-6 shadow-md">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Real-time Feed</h2>
            <div className="space-y-4">
              {realTimeFeed.map((item) => (
                <div key={item.id} className="flex gap-3 pb-4 border-b border-slate-200 last:border-b-0">
                  <span className="text-2xl flex-shrink-0">{item.icon}</span>
                  <div className="flex-1 text-sm">
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{item.subtitle}</p>
                    <p className="text-xs text-slate-400 mt-1">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 text-cyan-600 text-sm font-semibold hover:text-cyan-700">
              View All Notifications
            </button>
          </div>
        </div>

        {/* Recent Catches */}
        <div className="bg-white rounded-2xl p-6 shadow-md mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Recent Catches</h2>
            <div className="flex gap-3">
              <button className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50">
                🔽 Filter
              </button>
              <button className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50">
                📥 Export
              </button>
              <button className="px-4 py-2 bg-cyan-500 text-white rounded-lg text-sm font-semibold hover:bg-cyan-600">
                + NEW CATCH REPORT
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">SPECIES</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">WEIGHT</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">LOCATION</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">TIME</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {recentCatches.map((catch_) => (
                  <tr key={catch_.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{catch_.icon}</span>
                        <span className="font-semibold text-slate-900">{catch_.species}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-700">{catch_.weight}</td>
                    <td className="py-4 px-4 text-slate-700">{catch_.location}</td>
                    <td className="py-4 px-4 text-slate-700">{catch_.time}</td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          catch_.status === 'VERIFIED'
                            ? 'bg-green-100 text-green-700'
                            : catch_.status === 'PROCESSING'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {catch_.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </main>
    </div>
  );
}

export default Dashboard;
