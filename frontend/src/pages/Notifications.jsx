import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import Layout from '../components/Layout';

export default function Notifications() {
  const { notificationsHistory, notifications, clearHistory, markNotificationRead } = useNotification();
  const navigate = useNavigate();

  const combined = useMemo(() => {
    const merged = [...(notificationsHistory || []), ...(notifications || [])];
    const uniqueById = new Map();

    merged.forEach((item) => {
      if (item && item.id != null && !uniqueById.has(item.id)) {
        uniqueById.set(item.id, item);
      }
    });

    return Array.from(uniqueById.values()).sort(
      (a, b) => new Date(b.created_at || b.time || 0) - new Date(a.created_at || a.time || 0)
    );
  }, [notificationsHistory, notifications]);

  const unreadNotifications = combined.filter((notification) => notification.is_read === false);
  const readNotifications = combined.filter((notification) => notification.is_read === true);
  const unreadCount = unreadNotifications.length;

  const formatTimestamp = (notification) => {
    const timestamp = notification.created_at || notification.time;
    return timestamp ? new Date(timestamp).toLocaleString() : '';
  };

  return (
    <Layout activePage="notifications" className="bg-slate-50 dark:bg-slate-950">
      <div className="p-4 md:p-8 w-full">
        {combined.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-slate-100 p-8 text-center text-slate-500 dark:text-slate-400">
          No notifications yet. Notifications will appear here when something important happens.
        </div>
      ) : (
        <div className="space-y-6">
          {unreadNotifications.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold">Unread</h2>
                <span className="text-sm text-slate-500 dark:text-slate-400">{unreadNotifications.length} new</span>
              </div>
              <div className="space-y-3">
                {unreadNotifications.map((notification) => (
                  <div key={notification.id} className="rounded-xl bg-white dark:bg-slate-800 dark:text-slate-100 p-4 shadow-sm border border-cyan-200">
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
                      <div className="space-y-2">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{notification.message}</p>
                        <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                          {notification.type && (
                            <span className="rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 px-2 py-1">{notification.type}</span>
                          )}
                          <span className="rounded-full bg-yellow-100 px-2 py-1 text-yellow-700">Unread</span>
                        </div>
                      </div>
                      <div className="text-right text-xs text-slate-400">
                        {formatTimestamp(notification)}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => markNotificationRead(notification.id)}
                        className="rounded bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-700 dark:bg-slate-950"
                      >
                        Mark as read
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {readNotifications.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-4 rounded-xl bg-white dark:bg-slate-800 dark:text-slate-100 p-4 border border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold">Earlier</h2>
                <span className="text-sm text-slate-500 dark:text-slate-400">{readNotifications.length} read</span>
              </div>
              <div className="space-y-3">
                {readNotifications.map((notification) => (
                  <div key={notification.id} className="rounded-xl bg-white dark:bg-slate-800 dark:text-slate-100 p-4 shadow-sm border border-slate-200 dark:border-slate-700 opacity-80">
                    <div className="flex justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{notification.message}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                          {notification.type && (
                            <span className="rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 px-2 py-1">{notification.type}</span>
                          )}
                          <span className="rounded-full bg-slate-100 dark:bg-slate-950 px-2 py-1 text-slate-500 dark:text-slate-400">Read</span>
                        </div>
                      </div>
                      <div className="text-right text-xs text-slate-400">
                        {formatTimestamp(notification)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
      </div>
    </Layout>
  );
}
