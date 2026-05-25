import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useNotification } from '../context/NotificationContext';

function Settings() {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [message, setMessage] = useState('');
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', email: '' });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { notificationsEnabled, updateNotificationsEnabled } = useNotification();

  useEffect(() => {
    const storedTheme = localStorage.getItem('fisher_dark_mode');
    if (storedTheme !== null) {
      const enabled = storedTheme === 'true';
      setDarkMode(enabled);
      document.documentElement.classList.toggle('dark', enabled);
    }

    const storedNotifications = localStorage.getItem('fisher_notifications_enabled');
    if (storedNotifications !== null) {
      setNotifications(storedNotifications === 'true');
    } else {
      setNotifications(notificationsEnabled);
    }
  }, [notificationsEnabled]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('fisher_dark_mode', String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await api.get('/users/me');
        setUser(response.data);
        setProfileForm({ name: response.data.name, email: response.data.email });
      } catch (err) {
        setMessage('Unable to load settings.');
      }
    }

    loadProfile();
  }, []);

  const handleSavePreferences = () => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('fisher_dark_mode', String(darkMode));
    updateNotificationsEnabled(notifications);
    setMessage('Preferences saved successfully!');
    setTimeout(() => setMessage(''), 2500);
  };

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const response = await api.patch('/users/me/profile', {
        name: profileForm.name,
        email: profileForm.email
      });
      setUser(response.data);
      setMessage('Profile updated successfully!');
      setEditingProfile(false);
      setTimeout(() => setMessage(''), 2500);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 dark:text-slate-100 flex flex-col">
      <div className="bg-white dark:bg-slate-900 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Update your profile and app preferences.</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="text-slate-700 dark:text-slate-200 hover:text-cyan-600 font-medium"
          >
            ← Back
          </button>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          <section className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm">
            {!editingProfile ? (
              <>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Account</h2>
                <div className="space-y-4 text-slate-700 dark:text-slate-300">
                  <div>
                    <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">Name</p>
                    <p className="mt-1 text-lg font-semibold">{user?.name || 'Loading...'}</p>
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">Email</p>
                    <p className="mt-1 text-lg font-semibold">{user?.email || 'Loading...'}</p>
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">Role</p>
                    <p className="mt-1 text-lg font-semibold capitalize">{user?.role || 'N/A'}</p>
                  </div>
                  <button
                    onClick={() => setEditingProfile(true)}
                    className="mt-6 w-full rounded-full bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700"
                  >
                    Edit Profile
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Edit Profile</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={profileForm.name}
                      onChange={handleProfileInputChange}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={profileForm.email}
                      onChange={handleProfileInputChange}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="flex-1 rounded-full bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingProfile(false);
                        setProfileForm({ name: user.name, email: user.email });
                      }}
                      className="flex-1 rounded-full border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>

          <section className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Preferences</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your experience settings and notifications.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between rounded-3xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-5">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">Notifications</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Receive updates about orders and market activity.</p>
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

              <div className="flex items-center justify-between rounded-3xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-5">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">Dark Mode</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Toggle the interface appearance.</p>
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

              <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-5">
                <p className="font-semibold text-slate-900 dark:text-slate-100">Security</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Change your account password or enable two-factor authentication from the profile page.</p>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="mt-4 inline-flex items-center justify-center rounded-full bg-cyan-600 px-5 py-3 text-sm font-semibold text-white hover:bg-cyan-700"
                >
                  Manage security
                </button>
              </div>
            </div>

            {message && (
              <div className="mt-6 rounded-3xl bg-cyan-50 dark:bg-cyan-900/40 border border-cyan-100 dark:border-cyan-800 p-4 text-sm text-cyan-700 dark:text-cyan-200">
                {message}
              </div>
            )}

            {!editingProfile && (
              <button
                onClick={handleSavePreferences}
                className="mt-8 rounded-3xl bg-slate-900 px-6 py-3 text-white font-semibold hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
              >
                Save preferences
              </button>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default Settings;
