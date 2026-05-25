import { useNotification } from '../context/NotificationContext';

export function NotificationContainer() {
  const { notifications, removeNotification } = useNotification();

  const getTypeStyles = (type) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-500',
          icon: '✓',
          border: 'border-green-600',
        };
      case 'error':
        return {
          bg: 'bg-red-500',
          icon: '✕',
          border: 'border-red-600',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-500',
          icon: '⚠',
          border: 'border-yellow-600',
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-500',
          icon: 'ℹ',
          border: 'border-blue-600',
        };
    }
  };

  return (
    <div className="fixed top-4 right-4 space-y-3 z-50 pointer-events-none">
      {notifications.map((notif) => {
        const styles = getTypeStyles(notif.type);
        return (
          <div
            key={notif.id}
            className={`${styles.bg} text-white px-4 py-3 rounded-lg shadow-lg border-l-4 ${styles.border} animate-slideIn pointer-events-auto flex items-center gap-3 max-w-xs`}
          >
            <span className="font-bold text-lg">{styles.icon}</span>
            <span className="flex-1">{notif.message}</span>
            <button
              onClick={() => removeNotification(notif.id)}
              className="ml-4 font-bold hover:opacity-75 transition-opacity"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
