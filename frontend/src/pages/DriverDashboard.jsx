import React, { useEffect, useState, useCallback, useRef } from 'react';
import api from '../api/axiosConfig';
import Layout from '../components/Layout';
import { useNotification } from '../context/NotificationContext';

function DriverDashboard() {
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  const { notificationsHistory } = useNotification();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch current user details
      const userRes = await api.get('/users/me');
      setUser(userRes.data);

      // Fetch my deliveries (assigned to me)
      const myDeliveriesRes = await api.get('/orders/my-deliveries');
      const rawMyDeliveries = myDeliveriesRes.data || [];

      // Load items for my deliveries
      const myWithItems = await Promise.all(
        rawMyDeliveries.map(async (order) => {
          try {
            const itemsRes = await api.get(`/orders/${order.id}/items`);
            return { ...order, items: itemsRes.data || [] };
          } catch {
            return { ...order, items: [] };
          }
        })
      );

      setMyDeliveries(myWithItems);
    } catch (err) {
      console.error('Error loading driver dashboard data:', err);
      setError('Unable to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reload when notifications count changes (for real-time updates)
  const prevNotifCount = useRef((notificationsHistory || []).length);
  useEffect(() => {
    const curr = (notificationsHistory || []).length;
    if (curr > prevNotifCount.current) {
      loadData();
    }
    prevNotifCount.current = curr;
  }, [notificationsHistory, loadData]);

  const handleUpdateStatus = async (orderId, newDeliveryStatus) => {
    try {
      await api.patch(`/orders/${orderId}/delivery-status`, {
        delivery_status: newDeliveryStatus,
      });
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update delivery status.');
      console.error('Error updating delivery status:', err);
    }
  };

  // Stats calculation
  const totalCompleted = myDeliveries.filter(
    (d) => d.delivery_status === 'delivered'
  ).length;
  const activeDeliveries = myDeliveries.filter(
    (d) => d.delivery_status !== 'delivered'
  );
  const activeCount = activeDeliveries.length;

  // HSL visual status mappings
  const getStatusBadge = (status, deliveryStatus) => {
    if (deliveryStatus === 'delivered') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400">
          Delivered
        </span>
      );
    }
    if (deliveryStatus === 'picked_up') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
          Out for Delivery
        </span>
      );
    }
    if (deliveryStatus === 'assigned') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400">
          Assigned
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400">
        Ready for Pickup
      </span>
    );
  };

  return (
    <Layout activePage="dashboard" className="bg-gradient-to-br from-slate-300 to-cyan-300 dark:from-slate-900 dark:to-slate-800">
      <div className="p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">Driver Hub</h1>
            <p className="text-slate-700 dark:text-slate-300 mt-1">
              Welcome back, {user?.name?.split(' ')[0] || 'Courier'}. Manage your delivery routes and job list.
            </p>
          </div>
          <div className="text-slate-700 dark:text-slate-300 text-sm font-semibold">
            🚚 Active Deliveries: {activeCount}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 dark:text-slate-100 rounded-2xl p-5 shadow-md border-l-4 border-blue-500">
            <div className="flex justify-between items-start mb-3">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Active Routes</p>
              <span className="text-xl">📍</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">{activeCount}</span>
              <span className="text-xs text-slate-500 font-medium">in progress</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 dark:text-slate-100 rounded-2xl p-5 shadow-md border-l-4 border-green-500">
            <div className="flex justify-between items-start mb-3">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Completed Deliveries</p>
              <span className="text-xl">✅</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">{totalCompleted}</span>
              <span className="text-xs text-slate-500 font-medium">total packages</span>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Main Content Area */}
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-500"></div>
          </div>
        ) : (
          /* My Deliveries View */
          myDeliveries.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 dark:text-slate-100 rounded-2xl p-8 text-center shadow-md">
              <p className="text-slate-500 dark:text-slate-400">You have no assigned deliveries. The fisherman will assign delivery jobs to you.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {myDeliveries.map((order) => (
                <div
                  key={order.id}
                  className="bg-white dark:bg-slate-800 dark:text-slate-100 rounded-2xl p-6 shadow-md border border-slate-100 dark:border-slate-700"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 pb-4 border-b border-slate-100 dark:border-slate-700">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-900 dark:text-slate-100">Order #{order.id}</span>
                        {getStatusBadge(order.status, order.delivery_status)}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Accepted: {new Date(order.updated_at || order.created_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-semibold text-slate-500 uppercase">Order Value</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        ${Number(order.total_price || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Recipient</p>
                      <p className="text-sm font-bold">{order.customer_name || 'Anonymous'}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        📍 {order.delivery_info || 'No address specified'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Catches Package</p>
                      <ul className="space-y-1">
                        {order.items?.map((item) => (
                          <li key={item.id} className="text-sm text-slate-700 dark:text-slate-300">
                            🐟 {item.fish_name} ({item.weight} kg)
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Actions Panel */}
                    <div className="flex flex-col justify-center">
                      {order.delivery_status === 'assigned' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'picked_up')}
                          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow"
                        >
                          Mark as Picked Up
                        </button>
                      )}
                      {order.delivery_status === 'picked_up' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'delivered')}
                          className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition shadow"
                        >
                          Mark as Delivered
                        </button>
                      )}
                      {order.delivery_status === 'delivered' && (
                        <div className="text-center py-2 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 rounded-xl font-semibold text-sm">
                          ✓ Delivery Completed
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </Layout>
  );
}

export default DriverDashboard;
