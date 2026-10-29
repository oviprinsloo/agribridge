import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sprout,
  Users,
  Truck,
  TrendingUp,
  Landmark,
  Mic,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Scale,
  Sparkles,
  ChevronRight,
  Layers,
  MapPin,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export const LandingPage: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="space-y-24 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 md:pt-20 pb-16 bg-gradient-to-b from-brand-50/80 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-200/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-accent-amber/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-300 text-emerald-900 text-xs font-bold tracking-wide uppercase shadow-xs mb-6">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Next-Gen B2B Agricultural Marketplace
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight max-w-4xl mx-auto leading-[1.12]">
            From Small Farms to <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-green-600 to-teal-700">Big Markets.</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            AgriBridge connects small & marginal farmers directly with bulk business buyers through <strong className="text-emerald-700 dark:text-emerald-400">pooled supply</strong>, <strong className="text-emerald-700 dark:text-emerald-400">pooled demand</strong>, and <strong className="text-emerald-700 dark:text-emerald-400">smarter multi-stop logistics</strong>.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register?role=FARMER"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-lg shadow-emerald-600/30 hover:shadow-xl transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <Sprout className="w-5 h-5" />
              {t('joinAsFarmer', 'Join as Farmer')}
            </Link>

            <Link
              to="/register?role=BUYER"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-base shadow-lg shadow-slate-900/20 hover:shadow-xl transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2 border border-slate-700"
            >
              <Users className="w-5 h-5" />
              {t('buyInBulk', 'Buy in Bulk')}
            </Link>
          </div>

          {/* Quick Demo Preview Pills */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-semibold">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Pooled Supply Aggregation
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Multi-Stop Pickup Route Optimization
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Direct Bank & Escrow Protection
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Tamil, Hindi & Voice AI
            </span>
          </div>
        </div>
      </section>

      {/* 2. THE CORE PROBLEM SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-3xl p-8 md:p-12 shadow-xl border border-slate-800 relative overflow-hidden">
          <div className="max-w-3xl">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
              The Real Ground Challenge
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mt-2">
              Individual small farms can't fulfill B2B bulk orders. AgriBridge bridges the gap.
            </h2>
            <p className="mt-4 text-slate-300 text-sm md:text-base leading-relaxed">
              86% of Indian farmers are smallholders with less than 2 hectares. When a retailer or restaurant wants 500 kg of fresh tomatoes, an individual farmer with 50 kg is turned away by middlemen or forced to sell at distressed prices.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-2 text-rose-400 text-sm font-bold mb-2">
                Traditional Fragmented Farming
              </div>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>• Individual small quantities rejected by bulk commercial buyers</li>
                <li>• Multiple middlemen taking 30% to 45% commission margin</li>
                <li>• Disorganized logistics leading to high transport cost and post-harvest spoilage</li>
                <li>• No transparency in mandi rates and delayed payments</li>
              </ul>
            </div>

            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-6">
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold mb-2">
                The AgriBridge Aggregation Advantage
              </div>
              <ul className="space-y-2 text-xs text-emerald-200">
                <li>• Small farmers pool compatible produce into unified bulk supply</li>
                <li>• Direct connection to verified supermarkets, hotels, and food processors</li>
                <li>• AI-optimized pickup routes reduce travel time & vehicle fuel costs</li>
                <li>• Safe digital escrow payouts released directly upon delivery confirmation</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3. THREE MAIN PILLARS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
            Three Core Capabilities
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mt-1">
            Built for Real Agricultural Scale
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Pillar 1 */}
          <div className="bg-white dark:bg-slate-900 border border-emerald-100 dark:border-slate-800 rounded-3xl p-8 shadow-xs hover:shadow-md transition">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-6">
              <Scale className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              1. Supply Aggregation
            </h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold mt-1">
              Pooled Selling for Smallholders
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-4 leading-relaxed">
              Farmer A (100 kg) + Farmer B (150 kg) + Farmer C (250 kg) form a unified 500 kg batch for a wholesale buyer. Strict validation prevents duplicate allocations.
            </p>
            <Link
              to="/farmer/pools"
              className="mt-6 inline-flex items-center text-xs font-bold text-emerald-600 hover:text-emerald-700"
            >
              Explore Supply Pools <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          {/* Pillar 2 */}
          <div className="bg-white dark:bg-slate-900 border border-sky-100 dark:border-slate-800 rounded-3xl p-8 shadow-xs hover:shadow-md transition">
            <div className="w-14 h-14 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 flex items-center justify-center mb-6">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              2. Demand Aggregation
            </h3>
            <p className="text-xs text-sky-700 dark:text-sky-400 font-semibold mt-1">
              Pooled Buying for Retailers & Hotels
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-4 leading-relaxed">
              Several small food businesses unite their requirements (100 kg + 150 kg + 250 kg) into a single 500 kg order, unlocking farm-gate wholesale prices.
            </p>
            <Link
              to="/buyer/pools"
              className="mt-6 inline-flex items-center text-xs font-bold text-sky-600 hover:text-sky-700"
            >
              Explore Demand Pools <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          {/* Pillar 3 */}
          <div className="bg-white dark:bg-slate-900 border border-amber-100 dark:border-slate-800 rounded-3xl p-8 shadow-xs hover:shadow-md transition">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center mb-6">
              <Truck className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              3. Smart Logistics
            </h3>
            <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold mt-1">
              Heuristic Route Optimization
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-4 leading-relaxed">
              Automated TSP collection route calculation (Farm A → Farm B → Farm C → Buyer Hub). Minimizes travel kilometers, diesel expense, and vegetable transit spoilage.
            </p>
            <Link
              to="/market"
              className="mt-6 inline-flex items-center text-xs font-bold text-amber-600 hover:text-amber-700"
            >
              View Route Simulator <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS FLOW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-950 text-white rounded-3xl p-8 md:p-12 shadow-xl">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
              Seamless End-to-End Workflow
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold mt-1">
              From Farm Gate to Buyer Dock in 5 Simple Steps
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white/10 rounded-2xl p-5 border border-white/10 text-center">
              <div className="w-8 h-8 rounded-full bg-emerald-500 font-extrabold text-sm flex items-center justify-center mx-auto mb-3">1</div>
              <h4 className="font-bold text-sm">List & Pool</h4>
              <p className="text-xs text-slate-300 mt-1">Farmers add available produce and join localized supply pools.</p>
            </div>

            <div className="bg-white/10 rounded-2xl p-5 border border-white/10 text-center">
              <div className="w-8 h-8 rounded-full bg-emerald-500 font-extrabold text-sm flex items-center justify-center mx-auto mb-3">2</div>
              <h4 className="font-bold text-sm">Smart Matching</h4>
              <p className="text-xs text-slate-300 mt-1">Engine matches compatible pools with bulk buyer purchase orders.</p>
            </div>

            <div className="bg-white/10 rounded-2xl p-5 border border-white/10 text-center">
              <div className="w-8 h-8 rounded-full bg-emerald-500 font-extrabold text-sm flex items-center justify-center mx-auto mb-3">3</div>
              <h4 className="font-bold text-sm">Route Planning</h4>
              <p className="text-xs text-slate-300 mt-1">Heuristic route optimizes sequential farm pickups for the truck.</p>
            </div>

            <div className="bg-white/10 rounded-2xl p-5 border border-white/10 text-center">
              <div className="w-8 h-8 rounded-full bg-emerald-500 font-extrabold text-sm flex items-center justify-center mx-auto mb-3">4</div>
              <h4 className="font-bold text-sm">Dual Confirmation</h4>
              <p className="text-xs text-slate-300 mt-1">Farmer confirms pickup; buyer inspects & confirms delivery.</p>
            </div>

            <div className="bg-white/10 rounded-2xl p-5 border border-white/10 text-center">
              <div className="w-8 h-8 rounded-full bg-emerald-500 font-extrabold text-sm flex items-center justify-center mx-auto mb-3">5</div>
              <h4 className="font-bold text-sm">Escrow Payout</h4>
              <p className="text-xs text-slate-300 mt-1">Funds held in platform escrow released directly to bank accounts.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CALL TO ACTION SECTION */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-slate-800 rounded-3xl p-10 shadow-lg">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Ready to Experience Transparent B2B Agro Pooling?
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xl mx-auto mt-3">
            Try our seeded live demo scenario or create your own farm produce listing and purchase requirement today.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md transition"
            >
              Sign In with 1-Click Demo Accounts
            </Link>
            <Link
              to="/market"
              className="w-full sm:w-auto px-8 py-3.5 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-sm transition"
            >
              Browse Live Mandi Rates
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
