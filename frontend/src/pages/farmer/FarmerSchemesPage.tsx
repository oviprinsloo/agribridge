import React, { useState, useEffect } from 'react';
import {
  Award,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Info,
  Filter,
  DollarSign,
  LandPlot,
  Building,
  Sparkles,
} from 'lucide-react';
import api from '../../services/api';
import { GovernmentScheme } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

export const FarmerSchemesPage: React.FC = () => {
  const { user } = useAuth();
  const [schemes, setSchemes] = useState<GovernmentScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | 'ELIGIBLE'>('ELIGIBLE');

  const fetchSchemes = async () => {
    try {
      setLoading(true);
      setError(null);
      // Evaluates eligibility for the logged in farmer profile
      const res: any = await api.get('/schemes/farmer/my-schemes');
      if (res.success) {
        setSchemes(res.data);
      } else {
        // Fallback to all schemes with standard check
        const allRes: any = await api.get('/schemes');
        if (allRes.success) {
          setSchemes(allRes.data);
        } else {
          setError(allRes.message || 'Failed to load schemes');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching schemes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, []);

  const filteredSchemes = schemes.filter((scheme) => {
    if (filterType === 'ELIGIBLE') {
      return scheme.status === 'ELIGIBLE' || scheme.status === 'POSSIBLY_ELIGIBLE';
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Government Schemes & Subsidies
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Personalized eligibility matching based on your farm acreage, crops, and state.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setFilterType('ELIGIBLE')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterType === 'ELIGIBLE' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Eligible for Me ({schemes.filter((s) => s.status === 'ELIGIBLE' || s.status === 'POSSIBLY_ELIGIBLE').length})
          </button>
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterType === 'ALL' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Schemes ({schemes.length})
          </button>
        </div>
      </div>

      {/* Mandatory Regulatory Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-amber-900">
        <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs sm:text-sm leading-relaxed">
          <strong>Official Notice:</strong> Scheme eligibility shown here is an informational estimate. Eligibility and
          application requirements may change. Verify details on the official government portal before applying.
        </p>
      </div>

      {/* Schemes Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-6 rounded-xl border border-red-200">
          <p className="font-semibold">{error}</p>
        </div>
      ) : filteredSchemes.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
          <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No Matching Schemes Found</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
            Switch the filter to "All Schemes" to view national agricultural programs.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSchemes.map((scheme) => {
            const isEligible = scheme.status === 'ELIGIBLE';
            const isPossible = scheme.status === 'POSSIBLY_ELIGIBLE';

            return (
              <div
                key={scheme.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                <div className="p-6">
                  {/* Status badge & short code */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-xs font-black px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg">
                      {scheme.shortCode}
                    </span>

                    <span
                      className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                        isEligible
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : isPossible
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {isEligible ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-emerald-600" /> Eligible
                        </>
                      ) : isPossible ? (
                        <>
                          <Sparkles className="w-3 h-3 text-blue-600" /> Likely Eligible
                        </>
                      ) : (
                        'Informational'
                      )}
                    </span>
                  </div>

                  <h3 className="font-bold text-lg text-slate-900 leading-snug">{scheme.schemeName}</h3>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-slate-400" /> {scheme.ministry}
                  </p>

                  <p className="text-xs text-slate-600 mt-3 line-clamp-3 leading-relaxed">
                    {scheme.description}
                  </p>

                  {/* Benefit highlights */}
                  <div className="mt-4 p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                      Direct Financial Benefit
                    </span>
                    <p className="text-sm font-bold text-emerald-950 mt-0.5">
                      {scheme.benefitAmount ? `₹${scheme.benefitAmount.toLocaleString()} per beneficiary` : scheme.benefitsDescription}
                    </p>
                  </div>

                  {/* Eligibility reasons */}
                  {scheme.reasons && scheme.reasons.length > 0 && (
                    <div className="mt-4 space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-700 block">Why you qualify:</span>
                      {scheme.reasons.map((reason, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-600">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer action link */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Jurisdiction: {scheme.state || 'Pan-India'}</span>

                  <a
                    href={scheme.applicationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
                  >
                    Apply on Portal <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
