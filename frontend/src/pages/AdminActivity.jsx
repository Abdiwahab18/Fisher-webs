import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

export default function AdminActivity() {
  const [activity, setActivity] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function loadActivity() {
      try {
        const [ordersRes, catchesRes, usersRes] = await Promise.all([
          api.get('/orders'),
          api.get('/catches'),
          api.get('/users'),
        ]);

        const orders = (ordersRes.data || []).map(o => ({
          id: `order-${o.id}`,
          type: 'order',
          title: `Order #${o.id}`,
          subtitle: (o.total_price ? `$${Number(o.total_price).toFixed(2)}` : ''),
          time: o.created_at || o.updated_at,
        }));

        const catches = (catchesRes.data || []).map(c => ({
          id: `catch-${c.id}`,
          type: 'catch',
          title: c.fish_name || 'Catch',
          subtitle: `${Number(c.quantity || 0)} kg • ${c.location || 'Unknown'}`,
          time: c.created_at || c.catch_date,
        }));

        const users = (usersRes.data || []).map(u => ({
          id: `user-${u.id}`,
          type: 'user',
          title: u.name,
          subtitle: u.email,
          time: u.created_at || u.createdAt,
        }));

        const merged = [...orders, ...catches, ...users]
          .filter(item => item.time)
          .sort((a, b) => new Date(b.time) - new Date(a.time));

        setActivity(merged);
      } catch (err) {
        console.error(err);
        setError('Unable to load activity.');
      }
    }

    loadActivity();
  }, []);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">All Activity</h1>
        <div className="flex gap-2">
          <button onClick={() => navigate(-1)} className="px-3 py-1 rounded border">Back</button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <div className="space-y-3">
        {activity.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No activity found.</p>}
        {activity.map((item) => (
          <div key={item.id} className="bg-white dark:bg-slate-800 dark:text-slate-100 p-4 rounded shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.subtitle}</p>
              </div>
              <div className="text-xs text-slate-400">{new Date(item.time).toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
