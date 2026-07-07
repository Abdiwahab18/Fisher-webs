import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import Layout from '../components/Layout';

function FishermanDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
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
  const [createdDriverCreds, setCreatedDriverCreds] = useState(null);
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

    if (name === 'name') {
      const sanitized = value.replace(/\d/g, '');
      setDriverForm(prev => ({ ...prev, name: sanitized }));
      return;
    }

    setDriverForm(prev => ({ ...prev, [name]: value }));
  };

  const resetDriverForm = () => {
    setDriverForm({
      name: '',
      phone: '',
      vehicle_type: '',
      vehicle_number: '',
      vehicle_color: '',
      status: 'active',
      email: '',
      password: ''
    });
    setDriverEditingId(null);
  };

  const handleDriverSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!driverForm.name.trim()) {
      setError('Driver name is required.');
      return;
    }

    if (/\d/.test(driverForm.name)) {
      setError('Driver name cannot contain numbers.');
      return;
    }

    if (!driverForm.phone.trim()) {
      setError('Phone number is required.');
      return;
    }

    if (!driverEditingId) {
      if (!driverForm.email || !driverForm.password) {
        setError('Login email and password are required for new drivers.');
        return;
      }
    }

    if (driverForm.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(driverForm.email)) {
        setError('Please enter a valid email address.');
        return;
      }
    }

    if (driverForm.password && driverForm.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    try {
      if (driverEditingId) {
        const payload = { ...driverForm };
        if (!payload.email) delete payload.email;
        if (!payload.password) delete payload.password;
        await api.patch(`/drivers/${driverEditingId}`, payload);
        setSuccessMessage('Driver updated successfully!');
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
          setSuccessMessage(`Driver added successfully!\nLogin email: ${credentials.login_email}\nTemporary password: ${credentials.temporary_password}\nAccount ID: ${credentials.user_id}`);
        } else {
          setSuccessMessage('Driver added successfully!');
        }
      }

      resetDriverForm();
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
  };

  const handleDriverStatusToggle = async (driver) => {
    try {
      await api.patch(`/drivers/${driver.id}`, { status: driver.status === 'active' ? 'inactive' : 'active' });
      loadDrivers();
    } catch (err) {
      setError('Unable to update driver status.');
    }
  };

  const handleDriverDelete = async (id) => {
    try {
      await api.delete(`/drivers/${id}`);
      setSuccessMessage('Driver removed successfully!');
      loadDrivers();
    } catch (err) {
      setError('Unable to remove driver.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('fisher_token');
    localStorage.removeItem('fisher_role');
    navigate('/login');
  };

  return (
    <Layout activePage="drivers" className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800">
      <div className="p-4 md:p-8 w-full">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">Delivery Drivers</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Register drivers for your deliveries and share their login details securely.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-300"
          >
            Logout
          </button>
        </div>

        {successMessage && (
          <div className="mb-6 rounded-lg border border-green-400 bg-green-100 p-4 text-green-700 whitespace-pre-line">
            {successMessage}
          </div>
        )}
        {error && (
          <div className="mb-6 rounded-lg border border-red-400 bg-red-100 p-4 text-red-700">
            {error}
          </div>
        )}

        {createdDriverCreds && (
          <div className="mb-6 rounded-2xl border border-cyan-300 bg-cyan-50 p-5 text-slate-800 dark:bg-slate-800 dark:text-slate-100">
            <h2 className="text-lg font-semibold">Driver login details</h2>
            <p className="mt-2 text-sm">Name: {createdDriverCreds.name}</p>
            <p className="text-sm">Email: {createdDriverCreds.email}</p>
            <p className="text-sm">Temporary password: {createdDriverCreds.password}</p>
            <p className="text-sm">Account ID: {createdDriverCreds.userId}</p>
          </div>
        )}

        <div className="mb-8 rounded-2xl border border-cyan-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Add or edit a driver</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Driver names must contain letters only.</p>
          </div>

          <form onSubmit={handleDriverSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Driver Name *</label>
              <input name="name" value={driverForm.name} onChange={handleDriverInputChange} required className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:border-cyan-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Phone *</label>
              <input name="phone" value={driverForm.phone} onChange={handleDriverInputChange} required className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:border-cyan-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Vehicle Type</label>
              <input list="vehicle_types" name="vehicle_type" value={driverForm.vehicle_type || ''} onChange={handleDriverInputChange} placeholder="Bike, Tuk Tuk..." className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:border-cyan-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" />
              <datalist id="vehicle_types">
                <option value="Motorcycle" />
                <option value="Bicycle" />
                <option value="Car" />
                <option value="Tuk Tuk" />
                <option value="Van" />
                <option value="Truck" />
              </datalist>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Vehicle Number</label>
              <input name="vehicle_number" value={driverForm.vehicle_number} onChange={handleDriverInputChange} className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:border-cyan-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Vehicle Color</label>
              <input list="vehicle_colors" name="vehicle_color" value={driverForm.vehicle_color || ''} onChange={handleDriverInputChange} placeholder="Red, Black..." className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:border-cyan-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" />
              <datalist id="vehicle_colors">
                <option value="Red" />
                <option value="Blue" />
                <option value="Black" />
                <option value="White" />
                <option value="Silver" />
                <option value="Grey" />
                <option value="Yellow" />
                <option value="Green" />
              </datalist>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Login Email *</label>
              <input type="email" name="email" value={driverForm.email || ''} onChange={handleDriverInputChange} placeholder="driver@example.com" required className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:border-cyan-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Password {driverEditingId ? '(Optional - leave blank to keep current)' : '*'}</label>
              <input type="password" name="password" value={driverForm.password || ''} onChange={handleDriverInputChange} placeholder={driverEditingId ? '••••••••' : 'Min 8 characters'} required={!driverEditingId} className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:border-cyan-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Status</label>
              <select name="status" value={driverForm.status} onChange={handleDriverInputChange} className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:border-cyan-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700">{driverEditingId ? 'Update Driver' : 'Add Driver'}</button>
              {driverEditingId && <button type="button" onClick={resetDriverForm} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold dark:border-slate-600">Cancel</button>}
            </div>
          </form>
        </div>

        <div className="space-y-3">
          {drivers.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              No drivers registered yet.
            </div>
          ) : drivers.map((driver) => (
            <div key={driver.id} className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row md:items-center dark:border-slate-700 dark:bg-slate-800">
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100">{driver.name}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Phone: {driver.phone || 'N/A'}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Login email: {driver.login_email || 'N/A'}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Account ID: {driver.user_id || 'N/A'}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Vehicle: {driver.vehicle_type || 'N/A'} {driver.vehicle_number ? `• ${driver.vehicle_number}` : ''}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${driver.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>{driver.status === 'active' ? 'Active' : 'Inactive'}</span>
                <button onClick={() => handleDriverStatusToggle(driver)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600">{driver.status === 'active' ? 'Deactivate' : 'Activate'}</button>
                <button onClick={() => handleDriverEdit(driver)} className="rounded-lg bg-slate-100 px-3 py-2 text-sm dark:bg-slate-700">Edit</button>
                <button onClick={() => handleDriverDelete(driver.id)} className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">Remove</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

export default FishermanDrivers;
