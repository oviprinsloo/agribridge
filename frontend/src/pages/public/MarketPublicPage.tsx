import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Search,
  Filter,
  BarChart2,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import api from '../../services/api';
import { MarketPrice } from '../../types';

export const MarketPublicPage: React.FC = () => {
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [trends, setTrends] = useState<any>(null);
  const [demands, setDemands] = useState<any[]>([]);
  const [regionalDemands, setRegionalDemands] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('Tomato');
  const [disclaimer, setDisclaimer] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [priceRes, trendRes, demandRes]: any[] = await Promise.all([
          api.get('/market/prices'),
          api.get(`/market/trends?cropName=${selectedCrop}`),
          api.get('/market/demand'),
        ]);

        if (priceRes.success) {
          setPrices(priceRes.data);
          setDisclaimer(priceRes.disclaimer);
        }
        if (trendRes.success) {
          setTrends(trendRes.data);
        }
        if (demandRes.success) {
          setDemands(demandRes.data.demands);
          setRegionalDemands(demandRes.data.regionalDemands);
        }
      } catch (e) {
        console.error('Failed to load market data', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedCrop]);

  const filteredPrices = prices.filter(
    (p) =>
      p.crop.name.toLowerCase().includes(search.toLowerCase()) ||
      p.marketName.toLowerCase().includes(search.toLowerCase()) ||
      p.district.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Title */}
      <div>
        <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
          Market Intelligence
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-1">
          Mandi Benchmark Rates & Regional Demand
        </h1>
        <p className="text-sm text-slate-500 mt-2 max-w-2xl">
          Track wholesale APMC modal prices, 30-day historical trends, and aggregated commercial buyer demand volumes.
        </p>

        {/* Mandatory Demo Data Disclaimer */}
        <div className="mt-4 p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>
            <strong>Disclaimer:</strong> {disclaimer || 'Market information shown in this demo is sample data and should not be treated as live market pricing.'}
          </span>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Trend Line Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Price Trend: {selectedCrop} (₹ / kg)
              </h3>
              <p className="text-xs text-slate-500">Historical modal price progression over the last month</p>
            </div>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-800"
            >
              <option value="Tomato">Tomato</option>
              <option value="Onion">Onion</option>
              <option value="Potato">Potato</option>
              <option value="Carrot">Carrot</option>
            </select>
          </div>

          <div className="h-64 w-full">
            {trends && trends.history ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends.history} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={['dataMin - 5', 'dataMax + 5']} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    formatter={(val: any) => [`₹${val}/kg`, 'Modal Price']}
                  />
                  <Line
                    type="monotone"
                    dataKey="modalPrice"
                    stroke="#16a34a"
                    strokeWidth={3}
                    dot={{ fill: '#16a34a', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">Loading chart...</div>
            )}
          </div>
        </div>

        {/* Regional Demand Bar Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Active Regional Demand (kg)
              </h3>
              <p className="text-xs text-slate-500">Commercial buyer orders waiting for supply pooling</p>
            </div>
            <BarChart2 className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="h-64 w-full">
            {regionalDemands.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regionalDemands} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="region" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    formatter={(val: any) => [`${val.toLocaleString()} kg`, 'Required Volume']}
                  />
                  <Bar dataKey="totalDemandKg" fill="#0284c7" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">Loading chart...</div>
            )}
          </div>
        </div>
      </div>

      {/* Mandi Price Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Benchmark APMC Mandi Feed
            </h3>
            <p className="text-xs text-slate-500">Daily modal rates from major South Indian agricultural markets</p>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search crop, mandi, district..."
              className="pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-3.5">Crop</th>
                <th className="px-6 py-3.5">Mandi / Market</th>
                <th className="px-6 py-3.5">District / State</th>
                <th className="px-6 py-3.5">Min Price</th>
                <th className="px-6 py-3.5">Max Price</th>
                <th className="px-6 py-3.5 font-extrabold text-slate-800 dark:text-slate-100">Modal Price</th>
                <th className="px-6 py-3.5">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredPrices.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {item.crop.name}
                  </td>
                  <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-medium">
                    {item.marketName}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {item.district}, {item.state}
                  </td>
                  <td className="px-6 py-4 text-slate-600">₹{item.minPrice}/{item.crop.unit}</td>
                  <td className="px-6 py-4 text-slate-600">₹{item.maxPrice}/{item.crop.unit}</td>
                  <td className="px-6 py-4 font-extrabold text-emerald-700 dark:text-emerald-400 text-sm">
                    ₹{item.modalPrice}/{item.crop.unit}
                  </td>
                  <td className="px-6 py-4">
                    {item.trendDirection === 'UP' && (
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                        <ArrowUpRight className="w-3.5 h-3.5" /> Upward
                      </span>
                    )}
                    {item.trendDirection === 'DOWN' && (
                      <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full font-bold">
                        <ArrowDownRight className="w-3.5 h-3.5" /> Downward
                      </span>
                    )}
                    {item.trendDirection === 'STABLE' && (
                      <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full font-bold">
                        <Minus className="w-3.5 h-3.5" /> Stable
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
