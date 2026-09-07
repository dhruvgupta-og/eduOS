import React, { useState, useEffect } from 'react';
import { useEduOS } from '../../context/EduOSContext';
import { supabase } from '../../lib/supabase';
import { School, Plus, Shield, Check, Copy, ToggleLeft, ToggleRight, Server, RefreshCw, Key, AlertCircle } from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  const { session, logout } = useEduOS();
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  // Add school form
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [brandColor, setBrandColor] = useState('#2563eb');
  const [principalName, setPrincipalName] = useState('');
  const [principalEmail, setPrincipalEmail] = useState('');
  const [principalPhone, setPrincipalPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchSchools = async () => {
    setLoading(true);
    try {
      // First try backend API endpoint
      if (session?.access_token) {
        try {
          const res = await fetch('/api/vendor/schools', {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });
          if (res.ok) {
            const data = await res.json();
            if (data?.schools) {
              setSchools(data.schools);
              setLoading(false);
              return;
            }
          }
        } catch {
          // fallback to Supabase client
        }
      }

      // Supabase direct query fallback
      const { data: directSchools, error } = await supabase
        .from('schools')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && directSchools) {
        setSchools(directSchools);
      }
    } catch (err) {
      console.warn('Could not fetch schools:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, [session]);

  const handleToggleFeature = async (schoolId: string, flag: string, currentVal: boolean) => {
    const school = schools.find((s) => s.id === schoolId);
    if (!school) return;

    const currentFlags = school.feature_flags || { attendance: true, fees: true, homework: true, announcements: true };
    const updatedFlags = { ...currentFlags, [flag]: !currentVal };

    try {
      const res = await fetch(`/api/vendor/schools/${schoolId}/features`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ feature_flags: updatedFlags }),
      });

      if (res.ok) {
        setSchools((prev) =>
          prev.map((s) => (s.id === schoolId ? { ...s, feature_flags: updatedFlags } : s))
        );
      }
    } catch (e) {
      console.error('Failed to toggle feature flag:', e);
    }
  };

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/provision/school', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          name,
          slug,
          brand_color: brandColor,
          principalName,
          principalEmail,
          principalPhone,
          feature_flags: { attendance: true, fees: true, homework: true, announcements: true },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to provision school');
      }

      // Success
      setCreatedCredentials(data.principal);
      setShowAddModal(false);
      // Reset form
      setName('');
      setSlug('');
      setPrincipalName('');
      setPrincipalEmail('');
      setPrincipalPhone('');
      fetchSchools();
    } catch (err: any) {
      setSubmitError(err.message || 'Provisioning failed');
    } finally {
      setSubmitting(false);
    }
  };

  const copyCredentials = () => {
    if (!createdCredentials) return;
    const text = `EduOS Principal Credentials\nSchool ID: ${createdCredentials.school_id}\nEmail: ${createdCredentials.email}\nTemporary Password: ${createdCredentials.tempPassword}\nLogin at: ${window.location.origin}/login`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 font-sans pb-12">
      {/* Top Navigation */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-20 px-4 py-3 sm:px-6 sm:py-4 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center font-bold shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold">Vendor Console</h1>
              <p className="text-[11px] sm:text-xs text-stone-500">Super Admin Global Control Plane</p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition min-h-[40px] sm:min-h-0"
            >
              <Plus className="w-4 h-4" />
              <span>Onboard School</span>
            </button>
            <button
              onClick={logout}
              className="px-3.5 py-2 border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs sm:text-sm font-medium rounded-xl transition min-h-[40px] sm:min-h-0 shrink-0"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
        {/* Header stats bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-5">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-3.5 sm:gap-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <School className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-stone-500 uppercase tracking-wider">Active Tenants</p>
              <h3 className="text-xl sm:text-2xl font-bold text-stone-900">{schools.length}</h3>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-3.5 sm:gap-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Server className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-stone-500 uppercase tracking-wider">Multi-Tenant Isolation</p>
              <h3 className="text-sm sm:text-base font-bold text-stone-900">PostgreSQL RLS Active</h3>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-3.5 sm:gap-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Key className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-stone-500 uppercase tracking-wider">Auth Engine</p>
              <h3 className="text-sm sm:text-base font-bold text-stone-900">Supabase GoTrue (JWT)</h3>
            </div>
          </div>
        </div>

        {/* Schools Table */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-stone-900">Provisioned Schools</h2>
              <p className="text-xs text-stone-500">Manage tenant instances and toggle modular feature flags</p>
            </div>
            <button
              onClick={fetchSchools}
              className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition"
              title="Refresh Schools"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loading ? (
            <div className="p-8 sm:p-12 text-center text-stone-400">
              <div className="w-6 h-6 border-2 border-stone-900 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm">Loading schools from Supabase...</p>
            </div>
          ) : schools.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <School className="w-10 h-10 sm:w-12 sm:h-12 text-stone-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-stone-800">No schools provisioned yet</h3>
              <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto mt-1 mb-4">
                Click "Onboard School" to create your first tenant and generate credentials for the Principal.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-stone-800"
              >
                <Plus className="w-4 h-4" />
                <span>Onboard First School</span>
              </button>
            </div>
          ) : (
            <>
              {/* Mobile School Cards */}
              <div className="block md:hidden divide-y divide-stone-100">
                {schools.map((school) => {
                  const flags = school.feature_flags || { attendance: true, fees: true, homework: true, announcements: true };
                  return (
                    <div key={school.id} className="p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-xs"
                          style={{ backgroundColor: school.brand_color || '#2563eb' }}
                        >
                          {school.name?.charAt(0) || 'S'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-stone-900 text-sm">{school.name}</h3>
                          <div className="flex items-center gap-2 text-xs text-stone-500 font-mono mt-0.5">
                            <span>Slug: {school.slug || school.code || '-'}</span>
                            <span>•</span>
                            <span
                              className="w-2.5 h-2.5 rounded-full inline-block"
                              style={{ backgroundColor: school.brand_color || '#2563eb' }}
                            ></span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">Module Feature Flags</p>
                        <div className="grid grid-cols-2 gap-2">
                          {['attendance', 'fees', 'homework', 'announcements'].map((flagKey) => {
                            const active = !!flags[flagKey];
                            return (
                              <button
                                key={flagKey}
                                onClick={() => handleToggleFeature(school.id, flagKey, active)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition border ${
                                  active
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                    : 'bg-stone-100 border-stone-200 text-stone-500'
                                }`}
                              >
                                <span className="capitalize">{flagKey}</span>
                                {active ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4 text-stone-400" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm text-stone-700">
                  <thead className="bg-stone-50 border-b border-stone-200 text-xs uppercase font-semibold text-stone-500">
                    <tr>
                      <th className="py-3.5 px-5">School Name</th>
                      <th className="py-3.5 px-5">Slug / Domain</th>
                      <th className="py-3.5 px-5">Brand Color</th>
                      <th className="py-3.5 px-5">Feature Flags</th>
                      <th className="py-3.5 px-5">Created At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {schools.map((school) => {
                      const flags = school.feature_flags || { attendance: true, fees: true, homework: true, announcements: true };
                      return (
                        <tr key={school.id} className="hover:bg-stone-50/70 transition">
                          <td className="py-4 px-5 font-semibold text-stone-900 flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
                              style={{ backgroundColor: school.brand_color || '#2563eb' }}
                            >
                              {school.name?.charAt(0) || 'S'}
                            </div>
                            <div>
                              <div>{school.name}</div>
                              <div className="text-xs text-stone-400 font-mono">{school.id}</div>
                            </div>
                          </td>
                          <td className="py-4 px-5 font-mono text-xs">{school.slug || school.code || '-'}</td>
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-4 h-4 rounded-full border border-stone-300"
                                style={{ backgroundColor: school.brand_color || '#2563eb' }}
                              ></span>
                              <span className="font-mono text-xs text-stone-600">{school.brand_color || '#2563eb'}</span>
                            </div>
                          </td>
                          <td className="py-4 px-5">
                            <div className="flex flex-wrap gap-2">
                              {['attendance', 'fees', 'homework', 'announcements'].map((flagKey) => {
                                const active = !!flags[flagKey];
                                return (
                                  <button
                                    key={flagKey}
                                    onClick={() => handleToggleFeature(school.id, flagKey, active)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border ${
                                      active
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                                        : 'bg-stone-100 border-stone-200 text-stone-500 hover:bg-stone-200'
                                    }`}
                                  >
                                    {active ? <ToggleRight className="w-3.5 h-3.5 text-emerald-600" /> : <ToggleLeft className="w-3.5 h-3.5 text-stone-400" />}
                                    <span className="capitalize">{flagKey}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                          <td className="py-4 px-5 text-xs text-stone-500 font-mono">
                            {school.created_at ? new Date(school.created_at).toLocaleDateString() : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Modal: Onboard New School */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto my-auto">
            <h3 className="text-lg font-bold text-stone-900">Onboard New School Tenant</h3>
            <p className="text-xs text-stone-500 mt-1 mb-5">
              This will create a school record and provision the initial Principal credentials in Supabase Auth.
            </p>

            {submitError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSchool} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">School Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Greenwood International Academy"
                  className="w-full px-3.5 py-2.5 sm:py-2 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-stone-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">Subdomain / Slug</label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="greenwood"
                    className="w-full px-3.5 py-2.5 sm:py-2 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">Brand Color</label>
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="w-full h-11 sm:h-10 p-1 border border-stone-300 rounded-xl cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-stone-100">
                <p className="text-xs font-bold text-stone-800 uppercase tracking-wider mb-2">Initial Principal Account</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-stone-600 mb-1">Principal Full Name</label>
                    <input
                      type="text"
                      required
                      value={principalName}
                      onChange={(e) => setPrincipalName(e.target.value)}
                      placeholder="Dr. Eleanor Vance"
                      className="w-full px-3.5 py-2.5 sm:py-2 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-600 mb-1">Principal Email</label>
                    <input
                      type="email"
                      required
                      value={principalEmail}
                      onChange={(e) => setPrincipalEmail(e.target.value)}
                      placeholder="principal@greenwood.edu"
                      className="w-full px-3.5 py-2.5 sm:py-2 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-600 mb-1">Phone (Optional)</label>
                    <input
                      type="tel"
                      value={principalPhone}
                      onChange={(e) => setPrincipalPhone(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="w-full px-3.5 py-2.5 sm:py-2 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-stone-900"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 text-sm text-stone-600 hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-sm font-semibold shadow-sm transition disabled:opacity-50 min-h-[44px]"
                >
                  {submitting ? 'Provisioning...' : 'Provision Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: One-time Principal Credentials */}
      {createdCredentials && (
        <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border-2 border-emerald-500 animate-in fade-in zoom-in-95 my-auto">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Key className="w-6 h-6" />
            </div>
            <h3 className="text-center text-lg font-bold text-stone-900">Principal Credentials Provisioned</h3>
            <p className="text-center text-xs text-stone-500 mt-1 mb-4">
              Copy and share these one-time temporary credentials with the Principal.
            </p>

            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2 text-xs font-mono break-all">
              <div>
                <span className="text-stone-500">Name:</span> <span className="font-semibold text-stone-800">{createdCredentials.full_name}</span>
              </div>
              <div>
                <span className="text-stone-500">Email:</span> <span className="font-semibold text-stone-800">{createdCredentials.email}</span>
              </div>
              <div>
                <span className="text-stone-500">Temp Password:</span>{' '}
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {createdCredentials.tempPassword}
                </span>
              </div>
              <div>
                <span className="text-stone-500">School ID:</span> <span className="text-stone-600">{createdCredentials.school_id}</span>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <button
                onClick={copyCredentials}
                className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 min-h-[44px]"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Credentials'}</span>
              </button>
              <button
                onClick={() => setCreatedCredentials(null)}
                className="w-full py-2.5 text-sm text-stone-600 hover:text-stone-900 font-medium min-h-[44px]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
