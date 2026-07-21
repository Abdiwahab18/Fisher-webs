import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosConfig';

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [profilePicture, setProfilePicture] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({ name: '', email: '', password: '' });
  const navigate = useNavigate();

  const handleNameChange = (val) => {
    setName(val);
    if (!val.trim()) {
      setErrors(prev => ({ ...prev, name: 'Name is required.' }));
    } else if (!/^[A-Za-z\s]+$/.test(val)) {
      setErrors(prev => ({ ...prev, name: 'Name can only contain alphabetic characters and spaces.' }));
    } else {
      setErrors(prev => ({ ...prev, name: '' }));
    }
  };

  const handleEmailChange = (val) => {
    setEmail(val);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!val.trim()) {
      setErrors(prev => ({ ...prev, email: 'Email is required.' }));
    } else if (!emailRegex.test(val)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address.' }));
    } else {
      setErrors(prev => ({ ...prev, email: '' }));
    }
  };

  const handlePasswordChange = (val) => {
    setPassword(val);
    if (!val) {
      setErrors(prev => ({ ...prev, password: 'Password is required.' }));
    } else if (val.length < 8) {
      setErrors(prev => ({ ...prev, password: 'Password must be at least 8 characters long.' }));
    } else {
      setErrors(prev => ({ ...prev, password: '' }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');

    let hasError = false;
    const newErrors = { name: '', email: '', password: '' };

    if (!name.trim()) {
      newErrors.name = 'Name is required.';
      hasError = true;
    } else if (!/^[A-Za-z\s]+$/.test(name)) {
      newErrors.name = 'Name can only contain alphabetic characters and spaces.';
      hasError = true;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'Email is required.';
      hasError = true;
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
      hasError = true;
    }

    if (!password) {
      newErrors.password = 'Password is required.';
      hasError = true;
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long.';
      hasError = true;
    }

    setErrors(newErrors);

    if (hasError) {
      return;
    }

    try {
      await api.post('/auth/register', { name, email, password, role, profile_picture: profilePicture });
      setMessage('Registration successful. Redirecting to login...');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-800 dark:text-slate-100 p-8 shadow-md">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Register</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">Create a fresh account to sell or buy catch records.</p>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className={`mt-2 w-full rounded-2xl border px-4 py-3 bg-slate-50 dark:bg-slate-900 outline-none transition-all ${
                errors.name
                  ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-cyan-500'
              }`}
              required
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500 font-medium">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              className={`mt-2 w-full rounded-2xl border px-4 py-3 bg-slate-50 dark:bg-slate-900 outline-none transition-all ${
                errors.email
                  ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-cyan-500'
              }`}
              required
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500 font-medium">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              className={`mt-2 w-full rounded-2xl border px-4 py-3 bg-slate-50 dark:bg-slate-900 outline-none transition-all ${
                errors.password
                  ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-cyan-500'
              }`}
              required
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-500 font-medium">{errors.password}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Profile Picture</label>
            <div className="mt-2 flex items-center gap-4">
              <label className="cursor-pointer rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                Upload
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
                <img src={profilePicture} alt="Profile preview" className="h-14 w-14 rounded-full object-cover" />
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3"
            >
              <option value="customer">Customer</option>
              <option value="fisherman">Fisherman</option>
              {/* <option value="driver">Driver</option> */}
              <option value="admin">Admin</option>
            </select>
          </div>

          {message && <p className="text-sm text-slate-700 dark:text-slate-300">{message}</p>}

          <button className="w-full rounded-2xl bg-slate-900 px-5 py-3 text-white transition hover:bg-slate-700 dark:bg-slate-950">
            Create account
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link className="font-semibold text-slate-900 dark:text-slate-100 hover:text-slate-700 dark:text-slate-300" to="/login">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
