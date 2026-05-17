import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

function Settings() {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await api.get('/users/me');
        setUser(response.data);
      } catch (err) {
        setMessage('Unable to load settings.');
      }
    }

    loadProfile();
  }, []);

  const handleSave = () => {
    setMessage('Preferences saved locally.');
    setTimeout(() => setMessage(''), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
            <p className="text-slate-600 mt-1">Update your profile and app preferences.</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="text-slate-700 hover:text-cyan-600 font-medium"
          >
            ← Back
          </button>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          <section className="lg:col-span-1 bg-white rounded-3xl p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Account</h2>
            <div className="space-y-4 text-slate-700">
              <div>
                <p className="text-sm uppercase tracking-wide text-slate-500">Name</p>
                <p className="mt-1 text-lg font-semibold">{user?.name || 'Loading...'}</p>
              </div>
              <div>
                <p className="text-sm uppercase tracking-wide text-slate-500">Email</p>
                <p className="mt-1 text-lg font-semibold">{user?.email || 'Loading...'}</p>
              </div>
              <div>
                <p className="text-sm uppercase tracking-wide text-slate-500">Role</p>
                <p className="mt-1 text-lg font-semibold capitalize">{user?.role || 'N/A'}</p>
              </div>
            </div>
          </section>

          <section className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Preferences</h2>
                <p className="text-slate-500 mt-1">Manage your experience settings and notifications.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div>
                  <p className="font-semibold text-slate-900">Notifications</p>
                  <p className="text-sm text-slate-600">Receive updates about orders and market activity.</p>
                </div>
                <label className="inline-flex items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={notifications}
                    onChange={() => setNotifications(!notifications)}
                    className="h-5 w-5 rounded border-slate-300 text-cyan-600"
                  />
                  {notifications ? 'On' : 'Off'}
                </label>
              </div>

              <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div>
                  <p className="font-semibold text-slate-900">Dark Mode</p>
                  <p className="text-sm text-slate-600">Toggle the interface appearance.</p>
                </div>
                <label className="inline-flex items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={darkMode}
                    onChange={() => setDarkMode(!darkMode)}
                    className="h-5 w-5 rounded border-slate-300 text-cyan-600"
                  />
                  {darkMode ? 'Enabled' : 'Disabled'}
                </label>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="font-semibold text-slate-900">Security</p>
                <p className="text-sm text-slate-600 mt-2">Change your account password or enable two-factor authentication from the profile page.</p>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="mt-4 inline-flex items-center justify-center rounded-full bg-cyan-600 px-5 py-3 text-sm font-semibold text-white hover:bg-cyan-700"
                >
                  Manage security
                </button>
              </div>
            </div>

            {message && (
              <div className="mt-6 rounded-3xl bg-cyan-50 border border-cyan-100 p-4 text-sm text-cyan-700">
                {message}
              </div>
            )}

            <button
              onClick={handleSave}
              className="mt-8 rounded-3xl bg-slate-900 px-6 py-3 text-white font-semibold hover:bg-slate-800"
            >
              Save preferences
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Settings;
