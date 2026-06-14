import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';

export default function NotificationBell({ asNav = false }) {
  const navigate = useNavigate();
  const { notificationsHistory, notifications } = useNotification();

  const unreadCount = useMemo(() => {
    const seenIds = new Set();
    let count = 0;

    (notificationsHistory || []).forEach((n) => {
      if (n && n.id != null && n.is_read === false) {
        seenIds.add(n.id);
        count += 1;
      }
    });

    (notifications || []).forEach((n) => {
      if (n && n.id != null && n.is_read === false && !seenIds.has(n.id)) {
        count += 1;
      }
    });

    return count;
  }, [notificationsHistory, notifications]);

  if (asNav) {
    return (
      <button
        onClick={() => navigate('/notifications')}
        title="Notifications"
        className={`flex items-center gap-3 px-4 py-2 rounded w-full text-left text-sm ${unreadCount > 0 ? 'bg-slate-600 text-white' : 'text-slate-100 hover:bg-slate-600'}`}
      >
        <span className="relative inline-block">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 2a4 4 0 00-4 4v2.586L5.293 10.293A1 1 0 005 11v1h10v-1a1 1 0 00-.293-.707L14 8.586V6a4 4 0 00-4-4z" />
            <path d="M7 15a3 3 0 006 0H7z" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-red-600 rounded-full">{unreadCount}</span>
          )}
        </span>
        <span>Notifications</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => navigate('/notifications')}
        title="Notifications"
        className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-600 text-white"
      >
        <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 2a4 4 0 00-4 4v2.586L5.293 10.293A1 1 0 005 11v1h10v-1a1 1 0 00-.293-.707L14 8.586V6a4 4 0 00-4-4z" />
            <path d="M7 15a3 3 0 006 0H7z" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">{unreadCount}</span>
          )}
        </div>
        <span className="hidden sm:inline text-sm">Notifications</span>
      </button>
    </div>
  );
}
