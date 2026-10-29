import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sprout,
  Users,
  Truck,
  ArrowDown,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  PackageCheck,
  Building,
} from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Title */}
      <div className="text-center max-w-3xl mx-auto">
        <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
          Architecture & Flow
        </span>
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mt-2">
          How AgriBridge Aggregation Works
        </h1>
        <p className="mt-4 text-slate-600 dark:text-slate-300 text-base leading-relaxed">
          AgriBridge operates two complementary pooling mechanisms: Supply Aggregation for small farmers and Demand Aggregation for business buyers.
        </p>
      </div>

      {/* Visual Comparison: Farmer Flow vs Buyer Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* FARMER FLOW */}
        <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Farmer Flow: Supply Pooling
              </h2>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                Turning Individual 50kg Lots into 500kg Wholesale Batches
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 rounded-2xl">
              <div className="text-xs font-bold text-emerald-800 uppercase">Step 1: Small Farms</div>
              <p className="text-sm font-semibold text-slate-800 mt-1">
                Farmer A (100 kg) + Farmer B (150 kg) + Farmer C (250 kg)
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Smallholders log produce quantity & expected price.</p>
            </div>

            <div className="flex justify-center text-emerald-600">
              <ArrowDown className="w-5 h-5 animate-bounce" />
            </div>

            <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 rounded-2xl">
              <div className="text-xs font-bold text-emerald-800 uppercase">Step 2: Pool Produce</div>
              <p className="text-sm font-semibold text-slate-800 mt-1">
                Unified Supply Pool (500 kg Tomatoes)
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Cluster formed based on geographic proximity and harvest window.</p>
            </div>

            <div className="flex justify-center text-emerald-600">
              <ArrowDown className="w-5 h-5 animate-bounce" />
            </div>

            <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 rounded-2xl">
              <div className="text-xs font-bold text-emerald-800 uppercase">Step 3: Match Bulk Buyer</div>
              <p className="text-sm font-semibold text-slate-800 mt-1">
                Supermarket / Wholesaler Match
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Automated matching score based on price, quality grade, and date.</p>
            </div>

            <div className="flex justify-center text-emerald-600">
              <ArrowDown className="w-5 h-5 animate-bounce" />
            </div>

            <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 rounded-2xl">
              <div className="text-xs font-bold text-emerald-800 uppercase">Step 4: Optimized Pickup Route</div>
              <p className="text-sm font-semibold text-slate-800 mt-1">
                Farm A → Farm B → Farm C → Buyer Dock
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Truck arrives sequentially to collect all pooled produce.</p>
            </div>
          </div>
        </div>

        {/* BUYER FLOW */}
        <div className="bg-white dark:bg-slate-900 border border-sky-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Buyer Flow: Demand Pooling
              </h2>
              <p className="text-xs text-sky-700 dark:text-sky-400 font-semibold">
                Unlocking Wholesale Farm-Gate Rates for Small Retailers
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-sky-50/70 dark:bg-sky-950/20 border border-sky-200 rounded-2xl">
              <div className="text-xs font-bold text-sky-800 uppercase">Step 1: Small Requirements</div>
              <p className="text-sm font-semibold text-slate-800 mt-1">
                Buyer A (100 kg) + Buyer B (150 kg) + Buyer C (250 kg)
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Small shops, cloud kitchens, and restaurants post weekly needs.</p>
            </div>

            <div className="flex justify-center text-sky-600">
              <ArrowDown className="w-5 h-5 animate-bounce" />
            </div>

            <div className="p-4 bg-sky-50/70 dark:bg-sky-950/20 border border-sky-200 rounded-2xl">
              <div className="text-xs font-bold text-sky-800 uppercase">Step 2: Pool Demand</div>
              <p className="text-sm font-semibold text-slate-800 mt-1">
                Aggregated 500 kg Demand Pool
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Combined volume unlocks direct farm-gate bulk pricing.</p>
            </div>

            <div className="flex justify-center text-sky-600">
              <ArrowDown className="w-5 h-5 animate-bounce" />
            </div>

            <div className="p-4 bg-sky-50/70 dark:bg-sky-950/20 border border-sky-200 rounded-2xl">
              <div className="text-xs font-bold text-sky-800 uppercase">Step 3: Match Farmer Pool</div>
              <p className="text-sm font-semibold text-slate-800 mt-1">
                Securing Fresh Harvest Directly
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Direct farm-gate sourcing eliminates APMC middleman margins.</p>
            </div>

            <div className="flex justify-center text-sky-600">
              <ArrowDown className="w-5 h-5 animate-bounce" />
            </div>

            <div className="p-4 bg-sky-50/70 dark:bg-sky-950/20 border border-sky-200 rounded-2xl">
              <div className="text-xs font-bold text-sky-800 uppercase">Step 4: Consolidated Delivery</div>
              <p className="text-sm font-semibold text-slate-800 mt-1">
                Safe Transport & Escrow Payment
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Quality inspected upon delivery before payment is released.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Box */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 text-center space-y-4">
        <h3 className="text-2xl font-bold">Experience the Complete Demo Flow Right Now</h3>
        <p className="text-sm text-slate-300 max-w-xl mx-auto">
          Sign into the pre-seeded demo accounts to see how Farmer A, Farmer B, and Farmer C pool 500 kg of fresh tomatoes for Buyer A with an optimized Leaflet pickup route.
        </p>
        <div className="pt-2">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition"
          >
            Launch Live Demo <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
