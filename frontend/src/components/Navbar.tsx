import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { VoiceAssistantModal } from './VoiceAssistantModal';
import {
  Sprout,
  Mic,
  Bell,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  Truck,
  TrendingUp,
  Landmark,
  Layers,
  ShoppingBag,
  Shield,
  HelpCircle,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  // Determine navigation links based on user role
  const getNavLinks = () => {
    if (!user) {
      return [
        { label: t('nav.home', 'Home'), path: '/' },
        { label: t('nav.howItWorks', 'How It Works'), path: '/how-it-works' },
        { label: t('nav.market', 'Market Prices'), path: '/market' },
        { label: t('nav.schemes', 'Govt Schemes'), path: '/schemes' },
      ];
    }

    if (user.role === 'FARMER') {
      return [
        { label: t('nav.dashboard', 'Dashboard'), path: '/farmer/dashboard' },
        { label: t('nav.produce', 'My Produce'), path: '/farmer/produce' },
        { label: t('nav.pools', 'Supply Pools'), path: '/farmer/pools' },
        { label: t('nav.orders', 'Orders'), path: '/farmer/orders' },
        { label: t('nav.routes', 'Logistics Routes'), path: '/farmer/routes' },
        { label: t('nav.market', 'Mandi Prices'), path: '/farmer/market' },
        { label: t('nav.schemes', 'Govt Schemes'), path: '/farmer/schemes' },
      ];
    }

    if (user.role === 'BUYER') {
      return [
        { label: t('nav.dashboard', 'Dashboard'), path: '/buyer/dashboard' },
        { label: t('nav.requirements', 'Requirements'), path: '/buyer/requirements' },
        { label: 'Demand Pools', path: '/buyer/pools' },
        { label: t('nav.orders', 'Orders'), path: '/buyer/orders' },
        { label: t('nav.routes', 'Logistics Routes'), path: '/buyer/routes' },
        { label: t('nav.market', 'Market Trends'), path: '/buyer/market' },
        { label: t('nav.transactions', 'Payments'), path: '/buyer/transactions' },
      ];
    }

    if (user.role === 'ADMIN') {
      return [
        { label: 'Admin Dashboard', path: '/admin/dashboard' },
        { label: 'Market Mandi', path: '/market' },
        { label: 'Govt Schemes', path: '/schemes' },
      ];
    }

    return [];
  };

  const navLinks = getNavLinks();

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-emerald-100 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={user ? (user.role === 'FARMER' ? '/farmer/dashboard' : user.role === 'BUYER' ? '/buyer/dashboard' : '/admin/dashboard') : '/'} className="flex items-center space-x-2.5 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition">
                <Sprout className="w-6 h-6" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-slate-100 flex items-center">
                  AGRI<span className="text-emerald-600 dark:text-emerald-400">Bridge</span>
                </span>
                <span className="block text-[10px] text-slate-400 font-semibold tracking-wider uppercase -mt-1">
                  B2B Agro Pooling
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    isActive(link.path)
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                      : 'text-slate-600 dark:text-slate-300 hover:text-emerald-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right Action Icons & Controls */}
            <div className="flex items-center space-x-2.5">
              {/* Voice AI Assistant Button */}
              <button
                type="button"
                onClick={() => setIsVoiceOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition transform active:scale-95"
                title="AgriBridge Voice AI Assistant"
              >
                <Mic className="w-3.5 h-3.5 animate-pulse" />
                <span className="hidden sm:inline">Voice AI</span>
              </button>

              {/* Language Selector */}
              <LanguageSelector />

              {/* User Profile or Login/Register */}
              {user ? (
                <div className="flex items-center space-x-2 pl-1 border-l border-slate-200 dark:border-slate-800">
                  {/* Role Badge */}
                  <span
                    className={`hidden sm:inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      user.role === 'FARMER'
                        ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
                        : user.role === 'BUYER'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                    }`}
                  >
                    {user.role}
                  </span>

                  <div className="text-right hidden md:block">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                      {user.name.split(' ')[0]}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate max-w-[100px]">
                      {user.email}
                    </p>
                  </div>

                  <button
                    onClick={logout}
                    title="Log Out"
                    className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    {t('nav.login', 'Login')}
                  </Link>
                  <Link
                    to="/register"
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition"
                  >
                    {t('nav.register', 'Register')}
                  </Link>
                </div>
              )}

              {/* Mobile menu trigger */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden px-4 pt-2 pb-4 space-y-1 bg-white dark:bg-slate-900 border-b border-emerald-100 dark:border-slate-800">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-xl text-sm font-semibold ${
                  isActive(link.path)
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
      />
    </>
  );
};
