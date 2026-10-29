import React, { useState, useEffect } from 'react';
import {
  Landmark,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Search,
  Sparkles,
  Calculator,
  Loader2,
  Info,
} from 'lucide-react';
import api from '../../services/api';
import { GovernmentScheme } from '../../types';

export const SchemesPublicPage: React.FC = () => {
  const [schemes, setSchemes] = useState<GovernmentScheme[]>([]);
  const [disclaimer, setDisclaimer] = useState('');
  const [search, setSearch] = useState('');

  // Interactive Calculator State
  const [state, setState] = useState('Tamil Nadu');
  const [landAcres, setLandAcres] = useState('2.5');
  const [farmerCategory, setFarmerCategory] = useState('Small (2.5 to 5 acres)');
  const [annualIncome, setAnnualIncome] = useState('180000');
  const [hasIrrigation, setHasIrrigation] = useState(true);
  const [crop, setCrop] = useState('Tomato');

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResults, setEvaluationResults] = useState<any[] | null>(null);

  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        const res: any = await api.get('/schemes');
        if (res.success) {
          setSchemes(res.data);
          setDisclaimer(res.disclaimer);
        }
      } catch (e) {
        console.error('Failed to load schemes', e);
      }
    };
    fetchSchemes();
  }, []);

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEvaluating(true);

    try {
      const res: any = await api.post('/schemes/check-eligibility', {
        state,
        totalLandAcres: parseFloat(landAcres) || 2.5,
        cropsGrown: [crop],
        farmerCategory,
        annualIncome: parseFloat(annualIncome) || 180000,
        hasIrrigation,
      });

      if (res.success) {
        setEvaluationResults(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsEvaluating(false);
    }
  };

  const filteredSchemes = schemes.filter(
    (s) =>
      s.schemeName.toLowerCase().includes(search.toLowerCase()) ||
      s.ministry.toLowerCase().includes(search.toLowerCase()) ||
      s.targetFarmerType.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Title */}
      <div>
        <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
          Government Welfare & Subsidies
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-1">
          Agricultural Schemes & Direct Benefit Portal
        </h1>
        <p className="text-sm text-slate-500 mt-2 max-w-2xl">
          Explore direct income support, crop loss insurance, and machinery subsidies from the Government of India and State Departments.
        </p>

        {/* Mandatory Scheme Disclaimer */}
        <div className="mt-4 p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-300">
          <Info className="w-4 h-4 shrink-0 text-amber-600" />
          <span>
            <strong>Disclaimer:</strong> {disclaimer || 'Scheme eligibility shown here is an informational estimate. Eligibility and application requirements may change. Verify details on the official government portal before applying.'}
          </span>
        </div>
      </div>

      {/* Interactive Eligibility Engine Card */}
      <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-white dark:from-slate-900 dark:to-slate-800 border border-emerald-200 dark:border-slate-700 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Instant Scheme Eligibility Engine
            </h3>
            <p className="text-xs text-slate-500">
              Provide your land size, state, and crop to check matching central and state assistance
            </p>
          </div>
        </div>

        <form onSubmit={handleEvaluate} className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">State</label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800"
            >
              <option value="Tamil Nadu">Tamil Nadu</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Andhra Pradesh">Andhra Pradesh</option>
              <option value="Kerala">Kerala</option>
              <option value="Telangana">Telangana</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Land (Acres)</label>
            <input
              type="number"
              step="0.5"
              value={landAcres}
              onChange={(e) => setLandAcres(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Primary Crop</label>
            <select
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800"
            >
              <option value="Tomato">Tomato</option>
              <option value="Onion">Onion</option>
              <option value="Paddy Rice (Sona Masoori)">Paddy Rice</option>
              <option value="Carrot">Carrot</option>
              <option value="Banana (Robusta/G9)">Banana</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Farmer Category</label>
            <select
              value={farmerCategory}
              onChange={(e) => setFarmerCategory(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800"
            >
              <option value="Marginal (Under 2.5 acres)">Marginal (&lt;2.5 acres)</option>
              <option value="Small (2.5 to 5 acres)">Small (2.5 - 5 acres)</option>
              <option value="Medium (5 to 10 acres)">Medium (5 - 10 acres)</option>
              <option value="Large (>10 acres)">Large (&gt;10 acres)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Annual Income (₹)</label>
            <input
              type="number"
              value={annualIncome}
              onChange={(e) => setAnnualIncome(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isEvaluating}
              className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-1.5 h-[34px]"
            >
              {isEvaluating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Evaluate Eligibility
            </button>
          </div>
        </form>

        {/* Evaluation Output Cards */}
        {evaluationResults && (
          <div className="mt-6 pt-6 border-t border-emerald-200/80 dark:border-slate-700 space-y-3">
            <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wide">
              Evaluation Results ({evaluationResults.length} Schemes Analyzed)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {evaluationResults.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border text-xs space-y-2 ${
                    item.status === 'ELIGIBLE'
                      ? 'bg-emerald-50/80 border-emerald-300 text-slate-800'
                      : item.status === 'POSSIBLY_ELIGIBLE'
                      ? 'bg-amber-50/80 border-amber-300 text-slate-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm">{item.shortCode}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] uppercase ${
                        item.status === 'ELIGIBLE'
                          ? 'bg-emerald-600 text-white'
                          : item.status === 'POSSIBLY_ELIGIBLE'
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-400 text-white'
                      }`}
                    >
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="font-bold text-slate-900">{item.schemeName}</p>
                  <p className="text-[11px] text-slate-600">{item.benefitsDescription}</p>

                  <ul className="text-[10px] space-y-0.5 text-slate-500 pt-1">
                    {item.reasons.map((r: string, rIdx: number) => (
                      <li key={rIdx}>• {r}</li>
                    ))}
                  </ul>

                  <div className="pt-1">
                    <a
                      href={item.applicationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:underline text-[11px]"
                    >
                      Apply on Official Portal <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Full Schemes Directory */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Official Schemes Directory
            </h3>
            <p className="text-xs text-slate-500">Government programs with active budgetary allocations</p>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search scheme name, ministry..."
              className="pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-64"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredSchemes.map((scheme) => (
            <div
              key={scheme.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-3 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {scheme.shortCode}
                  </span>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1.5">
                    {scheme.schemeName}
                  </h4>
                  <p className="text-xs text-slate-400 font-medium">{scheme.ministry}</p>
                </div>
                {scheme.benefitAmount && (
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 block">Benefit up to</span>
                    <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-400">
                      ₹{scheme.benefitAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {scheme.description}
              </p>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 text-[11px]">
                  State: <strong>{scheme.state}</strong> • For: {scheme.targetFarmerType}
                </span>
                <a
                  href={scheme.applicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  Official Portal <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
