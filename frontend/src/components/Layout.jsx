import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import api from '../api/axiosConfig';

// Icons for Navigation
const ChartIcon = ({ active }) => <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={active ? "1.5" : "2"}><path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>;
const MarketIcon = ({ active }) => <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={active ? "1.5" : "2"}><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>;
const OrdersIcon = ({ active }) => <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={active ? "1.5" : "2"}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
const SettingsIcon = ({ active }) => <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={active ? "1.5" : "2"}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const BellIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
const FishIcon = ({ active }) => <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={active ? "1.5" : "2"}><path strokeLinecap="round" strokeLinejoin="round" d="M14.121 15.536c-1.171 1.952-3.07 1.096-4.242 0 1.172 1.096 3.07 1.952 4.242 0zM17 10c0 3.866-3.582 7-8 7s-8-3.134-8-7 3.582-7 8-7 8 3.134 8 7z" /></svg>;
const MenuIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>;
const CloseIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>;
const AdminIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>;

function Layout({ activePage, children, className = "" }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userRole = localStorage.getItem('fisher_role');

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await api.get('/users/me');
        setUser(res.data);
      } catch (err) {
        console.error('Failed to load user for Layout', err);
      }
    }
    loadUser();
  }, []);

  // Close menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [activePage]);

  const getMenuItemClass = (pageName) => {
    const isActive = activePage === pageName;
    return isActive
      ? 'flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600/20 text-cyan-600 dark:text-cyan-400 font-semibold border-b-2 border-cyan-600 dark:border-cyan-400 transition-all duration-200'
      : 'flex items-center gap-2 px-4 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-cyan-600 dark:hover:text-cyan-400 font-medium transition-all duration-200 border-b-2 border-transparent';
  };

  const desktopNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: ChartIcon, path: '/dashboard' },
    ...(userRole === 'fisherman' || userRole === 'admin' ? [{ id: 'catches', label: 'Catches', icon: FishIcon, path: '/fisherman' }] : []),
    { id: 'market', label: 'Market', icon: MarketIcon, path: '/market' },
    { id: 'orders', label: 'Orders', icon: OrdersIcon, path: '/orders' },
    ...(userRole === 'admin' ? [{ id: 'admin', label: 'Admin', icon: AdminIcon, path: '/admin' }] : []),
    { id: 'settings', label: 'Settings', icon: SettingsIcon, path: '/settings' },
  ];

  const mobileNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: ChartIcon, path: '/dashboard' },
    ...(userRole === 'fisherman' || userRole === 'admin' ? [{ id: 'catches', label: 'Catches', icon: FishIcon, path: '/fisherman' }] : []),
    { id: 'market', label: 'Market', icon: MarketIcon, path: '/market' },
    { id: 'orders', label: 'Orders', icon: OrdersIcon, path: '/orders' },
    ...(userRole === 'admin' ? [{ id: 'admin', label: 'Admin', icon: AdminIcon, path: '/admin' }] : []),
  ];

  return (
    <div className={`min-h-screen flex flex-col ${className}`}>
      
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-gradient-to-b from-white/95 to-white/80 dark:from-slate-950/95 dark:to-slate-950/80 border-b border-slate-200/50 dark:border-slate-800/50 transition-colors shadow-sm">
        <div className="max-w-full">
          {/* Main Navbar */}
          <div className="flex items-center justify-between h-16 px-4 md:px-6">
            {/* Left: Menu Button & Logo */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-900 dark:text-white"
                title="Toggle menu"
              >
                {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
              </button>

              <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
                <span className="text-3xl drop-shadow-sm">🌊</span>
                <h1 className="hidden sm:block text-xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">FishMarket</h1>
              </div>
            </div>

            {/* Center: Desktop Menu */}
            <nav className="hidden md:flex items-center gap-2">
              {desktopNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    className={getMenuItemClass(item.id)}
                  >
                    <Icon active={isActive} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Right: User Actions */}
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/notifications')} className="p-2 text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400 transition-colors relative hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <BellIcon />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white dark:border-slate-950 rounded-full animate-pulse"></span>
              </button>
              
              <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 p-[2px] shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/settings')}>
                <div className="w-full h-full rounded-lg bg-white dark:bg-slate-900 overflow-hidden flex items-center justify-center border border-white dark:border-slate-800">
                  {user?.profile_picture ? (
                    <img src={user.profile_picture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {user?.name?.charAt(0) || 'U'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Menu - Dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-950/50 backdrop-blur-sm">
              <nav className="flex flex-col p-4 gap-2">
                {mobileNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        navigate(item.path);
                        setMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 w-full text-left ${
                        isActive
                          ? 'bg-cyan-600/20 text-cyan-600 dark:text-cyan-400 font-semibold border-l-4 border-cyan-600 dark:border-cyan-400'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-cyan-600 dark:hover:text-cyan-400'
                      }`}
                    >
                      <Icon active={isActive} />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex min-w-0 overflow-hidden">
        {/* Desktop Sidebar (hidden on mobile/tablet) */}
        <div className="hidden lg:block w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-slate-900 h-[calc(100vh-4rem)] overflow-y-auto">
          <Sidebar activePage={activePage} />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <main className="flex-1 overflow-auto bg-transparent scroll-smooth">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export default Layout;
