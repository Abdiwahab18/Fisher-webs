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
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');

    if (/\d/.test(name)) {
      setMessage('Name cannot contain numbers!');
      return;
    }

    if (password.length < 8) {
      setMessage('Password must be at least 8 characters long!');
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
              onChange={(e) => setName(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3"
              required
            />
            {/* <p className={`mt-1.5 text-sm ${password.length >= 8 ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}`}>
              {password.length >= 8 ? '✓ ' : ''}Minimum 8 characters ({password.length}/8)
            </p> */}
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
