import React, { useState, useEffect } from 'react';
import {
  Users,
  Package,
  Layers,
  Truck,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
  Search,
  Filter,
  TrendingUp,
  UserCheck,
  UserX,
  RefreshCw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();

  const [metrics, setMetrics] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Users filter
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');
  const [userSearch, setUserSearch] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Tab
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'USERS' | 'DISPUTES'>('OVERVIEW');

  // Dispute resolution state
  const [resolvingDisputeId, setResolvingDisputeId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState('Resolved after platform review and weight verification.');

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [metricsRes, usersRes, disputesRes]: any = await Promise.all([
        api.get('/admin/metrics'),
        api.get('/admin/users'),
        api.get('/disputes'),
      ]);

      if (metricsRes.success) {
        setMetrics(metricsRes.data.metrics);
        setCharts(metricsRes.data.charts);
      }
      if (usersRes.success) {
        setUsersList(usersRes.data);
      }
      if (disputesRes.success) {
        setDisputes(disputesRes.data);
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching admin metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    try {
      setUpdatingUserId(userId);
      const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
      const res: any = await api.put(`/admin/users/${userId}/status`, { status: newStatus });
      if (res.success) {
        setUsersList((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
        );
      } else {
        alert(res.message || 'Failed to update user status');
      }
    } catch (err: any) {
      alert(err.message || 'Error changing status');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleVerifyUser = async (userId: string) => {
    try {
      setUpdatingUserId(userId);
      const res: any = await api.put(`/admin/users/${userId}/verify`);
      if (res.success) {
        setUsersList((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isVerified: true } : u))
        );
      } else {
        alert(res.message || 'Failed to verify user');
      }
    } catch (err: any) {
      alert(err.message || 'Error verifying user');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleResolveDispute = async (disputeId: string, resolution: string) => {
    try {
      setResolvingDisputeId(disputeId);
      const res: any = await api.put(`/disputes/${disputeId}/resolve`, {
        resolution,
        adminNotes: resolutionNote,
      });

      if (res.success) {
        setDisputes((prev) =>
          prev.map((d) => (d.id === disputeId ? { ...d, status: 'RESOLVED', resolution } : d))
        );
        alert('Dispute marked as resolved.');
      } else {
        alert(res.message || 'Failed to resolve dispute');
      }
    } catch (err: any) {
      alert(err.message || 'Error resolving dispute');
    } finally {
      setResolvingDisputeId(null);
    }
  };

  const filteredUsers = usersList.filter((u) => {
    const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    const matchesSearch =
      userSearch === '' ||
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.phone.includes(userSearch);
    return matchesRole && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
            <span>Platform Administration & Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            AGRIBridge Executive Command Center
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time multi-sided aggregation metrics, user compliance, escrow releases, and dispute arbitration.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" /> Refresh Data
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'OVERVIEW'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          System Overview & Analytics
        </button>
        <button
          onClick={() => setActiveTab('USERS')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'USERS'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          User Accounts & Verification ({usersList.length})
        </button>
        <button
          onClick={() => setActiveTab('DISPUTES')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'DISPUTES'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Disputes & Arbitration ({disputes.filter((d) => d.status === 'OPEN').length} Open)
        </button>
      </div>

      {activeTab === 'OVERVIEW' && (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Farmers
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">{metrics?.totalFarmers || 0}</p>
              <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">Smallholders</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Buyers
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">{metrics?.totalBuyers || 0}</p>
              <span className="text-[10px] text-blue-600 font-semibold mt-0.5 block">B2B Institutional</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Supply Pools
              </span>
              <p className="text-2xl font-black text-emerald-700 mt-1">{metrics?.activeSupplyPools || 0}</p>
              <span className="text-[10px] text-slate-500 block mt-0.5">Active farm lots</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Demand Pools
              </span>
              <p className="text-2xl font-black text-purple-700 mt-1">{metrics?.activeDemandPools || 0}</p>
              <span className="text-[10px] text-slate-500 block mt-0.5">Pooled orders</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total GMV (₹)
              </span>
              <p className="text-xl font-black text-slate-900 mt-1">₹{(metrics?.totalGmv || 0).toLocaleString()}</p>
              <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">Platform volume</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Pending Disputes
              </span>
              <p className="text-2xl font-black text-amber-600 mt-1">{metrics?.pendingDisputes || 0}</p>
              <span className="text-[10px] text-amber-700 block mt-0.5">Awaiting resolution</span>
            </div>
          </div>

          {/* Visual Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Monthly GMV Trend */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Platform GMV & Volume Growth</h3>
                  <p className="text-xs text-slate-500">Gross merchandise value transacted through escrow</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg">
                  +38% MoM
                </span>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={charts?.monthlyTrend || []}>
                    <defs>
                      <linearGradient id="gmvGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'GMV']}
                    />
                    <Area
                      type="monotone"
                      dataKey="gmv"
                      stroke="#10b981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#gmvGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Crop Volume Distribution */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Crop Volume Distribution</h3>
                  <p className="text-xs text-slate-500">Aggregated quantities fulfilled by crop type (kg)</p>
                </div>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts?.cropVolumeChart || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="crop" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip formatter={(val: any) => [`${Number(val).toLocaleString()} kg`, 'Volume']} />
                    <Bar dataKey="volumeKg" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                      {(charts?.cropVolumeChart || []).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'USERS' && (
        <div className="space-y-4">
          {/* User search & filter */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search user name, email, or phone..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
              <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
              {['ALL', 'FARMER', 'BUYER', 'ADMIN'].map((rl) => (
                <button
                  key={rl}
                  onClick={() => setUserRoleFilter(rl)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    userRoleFilter === rl
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {rl === 'ALL' ? 'All Roles' : rl}
                </button>
              ))}
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-400 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-3.5">User</th>
                    <th className="px-6 py-3.5">Role</th>
                    <th className="px-6 py-3.5">Profile Info</th>
                    <th className="px-6 py-3.5">KYC Verified</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800">{u.name}</p>
                        <span className="text-xs text-slate-400">{u.email}</span>
                        <span className="text-xs text-slate-400 block">+91 {u.phone}</span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                            u.role === 'FARMER'
                              ? 'bg-emerald-100 text-emerald-800'
                              : u.role === 'BUYER'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-xs text-slate-600">
                        {u.role === 'FARMER' ? (
                          <span>
                            {u.farmerProfile?.farms?.length || 0} Farms registered &bull;{' '}
                            {u.farmerProfile?.totalAcres || 0} Acres
                          </span>
                        ) : u.role === 'BUYER' ? (
                          <span>
                            {u.buyerProfile?.businessName || 'Business'} &bull; {u.buyerProfile?.city}
                          </span>
                        ) : (
                          'Platform Admin'
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {u.isVerified ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle className="w-3.5 h-3.5" /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Unverified
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            u.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!u.isVerified && (
                            <button
                              onClick={() => handleVerifyUser(u.id)}
                              disabled={updatingUserId === u.id}
                              className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-xs font-bold transition-colors disabled:opacity-50"
                            >
                              Verify
                            </button>
                          )}

                          <button
                            onClick={() => handleToggleUserStatus(u.id, u.status)}
                            disabled={updatingUserId === u.id}
                            className={`px-2.5 py-1 rounded text-xs font-bold transition-colors disabled:opacity-50 ${
                              u.status === 'ACTIVE'
                                ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'DISPUTES' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Disputes & Order Arbitration</h2>
            <p className="text-xs text-slate-500 mb-6">
              Review filed quality or delivery weight issues and execute platform resolution.
            </p>

            {disputes.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <CheckCircle className="w-12 h-12 mx-auto text-emerald-400 mb-2" />
                <p className="text-sm font-bold text-slate-700">Zero Active Disputes</p>
                <p className="text-xs text-slate-400 mt-0.5">All order transactions and farm deliveries are in good standing.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {disputes.map((dispute) => (
                  <div
                    key={dispute.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-200 rounded text-slate-800">
                          {dispute.disputeNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                            dispute.status === 'OPEN'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {dispute.status}
                        </span>
                        <span className="text-xs font-semibold text-slate-600">
                          Order #{dispute.order?.orderNumber}
                        </span>
                      </div>

                      <p className="text-sm font-bold text-slate-900 mt-2">
                        Category: {dispute.category} &bull; Filed on{' '}
                        {new Date(dispute.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-slate-600 italic">"{dispute.description}"</p>
                    </div>

                    {dispute.status === 'OPEN' ? (
                      <div className="flex items-center gap-2 w-full md:w-auto">
                        <button
                          onClick={() => handleResolveDispute(dispute.id, 'REFUND_BUYER')}
                          disabled={resolvingDisputeId === dispute.id}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 disabled:opacity-50"
                        >
                          Refund Buyer
                        </button>
                        <button
                          onClick={() => handleResolveDispute(dispute.id, 'RELEASE_TO_FARMERS')}
                          disabled={resolvingDisputeId === dispute.id}
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Release to Farmers
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                        Resolution: {dispute.resolution || 'Settled'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
