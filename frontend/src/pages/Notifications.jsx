import { useNotification } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

export default function Notifications() {
  const { notificationsHistory, notifications, clearHistory } = useNotification();
  const navigate = useNavigate();

  const combined = [...(notificationsHistory || []), ...(notifications || [])]
    .sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <div className="flex gap-2">
          <button onClick={() => navigate(-1)} className="px-3 py-1 rounded border">Back</button>
          <button onClick={clearHistory} className="px-3 py-1 rounded bg-red-500 text-white">Clear History</button>
        </div>
      </div>

      <div className="space-y-3">
        {combined.length === 0 && <p className="text-sm text-slate-500">No notifications yet.</p>}
        {combined.map((n) => (
          <div key={n.id + (n.time||'')} className="bg-white p-4 rounded shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">{n.message}</p>
                <p className="text-xs text-slate-500 mt-1">{n.type}</p>
              </div>
              <div className="text-xs text-slate-400">{n.time ? new Date(n.time).toLocaleString() : ''}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
