import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
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
    async function loadOrders() {
      try {
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
        setError('Unable to load orders.');
        console.error(err);
      }
    }

    loadOrders();
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
          order.id === orderId ? { ...order, status: response.data.status } : order
        )
      );
    } catch (err) {
      setError('Unable to update order status.');
      console.error(err);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;

    const orderIdMatches = String(order.id).toLowerCase().includes(term);
    const statusMatches = order.status?.toLowerCase().includes(term);
    const itemMatches = order.items?.some((item) =>
      item.fish_name?.toLowerCase().includes(term)
    );
    const userIdMatches = String(order.user_id).toLowerCase().includes(term);

    return orderIdMatches || statusMatches || itemMatches || userIdMatches;
  });

  const totalOrders = orders.length;
  const pendingOrders = orders.filter((order) => order.status?.toLowerCase() === 'pending').length;
  const completedOrders = orders.filter((order) => ['delivered', 'completed'].includes(order.status?.toLowerCase())).length;
  const totalRevenue = orders.reduce((total, order) => total + (Number(order.total_price) || 0), 0).toFixed(2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex">
      {/* Sidebar */}
      <aside className="w-40 bg-slate-700 text-white p-6 shadow-xl flex flex-col">
        <h2 className="text-xl font-bold mb-8">MarisSync</h2>

        <nav className="space-y-1 mb-8 flex-1">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded w-full text-left text-sm ${
                isActive ? 'bg-slate-900 text-white' : 'text-slate-100 hover:bg-slate-600'
              }`
            }
          >
            <span>📊</span>
            <span>Dashboard</span>
          </NavLink>
          <NavLink
            to="/fisherman"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded w-full text-left text-sm ${
                isActive ? 'bg-slate-900 text-white' : 'text-slate-100 hover:bg-slate-600'
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
                isActive ? 'bg-slate-900 text-white' : 'text-slate-100 hover:bg-slate-600'
              }`
            }
          >
            <span>🛍️</span>
            <span>Market</span>
          </NavLink>
          <div className="flex items-center gap-3 px-4 py-2 rounded bg-cyan-600 text-white text-sm">
            <span>📦</span>
            <span>Orders</span>
          </div>
          {userRole === 'admin' && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2 rounded w-full text-left text-sm ${
                  isActive ? 'bg-slate-900 text-white' : 'text-slate-100 hover:bg-slate-600'
                }`
              }
            >
              <span>👨‍💼</span>
              <span>Admin Panel</span>
            </NavLink>
          )}
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded w-full text-left text-sm ${
                isActive ? 'bg-slate-900 text-white' : 'text-slate-100 hover:bg-slate-600'
              }`
            }
          >
            <span>📈</span>
            <span>Analytics</span>
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded w-full text-left text-sm ${
                isActive ? 'bg-slate-900 text-white' : 'text-slate-100 hover:bg-slate-600'
              }`
            }
          >
            <span>⚙️</span>
            <span>Settings</span>
          </NavLink>
        </nav>

        <div className="mb-6 border-t border-slate-600 pt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-semibold">
              E
            </div>
            <div>
              <p className="font-semibold text-sm">Capt. Elias</p>
              <p className="text-xs text-slate-400">Fisherman</p>
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
        {/* Breadcrumb */}
        <div className="mb-8 text-sm text-slate-600">
          <span>Operations</span>
          <span className="mx-2">/</span>
          <span className="font-semibold text-slate-900">Order Management</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">{pageTitle}</h1>
          <p className="text-slate-600 mt-2">{pageSubtitle}</p>
          {isFisherman && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              Only orders containing your own catch listings are shown here.
            </div>
          )}
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search orders by ID, item, status, or customer..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm"
            />
            <span className="absolute right-3 top-2.5 text-slate-400">🔍</span>
          </div>
          <button className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50">
            ☰ Filter
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <p className="text-slate-500 text-xs font-semibold uppercase">Total Orders</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{totalOrders}</p>
            <p className="text-slate-600 text-xs mt-3">Orders recorded in your account</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <p className="text-slate-500 text-xs font-semibold uppercase">Pending Orders</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{pendingOrders}</p>
            <p className="text-slate-600 text-xs mt-3">Awaiting fulfillment or approval</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <p className="text-slate-500 text-xs font-semibold uppercase">Completed Orders</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{completedOrders}</p>
            <p className="text-slate-600 text-xs mt-3">Orders marked delivered or completed</p>
          </div>

          <div className="bg-slate-900 rounded-2xl p-6 shadow-md">
            <p className="text-slate-400 text-xs font-semibold uppercase">Revenue</p>
            <p className="text-3xl font-bold text-white mt-2">${totalRevenue}</p>
            <p className="text-slate-400 text-xs mt-3">Real totals from recorded orders</p>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-900">Recent Orders</h2>
            <div className="flex gap-2">
              <button className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50">
                Export CSV
              </button>
              <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800" onClick={() => navigate('/market')}>
                New Order
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">ORDER ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">PRODUCT</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">COUNTERPARTY</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">STATUS</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">TOTAL PRICE</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-semibold text-slate-900">#{order.id}</p>
                          <p className="text-xs text-slate-500">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-slate-900">
                            {order.items?.[0]?.fish_name || 'Mixed catch'}
                          </span>
                          <span className="text-xs text-slate-500">
                            {order.items?.length > 1 ? `${order.items.length} items` : '1 item'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-semibold text-slate-900">Customer</p>
                          <p className="text-xs text-slate-500">ID: {order.user_id}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            order.status === 'delivered' || order.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : order.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : order.status === 'processing'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-900">${order.total_price}</td>
                      <td className="py-4 px-4 flex items-center gap-2">
                        {canManageOrders && order.status?.toLowerCase() !== 'completed' && order.status?.toLowerCase() !== 'delivered' ? (
                          <>
                            {order.status?.toLowerCase() === 'pending' ? (
                              <button
                                onClick={() => handleStatusUpdate(order.id, 'processing')}
                                className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold hover:bg-yellow-200"
                              >
                                Accept Order
                              </button>
                            ) : order.status?.toLowerCase() === 'processing' ? (
                              <button
                                onClick={() => handleStatusUpdate(order.id, 'completed')}
                                className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold hover:bg-green-200"
                              >
                                Complete Order
                              </button>
                            ) : null}
                          </>
                        ) : (
                          <span className="text-slate-500 text-xs">No actions</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-500">
                      No orders found. This page only shows orders you can access.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-6 flex justify-between items-center">
            <p className="text-xs text-slate-600">Showing 1-{filteredOrders.length} of {orders.length} orders</p>
            <div className="flex gap-1">
              <button className="px-2 py-1 rounded border border-slate-300 text-sm hover:bg-slate-50">
                ←
              </button>
              <button className="px-3 py-1 rounded bg-slate-900 text-white text-sm font-semibold">
                1
              </button>
              <button className="px-3 py-1 rounded border border-slate-300 text-sm hover:bg-slate-50">
                2
              </button>
              <button className="px-3 py-1 rounded border border-slate-300 text-sm hover:bg-slate-50">
                3
              </button>
              <button className="px-2 py-1 rounded border border-slate-300 text-sm hover:bg-slate-50">
                →
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-2 gap-8">
          {/* Logistics Forecast */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Logistics Forecast</h2>
            <p className="text-slate-600 text-sm mb-6">
              Predicted delivery windows based on current weather and port congestion.
            </p>
            <div className="bg-gradient-to-br from-slate-200 to-cyan-200 rounded-xl h-40 flex items-center justify-center mb-4">
              <button className="bg-white text-slate-900 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100">
                Live Logistics Map View
              </button>
            </div>
          </div>

          {/* Smart Contracts */}
          <div className="bg-gradient-to-br from-cyan-100 to-cyan-50 rounded-2xl p-6 shadow-sm border border-cyan-200">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Smart Contracts</h2>
                <p className="text-slate-600 text-sm">
                  95% of your secured with blockchain-verified smart contracts for automated payout.
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-cyan-500 flex items-center justify-center text-white text-lg">
                ⛓️
              </div>
            </div>
            <button className="w-full border-2 border-cyan-600 text-cyan-600 px-6 py-3 rounded-lg font-semibold hover:bg-cyan-50">
              View Ledger
            </button>
          </div>
        </div>

        {error && <p className="mt-8 text-sm text-red-600">{error}</p>}
      </main>
    </div>
  );
}

export default Orders;
