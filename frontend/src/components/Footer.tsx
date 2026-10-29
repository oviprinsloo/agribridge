import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, ShieldCheck, Truck, Scale, Heart } from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Column */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md">
                <Sprout className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight">
                AGRI<span className="text-emerald-400">Bridge</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              India's premier B2B agricultural aggregation platform solving supply and demand fragmentation through pooled selling, pooled buying, and intelligent multi-stop farm logistics.
            </p>
            <div className="pt-2">
              <LanguageSelector />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link to="/how-it-works" className="hover:text-emerald-400 transition">How AgriBridge Works</Link>
              </li>
              <li>
                <Link to="/market" className="hover:text-emerald-400 transition">Live Mandi Prices</Link>
              </li>
              <li>
                <Link to="/schemes" className="hover:text-emerald-400 transition">Government Schemes</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-emerald-400 transition">Farmer & Buyer Login</Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-emerald-400 transition">Register Farm or Business</Link>
              </li>
            </ul>
          </div>

          {/* Core Pillars */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Value Proposition
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <Scale className="w-3.5 h-3.5 text-emerald-400" />
                <span>Supply Aggregation (Pooled Selling)</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                <span>Demand Aggregation (Bulk Pricing)</span>
              </li>
              <li className="flex items-center gap-2">
                <Truck className="w-3.5 h-3.5 text-amber-400" />
                <span>Heuristic TSP Route Optimization</span>
              </li>
              <li className="flex items-center gap-2">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                <span>Voice-First & Local Languages (Tamil, Hindi)</span>
              </li>
            </ul>
          </div>

          {/* Compliance & Disclaimers */}
          <div className="space-y-2 text-[11px] text-slate-400 bg-slate-800/50 p-4 rounded-2xl border border-slate-700/60">
            <h5 className="font-bold text-slate-200 uppercase tracking-wide">
              Official Disclaimers
            </h5>
            <p>
              • <strong>Market Data:</strong> Market information shown in this demo is sample data and should not be treated as live market pricing.
            </p>
            <p>
              • <strong>Government Schemes:</strong> Scheme eligibility shown is an informational estimate. Verify requirements on official portals before applying.
            </p>
            <p>
              • <strong>Logistics:</strong> Route shown is an optimization estimate (heuristic) and may differ from road conditions.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© 2026 AGRIBridge Inc. Designed for sustainable smallholder farming prosperity.</p>
          <p className="mt-2 sm:mt-0">Open Source B2B Agro Logistics Architecture</p>
        </div>
      </div>
    </footer>
  );
};
