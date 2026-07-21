import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import Layout from '../components/Layout';

function FishermanDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [createdDriverCreds, setCreatedDriverCreds] = useState(null);
  const [showCredsModal, setShowCredsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [driverForm, setDriverForm] = useState({
    name: '',
    phone: '',
    vehicle_type: '',
    vehicle_number: '',
    vehicle_color: '',
    status: 'active',
    email: '',
    password: ''
  });
  const [driverEditingId, setDriverEditingId] = useState(null);
  const [formErrors, setFormErrors] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    vehicle_type: '',
    vehicle_number: '',
    vehicle_color: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      const response = await api.get('/drivers');
      setDrivers(response.data || []);
    } catch (err) {
      console.error('Unable to load drivers.', err);
    }
  };

  const handleDriverInputChange = (e) => {
    const { name, value } = e.target;
    setDriverForm(prev => ({ ...prev, [name]: value }));

    if (name === 'name') {
      if (!value.trim()) {
        setFormErrors(prev => ({ ...prev, name: 'Driver name is required.' }));
      } else if (!/^[A-Za-z\s]+$/.test(value)) {
        setFormErrors(prev => ({ ...prev, name: 'Letters and spaces only.' }));
      } else {
        setFormErrors(prev => ({ ...prev, name: '' }));
      }
    }
    if (name === 'phone') {
      const cleaned = value.replace(/[\s-]/g, '');
      const isSomaliMobile = /^(\+?252|00252|0)?(61|62|63|65|68|79|90)\d{7}$/.test(cleaned);
      const isSomaliLandline = /^(\+?252|00252|0)?[1-5]\d{6}$/.test(cleaned);
      if (!value.trim()) {
        setFormErrors(prev => ({ ...prev, phone: 'Phone number is required.' }));
      } else if (!isSomaliMobile && !isSomaliLandline) {
        setFormErrors(prev => ({ ...prev, phone: 'Enter a valid Somali number.' }));
      } else {
        setFormErrors(prev => ({ ...prev, phone: '' }));
      }
    }
    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) {
        setFormErrors(prev => ({ ...prev, email: 'Enter a valid email address.' }));
      } else {
        setFormErrors(prev => ({ ...prev, email: '' }));
      }
    }
    if (name === 'password') {
      if (value && value.length < 8) {
        setFormErrors(prev => ({ ...prev, password: 'Minimum 8 characters.' }));
      } else {
        setFormErrors(prev => ({ ...prev, password: '' }));
      }
    }
    if (name === 'vehicle_type') {
      if (value && !/^[A-Za-z\s]+$/.test(value)) {
        setFormErrors(prev => ({ ...prev, vehicle_type: 'Letters and spaces only.' }));
      } else {
        setFormErrors(prev => ({ ...prev, vehicle_type: '' }));
      }
    }
    if (name === 'vehicle_color') {
      if (value && !/^[A-Za-z\s]+$/.test(value)) {
        setFormErrors(prev => ({ ...prev, vehicle_color: 'Letters and spaces only.' }));
      } else {
        setFormErrors(prev => ({ ...prev, vehicle_color: '' }));
      }
    }
    if (name === 'vehicle_number') {
      if (value && !/^[A-Za-z0-9\s-]+$/.test(value)) {
        setFormErrors(prev => ({ ...prev, vehicle_number: 'Alphanumeric, spaces and hyphens only.' }));
      } else {
        setFormErrors(prev => ({ ...prev, vehicle_number: '' }));
      }
    }
  };

  const resetDriverForm = () => {
    setDriverForm({ name: '', phone: '', vehicle_type: '', vehicle_number: '', vehicle_color: '', status: 'active', email: '', password: '' });
    setDriverEditingId(null);
    setFormErrors({ name: '', phone: '', email: '', password: '', vehicle_type: '', vehicle_number: '', vehicle_color: '' });
    setError('');
  };

  const openModal = () => {
    resetDriverForm();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetDriverForm();
  };

  const handleDriverSubmit = async (e) => {
    e.preventDefault();
    setError('');

    let hasError = false;
    const newErrors = { name: '', phone: '', email: '', password: '', vehicle_type: '', vehicle_number: '', vehicle_color: '' };

    if (!driverForm.name.trim()) { newErrors.name = 'Driver name is required.'; hasError = true; }
    else if (!/^[A-Za-z\s]+$/.test(driverForm.name)) { newErrors.name = 'Letters and spaces only.'; hasError = true; }

    if (!driverForm.phone.trim()) { newErrors.phone = 'Phone number is required.'; hasError = true; }
    else {
      const cleanedPhone = driverForm.phone.replace(/[\s-]/g, '');
      const isSomaliMobile = /^(\+?252|00252|0)?(61|62|63|65|68|79|90)\d{7}$/.test(cleanedPhone);
      const isSomaliLandline = /^(\+?252|00252|0)?[1-5]\d{6}$/.test(cleanedPhone);
      if (!isSomaliMobile && !isSomaliLandline) { newErrors.phone = 'Enter a valid Somali number.'; hasError = true; }
    }

    if (!driverEditingId) {
      if (!driverForm.email) { newErrors.email = 'Login email is required.'; hasError = true; }
      if (!driverForm.password) { newErrors.password = 'Password is required.'; hasError = true; }
    }
    if (driverForm.email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(driverForm.email)) { newErrors.email = 'Enter a valid email address.'; hasError = true; }
    }
    if (driverForm.password && driverForm.password.length < 8) { newErrors.password = 'Minimum 8 characters.'; hasError = true; }
    if (driverForm.vehicle_type && !/^[A-Za-z\s]+$/.test(driverForm.vehicle_type)) { newErrors.vehicle_type = 'Letters and spaces only.'; hasError = true; }
    if (driverForm.vehicle_color && !/^[A-Za-z\s]+$/.test(driverForm.vehicle_color)) { newErrors.vehicle_color = 'Letters and spaces only.'; hasError = true; }
    if (driverForm.vehicle_number && !/^[A-Za-z0-9\s-]+$/.test(driverForm.vehicle_number)) { newErrors.vehicle_number = 'Alphanumeric only.'; hasError = true; }

    setFormErrors(newErrors);
    if (hasError) return;

    try {
      if (driverEditingId) {
        const payload = { ...driverForm };
        if (!payload.email) delete payload.email;
        if (!payload.password) delete payload.password;
        await api.patch(`/drivers/${driverEditingId}`, payload);
        setSuccessMessage('Driver updated successfully!');
        setTimeout(() => setSuccessMessage(''), 4000);
      } else {
        const response = await api.post('/drivers', driverForm);
        const credentials = response.data;
        if (credentials?.login_email) {
          setCreatedDriverCreds({
            name: driverForm.name,
            email: credentials.login_email,
            password: credentials.temporary_password,
            userId: credentials.user_id
          });
          setShowCredsModal(true);
        } else {
          setSuccessMessage('Driver added successfully!');
          setTimeout(() => setSuccessMessage(''), 4000);
        }
      }
      resetDriverForm();
      setShowModal(false);
      loadDrivers();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save driver.');
    }
  };

  const handleDriverEdit = (driver) => {
    setDriverForm({
      name: driver.name || '',
      phone: driver.phone || '',
      vehicle_type: driver.vehicle_type || '',
      vehicle_number: driver.vehicle_number || '',
      vehicle_color: driver.vehicle_color || '',
      status: driver.status || 'active',
      email: driver.login_email || '',
      password: ''
    });
    setDriverEditingId(driver.id);
    setFormErrors({ name: '', phone: '', email: '', password: '', vehicle_type: '', vehicle_number: '', vehicle_color: '' });
    setError('');
    setShowModal(true);
  };

  const handleDriverStatusToggle = async (driver) => {
    try {
      await api.patch(`/drivers/${driver.id}`, { status: driver.status === 'active' ? 'inactive' : 'active' });
      loadDrivers();
    } catch (err) {
      setError('Unable to update driver status.');
    }
  };

  const filteredDrivers = drivers.filter(d =>
    d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.phone?.includes(searchTerm) ||
    d.login_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = drivers.filter(d => d.status === 'active').length;
  const inactiveCount = drivers.filter(d => d.status === 'inactive').length;

  return (
    <Layout activePage="drivers">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        .driver-page { font-family: 'Inter', sans-serif; }
        .modal-overlay {
          animation: fadeIn 0.2s ease;
        }
        .modal-box {
          animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .driver-row:hover { background: rgba(6,182,212,0.04); }
        .stat-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
        .register-btn {
          background: linear-gradient(135deg, #0891b2, #06b6d4);
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(6,182,212,0.4);
        }
        .register-btn:hover {
          background: linear-gradient(135deg, #0e7490, #0891b2);
          box-shadow: 0 6px 20px rgba(6,182,212,0.5);
          transform: translateY(-1px);
        }
        .input-field {
          width: 100%;
          border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          padding: 10px 14px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          background: #f8fafc;
          color: #1e293b;
        }
        .input-field:focus {
          border-color: #06b6d4;
          box-shadow: 0 0 0 3px rgba(6,182,212,0.12);
          background: #fff;
        }
        .input-field.error { border-color: #ef4444; }
        .dark .input-field { background: #1e293b; border-color: #334155; color: #f1f5f9; }
        .dark .input-field:focus { border-color: #06b6d4; background: #0f172a; }
        .creds-badge {
          background: linear-gradient(135deg, #0f172a, #1e293b);
          border: 1px solid rgba(6,182,212,0.3);
        }
        .table-header { background: linear-gradient(135deg, #f0f9ff, #e0f2fe); }
        .dark .table-header { background: linear-gradient(135deg, #0f172a, #1e293b); }
      `}</style>

      <div className="driver-page p-4 md:p-8 w-full min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">

        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Driver Management</h1>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm ml-13 pl-13" style={{paddingLeft:'52px'}}>
              Register and manage your delivery drivers
            </p>
          </div>
          <button id="open-register-driver-modal" onClick={openModal} className="register-btn flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Register Driver
          </button>
        </div>

        {/* Alerts */}
        {successMessage && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 px-4 py-3 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
            <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {successMessage}
          </div>
        )}
        {error && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 px-4 py-3 text-red-700 dark:text-red-400 text-sm font-medium">
            <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
            <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="stat-card rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{drivers.length}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Total Drivers</p>
            </div>
          </div>
          <div className="stat-card rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{activeCount}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Active</p>
            </div>
          </div>
          <div className="stat-card rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center">
              <svg className="w-6 h-6 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{inactiveCount}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Inactive</p>
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
          {/* Table toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-700">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-base">All Drivers</h2>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
              <input
                type="text"
                placeholder="Search drivers..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm focus:outline-none focus:border-cyan-500 dark:bg-slate-700 dark:text-slate-100 w-56"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header border-b border-slate-100 dark:border-slate-700">
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider">#</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider">Driver</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider">Contact</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider">Vehicle</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider">Status</th>
                  <th className="text-right px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {filteredDrivers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                          <svg className="w-8 h-8 text-slate-300 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                          {searchTerm ? 'No drivers match your search' : 'No drivers registered yet'}
                        </p>
                        {!searchTerm && (
                          <button onClick={openModal} className="text-cyan-600 dark:text-cyan-400 text-sm font-semibold hover:underline">
                            Register your first driver →
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : filteredDrivers.map((driver, index) => (
                  <tr key={driver.id} className="driver-row transition-colors">
                    <td className="px-5 py-4 text-slate-400 dark:text-slate-500 font-mono text-xs">{String(index + 1).padStart(2, '0')}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {driver.name?.charAt(0)?.toUpperCase() || 'D'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-100">{driver.name}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">ID: {driver.user_id || driver.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-slate-700 dark:text-slate-300">{driver.phone || '—'}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{driver.login_email || '—'}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l1 1h10l1-1zm4 0V8l-4-2v10l3 1 1-1z" />
                        </svg>
                        <span className="text-slate-700 dark:text-slate-300 text-sm">
                          {driver.vehicle_type || '—'}
                          {driver.vehicle_number ? ` · ${driver.vehicle_number}` : ''}
                        </span>
                      </div>
                      {driver.vehicle_color && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 ml-5">{driver.vehicle_color}</p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        driver.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${driver.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                        {driver.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDriverStatusToggle(driver)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            driver.status === 'active'
                              ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                              : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400'
                          }`}
                        >
                          {driver.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDriverEdit(driver)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-50 text-cyan-700 hover:bg-cyan-100 dark:bg-cyan-900/20 dark:text-cyan-400 dark:hover:bg-cyan-900/40 transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredDrivers.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-400 dark:text-slate-500">
              Showing {filteredDrivers.length} of {drivers.length} driver{drivers.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Register / Edit Driver Modal */}
      {showModal && (
        <div
          className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="modal-box bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
                  <svg className="w-4.5 h-4.5 text-white" style={{width:'18px',height:'18px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {driverEditingId
                      ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    }
                  </svg>
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white text-lg">
                    {driverEditingId ? 'Edit Driver' : 'Register New Driver'}
                  </h2>
                  <p className="text-xs text-slate-400">{driverEditingId ? 'Update driver information' : 'Add a new driver to your fleet'}</p>
                </div>
              </div>
              <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Error */}
            {error && (
              <div className="mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 px-4 py-3 text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleDriverSubmit} className="px-6 py-5 space-y-4">

              {/* Personal Info */}
              <div>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Personal Info</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="name"
                      value={driverForm.name}
                      onChange={handleDriverInputChange}
                      placeholder="Ahmed Mohamed"
                      className={`input-field ${formErrors.name ? 'error' : ''}`}
                    />
                    {formErrors.name && <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="phone"
                      value={driverForm.phone}
                      onChange={handleDriverInputChange}
                      placeholder="+25261xxxxxxx"
                      className={`input-field ${formErrors.phone ? 'error' : ''}`}
                    />
                    {formErrors.phone && <p className="mt-1 text-xs text-red-500">{formErrors.phone}</p>}
                  </div>
                </div>
              </div>

              {/* Vehicle Info */}
              <div>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Vehicle Info</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Type</label>
                    <input
                      list="vehicle_types"
                      name="vehicle_type"
                      value={driverForm.vehicle_type || ''}
                      onChange={handleDriverInputChange}
                      placeholder="Motorcycle"
                      className={`input-field ${formErrors.vehicle_type ? 'error' : ''}`}
                    />
                    <datalist id="vehicle_types">
                      <option value="Motorcycle" /><option value="Bicycle" /><option value="Car" />
                      <option value="Tuk Tuk" /><option value="Van" /><option value="Truck" />
                    </datalist>
                    {formErrors.vehicle_type && <p className="mt-1 text-xs text-red-500">{formErrors.vehicle_type}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Plate No.</label>
                    <input
                      name="vehicle_number"
                      value={driverForm.vehicle_number}
                      onChange={handleDriverInputChange}
                      placeholder="AA-1234"
                      className={`input-field ${formErrors.vehicle_number ? 'error' : ''}`}
                    />
                    {formErrors.vehicle_number && <p className="mt-1 text-xs text-red-500">{formErrors.vehicle_number}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Color</label>
                    <input
                      list="vehicle_colors"
                      name="vehicle_color"
                      value={driverForm.vehicle_color || ''}
                      onChange={handleDriverInputChange}
                      placeholder="Black"
                      className={`input-field ${formErrors.vehicle_color ? 'error' : ''}`}
                    />
                    <datalist id="vehicle_colors">
                      <option value="Red" /><option value="Blue" /><option value="Black" />
                      <option value="White" /><option value="Silver" /><option value="Grey" />
                      <option value="Yellow" /><option value="Green" />
                    </datalist>
                    {formErrors.vehicle_color && <p className="mt-1 text-xs text-red-500">{formErrors.vehicle_color}</p>}
                  </div>
                </div>
              </div>

              {/* Account Info */}
              <div>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Login Account</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Email {!driverEditingId && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={driverForm.email || ''}
                      onChange={handleDriverInputChange}
                      placeholder="driver@example.com"
                      required={!driverEditingId}
                      className={`input-field ${formErrors.email ? 'error' : ''}`}
                    />
                    {formErrors.email && <p className="mt-1 text-xs text-red-500">{formErrors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Password {!driverEditingId ? <span className="text-red-500">*</span> : <span className="text-slate-400 text-xs">(optional)</span>}
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={driverForm.password || ''}
                      onChange={handleDriverInputChange}
                      placeholder={driverEditingId ? 'Leave blank to keep' : 'Min 8 characters'}
                      required={!driverEditingId}
                      className={`input-field ${formErrors.password ? 'error' : ''}`}
                    />
                    {formErrors.password && <p className="mt-1 text-xs text-red-500">{formErrors.password}</p>}
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Status</label>
                <select
                  name="status"
                  value={driverForm.status}
                  onChange={handleDriverInputChange}
                  className="input-field"
                  style={{cursor:'pointer'}}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white transition-all"
                  style={{ background: 'linear-gradient(135deg, #0891b2, #06b6d4)', boxShadow: '0 4px 14px rgba(6,182,212,0.35)' }}
                >
                  {driverEditingId ? 'Save Changes' : 'Register Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Created Driver Credentials Modal */}
      {showCredsModal && createdDriverCreds && (
        <div
          className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
        >
          <div className="modal-box creds-badge rounded-2xl shadow-2xl w-full max-w-md p-6 text-white">
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-xl font-bold">Driver Registered!</h2>
              <p className="text-slate-400 text-sm mt-1">Share these login credentials with the driver</p>
            </div>

            <div className="space-y-3 rounded-xl border border-slate-700 bg-slate-900/50 p-4 mb-5">
              {[
                { label: 'Name', value: createdDriverCreds.name },
                { label: 'Login Email', value: createdDriverCreds.email },
                { label: 'Temp Password', value: createdDriverCreds.password },
                { label: 'Account ID', value: createdDriverCreds.userId },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-medium">{label}</span>
                  <span className="text-sm font-mono font-semibold text-cyan-300 bg-slate-800 px-2 py-0.5 rounded">{value}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2 mb-4 flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Save these credentials now — the password cannot be recovered later.
            </p>

            <button
              onClick={() => { setShowCredsModal(false); setCreatedDriverCreds(null); }}
              className="w-full py-2.5 rounded-xl font-semibold text-sm text-white"
              style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}
            >
              Done — I've saved the credentials
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default FishermanDrivers;
