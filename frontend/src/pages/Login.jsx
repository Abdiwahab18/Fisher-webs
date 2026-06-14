import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosConfig';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, role, userId } = response.data;
      localStorage.setItem('fisher_token', token);
      localStorage.setItem('fisher_role', role);
      localStorage.setItem('fisher_user_id', userId);
      navigate(role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-800 dark:text-slate-100 p-8 shadow-md">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Login</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">Access your FishMarket account.</p>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button className="w-full rounded-2xl bg-slate-900 px-5 py-3 text-white transition hover:bg-slate-700 dark:bg-slate-950">
            Sign in
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Don&apos;t have an account?{' '}
          <Link className="font-semibold text-slate-900 dark:text-slate-100 hover:text-slate-700 dark:text-slate-300" to="/register">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
