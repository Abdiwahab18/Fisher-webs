import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

// Icons
const ChartIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>;
const FishIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.121 15.536c-1.171 1.952-3.07 1.096-4.242 0 1.172 1.096 3.07 1.952 4.242 0zM17 10c0 3.866-3.582 7-8 7s-8-3.134-8-7 3.582-7 8-7 8 3.134 8 7z" /></svg>;
const MarketIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>;
const OrdersIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
const SettingsIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const LogoutIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const AdminIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>;
const MenuIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>;
const CloseIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>;

function Sidebar({ activePage, isOpen, onClose }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const userRole = localStorage.getItem('fisher_role');

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await api.get('/users/me');
        setUser(res.data);
      } catch (err) {
        console.error('Failed to load user in sidebar', err);
      }
    }
    loadUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('fisher_token');
    localStorage.removeItem('fisher_role');
    navigate('/login');
  };

  const handleNavigate = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  const getNavClass = (pageName) => {
    const isActive = activePage === pageName;
    return isActive
      ? 'flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-500 text-white w-full text-left text-sm font-semibold transition-all duration-200 shadow-lg shadow-cyan-500/30 relative overflow-hidden'
      : 'flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800/50 hover:text-cyan-400 hover:border-l-4 hover:border-cyan-500 w-full text-left text-sm font-medium transition-all duration-200 relative';
  };

  return (
    <aside className="w-64 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 dark:from-slate-950 dark:via-slate-950 dark:to-black text-white shadow-2xl flex flex-col transition-all duration-300 shrink-0 border-r border-slate-800 z-30 relative h-screen"
    >
      <div className="p-6 flex flex-col flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => handleNavigate('/')}>
            <div className="relative">
              <span className="text-3xl drop-shadow-sm">🌊</span>
            </div>
            <h2 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">FishMarket</h2>
          </div>
          {onClose && (
            <button onClick={onClose} className="lg:hidden p-2 hover:bg-slate-800 rounded-lg transition-colors">
              <CloseIcon />
            </button>
          )}
        </div>
        
        <div className="h-0.5 bg-gradient-to-r from-cyan-600/0 via-cyan-600/50 to-cyan-600/0 my-6 rounded-full"></div>
        
        <nav className="space-y-2 flex-1">
          <p className="text-xs font-semibold text-slate-400 px-4 mb-3 uppercase tracking-wider">Main Menu</p>
          
          <button onClick={() => handleNavigate('/dashboard')} className={getNavClass('dashboard')}>
            <ChartIcon />
            <span>Dashboard</span>
          </button>
          
          {(userRole === 'fisherman' || userRole === 'admin') && (
            <button onClick={() => handleNavigate('/fisherman')} className={getNavClass('catches')}>
              <FishIcon />
              <span>Catches</span>
            </button>
          )}
          
          <button onClick={() => handleNavigate('/market')} className={getNavClass('market')}>
            <MarketIcon />
            <span>Market</span>
          </button>
          
          <button onClick={() => handleNavigate('/orders')} className={getNavClass('orders')}>
            <OrdersIcon />
            <span>Orders</span>
          </button>
          
          {userRole === 'admin' && (
            <>
              <div className="h-px bg-slate-800 my-4"></div>
              <p className="text-xs font-semibold text-slate-400 px-4 mb-3 uppercase tracking-wider">Admin</p>
              <button onClick={() => handleNavigate('/admin')} className={getNavClass('admin')}>
                <AdminIcon />
                <span>Admin Panel</span>
              </button>
            </>
          )}

          <div className="h-px bg-slate-800 my-4"></div>
          <button onClick={() => handleNavigate('/settings')} className={getNavClass('settings')}>
            <SettingsIcon />
            <span>Settings</span>
          </button>
        </nav>
      </div>

      <div className="p-6 border-t border-slate-800 bg-slate-900/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            {user?.profile_picture ? (
              <img src={user.profile_picture} alt={user?.name || 'User'} className="w-12 h-12 rounded-lg object-cover shadow-md border border-cyan-500/20" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-md border border-cyan-500/20">
                {user?.name?.charAt(0) || 'E'}
              </div>
            )}
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></div>
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="font-semibold text-sm truncate text-white">{user?.name || 'Loading...'}</p>
            <p className="text-xs text-slate-400 capitalize truncate">{user?.role || 'User'}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full text-red-400 hover:text-red-300 text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-red-950/40 transition-all duration-200 border border-red-900/30 hover:border-red-900/60 group"
        >
          <LogoutIcon /> 
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );}
export default Sidebar
