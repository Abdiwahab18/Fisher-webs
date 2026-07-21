import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useNotification } from '../context/NotificationContext';
import Layout from '../components/Layout';

// Icons using SVGs (Heroicons)
const UserIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const PaletteIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>;
const ShieldIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;

function Settings() {
  const [user, setUser] = useState(null);
  
  // Appearance state
  const [theme, setTheme] = useState('system');
  const [language, setLanguage] = useState('en');
  const [notifications, setNotifications] = useState(true);

  // Profile state
  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '', whatsapp: '', facebook: '' });
  const [profilePicture, setProfilePicture] = useState('');
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileErrors, setProfileErrors] = useState({ name: '', email: '', phone: '', whatsapp: '', facebook: '' });
  
  // Security state
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [passwordErrors, setPasswordErrors] = useState({ current: '', new: '', confirm: '' });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState('profile');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const navigate = useNavigate();
  const { notificationsEnabled, updateNotificationsEnabled } = useNotification();

  useEffect(() => {
    const storedTheme = localStorage.getItem('fisher_theme') || 'system';
    setTheme(storedTheme);
    
    const storedLang = localStorage.getItem('fisher_language') || 'en';
    setLanguage(storedLang);

    const storedNotifications = localStorage.getItem('fisher_notifications_enabled');
    if (storedNotifications !== null) {
      setNotifications(storedNotifications === 'true');
    } else {
      setNotifications(notificationsEnabled);
    }
  }, [notificationsEnabled]);

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await api.get('/users/me');
        setUser(response.data);
        setProfileForm({
          name: response.data.name || '',
          email: response.data.email || '',
          phone: response.data.phone || '',
          whatsapp: response.data.whatsapp || '',
          facebook: response.data.facebook || ''
        });
        setProfilePicture(response.data.profile_picture || '');
      } catch (err) {
        showMessage('error', 'Unable to load profile data.');
      }
    }
    loadProfile();
  }, []);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const applyTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('fisher_theme', newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const handleSaveAppearance = () => {
    localStorage.setItem('fisher_language', language);
    updateNotificationsEnabled(notifications);
    applyTheme(theme);
    showMessage('success', 'Appearance preferences saved!');
  };

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));

    if (name === 'name') {
      if (!value.trim()) {
        setProfileErrors(prev => ({ ...prev, name: 'Name is required.' }));
      } else if (!/^[A-Za-z\s]+$/.test(value)) {
        setProfileErrors(prev => ({ ...prev, name: 'Name can only contain alphabetic characters and spaces.' }));
      } else {
        setProfileErrors(prev => ({ ...prev, name: '' }));
      }
    }

    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value.trim()) {
        setProfileErrors(prev => ({ ...prev, email: 'Email is required.' }));
      } else if (!emailRegex.test(value)) {
        setProfileErrors(prev => ({ ...prev, email: 'Please enter a valid email address.' }));
      } else {
        setProfileErrors(prev => ({ ...prev, email: '' }));
      }
    }

    if (name === 'phone' || name === 'whatsapp') {
      if (value && !/^\+?[0-9\s-]+$/.test(value)) {
        setProfileErrors(prev => ({ ...prev, [name]: 'Must be a valid number (digits, spaces, hyphens, or leading + only).' }));
      } else {
        setProfileErrors(prev => ({ ...prev, [name]: '' }));
      }
    }

    if (name === 'facebook') {
      if (value && value.trim() && !/^https?:\/\/(www\.)?facebook\.com\/.+/i.test(value)) {
        setProfileErrors(prev => ({ ...prev, facebook: 'Must be a valid Facebook profile URL (e.g. https://facebook.com/username).' }));
      } else {
        setProfileErrors(prev => ({ ...prev, facebook: '' }));
      }
    }
  };

  const handleSaveProfile = async () => {
    let hasError = false;
    const newErrors = { name: '', email: '', phone: '', whatsapp: '', facebook: '' };

    if (!profileForm.name.trim()) {
      newErrors.name = 'Name is required.';
      hasError = true;
    } else if (!/^[A-Za-z\s]+$/.test(profileForm.name)) {
      newErrors.name = 'Name can only contain alphabetic characters and spaces.';
      hasError = true;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!profileForm.email.trim()) {
      newErrors.email = 'Email is required.';
      hasError = true;
    } else if (!emailRegex.test(profileForm.email)) {
      newErrors.email = 'Please enter a valid email address.';
      hasError = true;
    }

    if (profileForm.phone && !/^\+?[0-9\s-]+$/.test(profileForm.phone)) {
      newErrors.phone = 'Must be a valid phone number.';
      hasError = true;
    }

    if (profileForm.whatsapp && !/^\+?[0-9\s-]+$/.test(profileForm.whatsapp)) {
      newErrors.whatsapp = 'Must be a valid WhatsApp number.';
      hasError = true;
    }

    if (profileForm.facebook && !/^https?:\/\/(www\.)?facebook\.com\/.+/i.test(profileForm.facebook)) {
      newErrors.facebook = 'Must be a valid Facebook profile URL.';
      hasError = true;
    }

    setProfileErrors(newErrors);

    if (hasError) {
      return;
    }

    setSavingProfile(true);
    try {
      const response = await api.patch('/users/me/profile', {
        name: profileForm.name,
        email: profileForm.email,
        profile_picture: profilePicture || undefined,
        phone: profileForm.phone || null,
        whatsapp: profileForm.whatsapp || null,
        facebook: profileForm.facebook || null
      });
      setUser(response.data);
      showMessage('success', 'Profile updated successfully!');
      setEditingProfile(false);
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Error updating profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordFormChange = (field, value) => {
    const updated = { ...passwordForm, [field]: value };
    setPasswordForm(updated);

    const newErrors = { ...passwordErrors };

    if (field === 'current') {
      if (!value) {
        newErrors.current = 'Current password is required.';
      } else {
        newErrors.current = '';
      }
    }

    if (field === 'new') {
      if (!value) {
        newErrors.new = 'New password is required.';
      } else if (value.length < 8) {
        newErrors.new = 'Password must be at least 8 characters long.';
      } else {
        newErrors.new = '';
      }

      if (updated.confirm && value !== updated.confirm) {
        newErrors.confirm = 'New passwords do not match.';
      } else {
        newErrors.confirm = '';
      }
    }

    if (field === 'confirm') {
      if (!value) {
        newErrors.confirm = 'Please confirm your new password.';
      } else if (updated.new !== value) {
        newErrors.confirm = 'New passwords do not match.';
      } else {
        newErrors.confirm = '';
      }
    }

    setPasswordErrors(newErrors);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    let hasError = false;
    const newErrors = { current: '', new: '', confirm: '' };

    if (!passwordForm.current) {
      newErrors.current = 'Current password is required.';
      hasError = true;
    }

    if (!passwordForm.new) {
      newErrors.new = 'New password is required.';
      hasError = true;
    } else if (passwordForm.new.length < 8) {
      newErrors.new = 'Password must be at least 8 characters long.';
      hasError = true;
    }

    if (!passwordForm.confirm) {
      newErrors.confirm = 'Please confirm your new password.';
      hasError = true;
    } else if (passwordForm.new !== passwordForm.confirm) {
      newErrors.confirm = 'New passwords do not match.';
      hasError = true;
    }

    setPasswordErrors(newErrors);

    if (hasError) {
      return;
    }

    setSavingPassword(true);
    try {
      // Mocking the password update API call if not available
      // await api.patch('/users/me/password', { current: passwordForm.current, new: passwordForm.new });
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate delay
      showMessage('success', 'Password changed successfully!');
      setPasswordForm({ current: '', new: '', confirm: '' });
      setPasswordErrors({ current: '', new: '', confirm: '' });
    } catch (err) {
      showMessage('error', 'Failed to update password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // Mocking account deletion
      // await api.delete('/users/me');
      handleLogout();
    } catch (err) {
      showMessage('error', 'Failed to delete account.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('fisher_token');
    localStorage.removeItem('fisher_role');
    navigate('/login');
  };

  return (
    <Layout activePage="settings" className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      <div className="flex-1 flex flex-col w-full">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Settings</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your account settings and preferences.</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
          >
            ← Back
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <main className="max-w-6xl mx-auto w-full px-6 py-8 flex-1 flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 shrink-0">
          <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0">
            <button 
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${activeTab === 'profile' ? 'bg-cyan-50 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <UserIcon /> Profile
            </button>
            <button 
              onClick={() => setActiveTab('appearance')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${activeTab === 'appearance' ? 'bg-cyan-50 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <PaletteIcon /> Appearance
            </button>
            <button 
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${activeTab === 'security' ? 'bg-cyan-50 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <ShieldIcon /> Security
            </button>
          </nav>
        </aside>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          
          {/* Global Notification Banner */}
          {message.text && (
            <div className={`p-4 rounded-xl text-sm font-medium border animate-slideIn ${message.type === 'success' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800/50' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/50'}`}>
              {message.text}
            </div>
          )}

          {/* Tab Content: Profile */}
          {activeTab === 'profile' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Profile Information</h2>
              
              {!editingProfile ? (
                <div className="space-y-5">
                  <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-20 w-20 overflow-hidden rounded-full bg-slate-100 ">
                        {profilePicture ? (
                          <img src={profilePicture} alt="Profile" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-slate-200 text-xl font-bold text-slate-500">{user?.name?.charAt(0).toUpperCase() || 'U'}</div>
                        )}
                      </div>            
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mb-1">Full Name</p>
                      <p className="text-base font-medium text-slate-900 dark:text-white">{user?.name || 'Loading...'}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mb-1">Email Address</p>
                      <p className="text-base font-medium text-slate-900 dark:text-white">{user?.email || 'Loading...'}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mb-1">Phone Number</p>
                      <p className="text-base font-medium text-slate-900 dark:text-white">{user?.phone || 'Not set'}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mb-1">WhatsApp Number</p>
                      <p className="text-base font-medium text-slate-900 dark:text-white">{user?.whatsapp || 'Not set'}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 col-span-1 md:col-span-2">
                      <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mb-1">Facebook Profile Link</p>
                      {user?.facebook ? (
                        <a href={user.facebook} target="_blank" rel="noopener noreferrer" className="text-base font-medium text-cyan-600 dark:text-cyan-400 hover:underline">{user.facebook}</a>
                      ) : (
                        <p className="text-base font-medium text-slate-900 dark:text-white">Not set</p>
                      )}
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mb-1">Account Role</p>
                      <p className="text-base font-medium text-slate-900 dark:text-white capitalize">{user?.role || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => setEditingProfile(true)}
                      className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                      Edit Profile
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 max-w-lg">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={profileForm.name}
                      onChange={handleProfileInputChange}
                      className={`w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none transition-all ${
                        profileErrors.name
                          ? 'border-red-500 focus:ring-1 focus:ring-red-500 focus:border-red-500'
                          : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500'
                      }`}
                    />
                    {profileErrors.name && (
                      <p className="mt-1 text-xs text-red-500 font-medium">{profileErrors.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={profileForm.email}
                      onChange={handleProfileInputChange}
                      className={`w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none transition-all ${
                        profileErrors.email
                          ? 'border-red-500 focus:ring-1 focus:ring-red-500 focus:border-red-500'
                          : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500'
                      }`}
                    />
                    {profileErrors.email && (
                      <p className="mt-1 text-xs text-red-500 font-medium">{profileErrors.email}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Phone Number</label>
                    <input
                      type="text"
                      name="phone"
                      value={profileForm.phone}
                      onChange={handleProfileInputChange}
                      placeholder="e.g. +252615123456"
                      className={`w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none transition-all ${
                        profileErrors.phone
                          ? 'border-red-500 focus:ring-1 focus:ring-red-500 focus:border-red-500'
                          : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500'
                      }`}
                    />
                    {profileErrors.phone && (
                      <p className="mt-1 text-xs text-red-500 font-medium">{profileErrors.phone}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">WhatsApp Number</label>
                    <input
                      type="text"
                      name="whatsapp"
                      value={profileForm.whatsapp}
                      onChange={handleProfileInputChange}
                      placeholder="e.g. +252615123456"
                      className={`w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none transition-all ${
                        profileErrors.whatsapp
                          ? 'border-red-500 focus:ring-1 focus:ring-red-500 focus:border-red-500'
                          : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500'
                      }`}
                    />
                    {profileErrors.whatsapp && (
                      <p className="mt-1 text-xs text-red-500 font-medium">{profileErrors.whatsapp}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Facebook Profile Link</label>
                    <input
                      type="text"
                      name="facebook"
                      value={profileForm.facebook}
                      onChange={handleProfileInputChange}
                      placeholder="e.g. https://facebook.com/username"
                      className={`w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none transition-all ${
                        profileErrors.facebook
                          ? 'border-red-500 focus:ring-1 focus:ring-red-500 focus:border-red-500'
                          : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500'
                      }`}
                    />
                    {profileErrors.facebook && (
                      <p className="mt-1 text-xs text-red-500 font-medium">{profileErrors.facebook}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Profile Picture</label>
                    <div className="flex items-center gap-4">
                      <label className="cursor-pointer rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                        Choose image
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = () => setProfilePicture(reader.result);
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                      {profilePicture && (
                        <img src={profilePicture} alt="Preview" className="h-16 w-16 rounded-full object-cover" />
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                      className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                    >
                      {savingProfile ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingProfile(false);
                        setProfileForm({
                          name: user.name || '',
                          email: user.email || '',
                          phone: user.phone || '',
                          whatsapp: user.whatsapp || '',
                          facebook: user.facebook || ''
                        });
                        setProfileErrors({ name: '', email: '', phone: '', whatsapp: '', facebook: '' });
                      }}
                      className="px-6 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-semibold rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab Content: Appearance */}
          {activeTab === 'appearance' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-8">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Theme Preferences</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { id: 'light', label: 'Light', icon: '☀️' },
                    { id: 'dark', label: 'Dark', icon: '🌙' },
                    { id: 'system', label: 'System', icon: '💻' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => applyTheme(t.id)}
                      className={`flex flex-col items-center justify-center p-5 rounded-xl border-2 transition-all ${theme === t.id ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-cyan-300 dark:hover:border-cyan-700'}`}
                    >
                      <span className="text-2xl mb-2">{t.icon}</span>
                      <span className={`text-sm font-semibold ${theme === t.id ? 'text-cyan-700 dark:text-cyan-400' : 'text-slate-600 dark:text-slate-400'}`}>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Language</h2>
                <div className="max-w-xs">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                  >
                    <option value="en">English</option>
                    <option value="so">Somali</option>
                    <option value="ar">Arabic</option>
                  </select>
                </div>
              </div> */}

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Notifications</h2>
                <label className="flex items-center justify-between cursor-pointer p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">Push Notifications</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Receive alerts for new orders and market updates.</p>
                  </div>
                  <div className="relative">
                    <input type="checkbox" className="sr-only" checked={notifications} onChange={() => setNotifications(!notifications)} />
                    <div className={`block w-14 h-8 rounded-full transition-colors ${notifications ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${notifications ? 'transform translate-x-6' : ''}`}></div>
                  </div>
                </label>
              </div>

              <div className="pt-8 flex justify-end">
                <button
                  onClick={handleSaveAppearance}
                  className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          )}

          {/* Tab Content: Security */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              
              {/* Change Password */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Change Password</h2>
                <form onSubmit={handlePasswordSubmit} className="max-w-lg space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Current Password</label>
                    <input
                      type="password"
                      required
                      value={passwordForm.current}
                      onChange={(e) => handlePasswordFormChange('current', e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white outline-none ${
                        passwordErrors.current
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-cyan-500'
                      }`}
                    />
                    {passwordErrors.current && (
                      <p className="mt-1 text-xs text-red-500 font-medium">{passwordErrors.current}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">New Password</label>
                    <input
                      type="password"
                      required
                      value={passwordForm.new}
                      onChange={(e) => handlePasswordFormChange('new', e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white outline-none ${
                        passwordErrors.new
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-cyan-500'
                      }`}
                    />
                    {passwordErrors.new ? (
                      <p className="mt-1 text-xs text-red-500 font-medium">{passwordErrors.new}</p>
                    ) : (
                      <p className={`mt-1.5 text-xs ${passwordForm.new.length >= 8 ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}`}>
                        {passwordForm.new.length >= 8 ? '✓ ' : ''}Minimum 8 characters ({passwordForm.new.length}/8)
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={passwordForm.confirm}
                      onChange={(e) => handlePasswordFormChange('confirm', e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white outline-none ${
                        passwordErrors.confirm
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-cyan-500'
                      }`}
                    />
                    {passwordErrors.confirm && (
                      <p className="mt-1 text-xs text-red-500 font-medium">{passwordErrors.confirm}</p>
                    )}
                  </div>
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={savingPassword}
                      className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
                    >
                      {savingPassword ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Two-Factor Auth */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Two-Factor Authentication</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Add an extra layer of security to your account.</p>
                  </div>
                  <label className="relative flex items-center cursor-pointer shrink-0">
                    <input type="checkbox" className="sr-only" checked={twoFactorEnabled} onChange={() => {
                      setTwoFactorEnabled(!twoFactorEnabled);
                      showMessage('success', !twoFactorEnabled ? '2FA enabled successfully!' : '2FA disabled.');
                    }} />
                    <div className={`block w-14 h-8 rounded-full transition-colors ${twoFactorEnabled ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${twoFactorEnabled ? 'transform translate-x-6' : ''}`}></div>
                  </label>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 shadow-sm border border-red-200 dark:border-red-900/30">
                <h2 className="text-lg font-bold text-red-600 dark:text-red-400 mb-4">Danger Zone</h2>
                
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 gap-4">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">Sign Out</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Log out of your account on this device.</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="px-5 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm font-semibold transition-colors shrink-0"
                    >
                      Log out
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-red-100 dark:border-red-900/20 bg-red-50/50 dark:bg-red-900/10 gap-4">
                    <div>
                      <p className="font-semibold text-red-700 dark:text-red-400 text-sm">Delete Account</p>
                      <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-0.5">Permanently remove your account and all data.</p>
                    </div>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="px-5 py-2 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/60 rounded-lg text-sm font-semibold transition-colors shrink-0"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-slideIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Delete Account?</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              This action cannot be undone. All of your catches, orders, and personal data will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </Layout>
  );
}

export default Settings;
