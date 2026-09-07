import React, { useState } from 'react';
import { useEduOS } from '../../context/EduOSContext';
import { Users, GraduationCap, DollarSign, Calendar, Plus, Copy, Check, Key, AlertCircle, School } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const PrincipalDashboard: React.FC = () => {
  const {
    currentSchool,
    currentProfile,
    students,
    staff,
    feeStructures,
    feePayments,
    attendance,
    session,
    logout,
    refreshData
  } = useEduOS();

  const [activeTab, setActiveTab] = useState<'overview' | 'staff' | 'fees'>('overview');
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [createdStaffCreds, setCreatedStaffCreds] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  // New staff form
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffDesignation, setStaffDesignation] = useState('Senior Teacher');
  const [staffDepartment, setStaffDepartment] = useState('Mathematics');
  const [staffRole, setStaffRole] = useState('teacher');
  const [submittingStaff, setSubmittingStaff] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);

  // New Fee Structure form
  const [feeHead, setFeeHead] = useState('');
  const [feeAmount, setFeeAmount] = useState('');
  const [feeTerm, setFeeTerm] = useState('Term 1 - 2026');
  const [submittingFee, setSubmittingFee] = useState(false);
  const [feeError, setFeeError] = useState<string | null>(null);

  const totalFeeCollected = feePayments.reduce((acc, curr) => acc + (Number(curr.amount_paid) || 0), 0);
  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.filter((a) => a.date === today);
  const attendanceRate = todayAttendance.length > 0
    ? Math.round((todayAttendance.filter((a) => a.status === 'present').length / todayAttendance.length) * 100)
    : 0;

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingStaff(true);
    setStaffError(null);

    try {
      const res = await fetch('/api/provision/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          name: staffName,
          email: staffEmail,
          phone: staffPhone,
          role: staffRole,
          designation: staffDesignation,
          department: staffDepartment,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to provision staff member');
      }

      setCreatedStaffCreds(data.credentials);
      setShowStaffModal(false);
      setStaffName('');
      setStaffEmail('');
      setStaffPhone('');
      await refreshData();
    } catch (err: any) {
      setStaffError(err.message || 'Staff provisioning failed');
    } finally {
      setSubmittingStaff(false);
    }
  };

  const handleCreateFeeStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feeHead || !feeAmount) return;
    setSubmittingFee(true);
    setFeeError(null);

    try {
      const { error } = await supabase.from('fee_structure').insert([
        {
          school_id: currentSchool?.id,
          fee_head: feeHead,
          amount: parseFloat(feeAmount),
          term: feeTerm,
        },
      ]);

      if (error) throw error;
      setFeeHead('');
      setFeeAmount('');
      await refreshData();
    } catch (err: any) {
      setFeeError(err.message || 'Failed to add fee structure');
    } finally {
      setSubmittingFee(false);
    }
  };

  const copyCredentials = () => {
    if (!createdStaffCreds) return;
    const text = `EduOS Staff Credentials\nName: ${createdStaffCreds.fullName}\nEmail: ${createdStaffCreds.email}\nTemporary Password: ${createdStaffCreds.password}\nLogin at: ${window.location.origin}/login`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 font-sans pb-12">
      {/* Top Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-20 px-4 py-3 sm:px-6 sm:py-4 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl text-white flex items-center justify-center font-bold shadow-sm shrink-0"
                style={{ backgroundColor: 'var(--school-brand, #2563eb)' }}
              >
                <School className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-stone-900 truncate max-w-[200px] sm:max-w-xs md:max-w-none">
                  {currentSchool?.name || 'School Dashboard'}
                </h1>
                <p className="text-[11px] sm:text-xs text-stone-500 truncate">
                  Principal Console • <span className="font-semibold text-stone-800">{currentProfile?.full_name}</span>
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              className="md:hidden px-3 py-1.5 border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-medium rounded-xl transition shrink-0"
            >
              Sign Out
            </button>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-2 sm:gap-3 overflow-x-auto no-scrollbar">
            <nav className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-semibold shrink-0">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-2 sm:py-1.5 rounded-lg transition whitespace-nowrap ${
                  activeTab === 'overview' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('staff')}
                className={`px-3 py-2 sm:py-1.5 rounded-lg transition whitespace-nowrap ${
                  activeTab === 'staff' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Staff ({staff.length})
              </button>
              <button
                onClick={() => setActiveTab('fees')}
                className={`px-3 py-2 sm:py-1.5 rounded-lg transition whitespace-nowrap ${
                  activeTab === 'fees' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Fees & Finance
              </button>
            </nav>
            <button
              onClick={logout}
              className="hidden md:block px-3.5 py-1.5 border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-medium rounded-xl transition shrink-0"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
        {/* STATS OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-5 sm:space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs font-semibold text-stone-500 uppercase tracking-wider truncate">Students</p>
                  <h3 className="text-xl sm:text-2xl font-bold text-stone-900">{students.length}</h3>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs font-semibold text-stone-500 uppercase tracking-wider truncate">Staff</p>
                  <h3 className="text-xl sm:text-2xl font-bold text-stone-900">{staff.length}</h3>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs font-semibold text-stone-500 uppercase tracking-wider truncate">Fees Paid</p>
                  <h3 className="text-xl sm:text-2xl font-bold text-stone-900">${totalFeeCollected.toLocaleString()}</h3>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs font-semibold text-stone-500 uppercase tracking-wider truncate">Attendance</p>
                  <h3 className="text-xl sm:text-2xl font-bold text-stone-900">{todayAttendance.length > 0 ? `${attendanceRate}%` : 'Pending'}</h3>
                </div>
              </div>
            </div>

            {/* Recent Students Overview */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-stone-200">
                <h2 className="text-sm sm:text-base font-bold text-stone-900">Registered Students</h2>
                <p className="text-xs text-stone-500">Overview of student cohort and admission registry</p>
              </div>
              {students.length === 0 ? (
                <div className="p-8 sm:p-12 text-center text-stone-400">
                  <GraduationCap className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-stone-300" />
                  <p className="text-sm">No students registered yet in this school instance.</p>
                </div>
              ) : (
                <>
                  {/* Mobile Card List */}
                  <div className="block md:hidden divide-y divide-stone-100">
                    {students.slice(0, 8).map((s) => (
                      <div key={s.id} className="p-4 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-stone-900 text-sm">{s.name || s.full_name}</span>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {s.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-stone-500 font-mono">
                          <span>Adm: {s.admission_no || s.admission_number}</span>
                          <span>•</span>
                          <span>Roll: {s.roll_no || s.roll_number || '-'}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm text-stone-700">
                      <thead className="bg-stone-50 border-b border-stone-200 text-xs uppercase font-semibold text-stone-500">
                        <tr>
                          <th className="py-3 px-5">Student Name</th>
                          <th className="py-3 px-5">Admission No</th>
                          <th className="py-3 px-5">Roll No</th>
                          <th className="py-3 px-5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {students.slice(0, 8).map((s) => (
                          <tr key={s.id} className="hover:bg-stone-50/70">
                            <td className="py-3 px-5 font-semibold text-stone-900">{s.name || s.full_name}</td>
                            <td className="py-3 px-5 font-mono text-xs">{s.admission_no || s.admission_number}</td>
                            <td className="py-3 px-5 font-mono text-xs">{s.roll_no || s.roll_number || '-'}</td>
                            <td className="py-3 px-5">
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {s.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* STAFF MANAGEMENT TAB */}
        {activeTab === 'staff' && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-stone-900">Faculty & Staff Directory</h2>
                <p className="text-xs text-stone-500">Provision teaching staff with automated Supabase Auth accounts</p>
              </div>
              <button
                onClick={() => setShowStaffModal(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition shadow-sm min-h-[44px] sm:min-h-0"
              >
                <Plus className="w-4 h-4" />
                <span>Provision Staff Member</span>
              </button>
            </div>

            {staff.length === 0 ? (
              <div className="p-8 sm:p-12 text-center text-stone-400">
                <Users className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-stone-300" />
                <p className="text-sm">No staff members provisioned yet.</p>
                <button
                  onClick={() => setShowStaffModal(true)}
                  className="mt-3 px-4 py-2.5 bg-stone-900 text-white text-xs font-semibold rounded-xl"
                >
                  Provision First Staff
                </button>
              </div>
            ) : (
              <>
                {/* Mobile Cards */}
                <div className="block md:hidden divide-y divide-stone-100">
                  {staff.map((st) => (
                    <div key={st.id} className="p-4 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-stone-900 text-sm">{st.full_name || st.name}</span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-stone-100 text-stone-700">
                          {st.designation || 'Staff'}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-stone-600 truncate">{st.email}</div>
                      <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
                        <span>Dept: {st.department || 'General'}</span>
                        <span className="font-mono text-[11px]">{st.joining_date || '-'}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-sm text-stone-700">
                    <thead className="bg-stone-50 border-b border-stone-200 text-xs uppercase font-semibold text-stone-500">
                      <tr>
                        <th className="py-3.5 px-5">Name</th>
                        <th className="py-3.5 px-5">Email</th>
                        <th className="py-3.5 px-5">Designation</th>
                        <th className="py-3.5 px-5">Department</th>
                        <th className="py-3.5 px-5">Joining Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {staff.map((st) => (
                        <tr key={st.id} className="hover:bg-stone-50/70">
                          <td className="py-3.5 px-5 font-semibold text-stone-900">{st.full_name || st.name}</td>
                          <td className="py-3.5 px-5 text-xs font-mono text-stone-600">{st.email}</td>
                          <td className="py-3.5 px-5">{st.designation}</td>
                          <td className="py-3.5 px-5">{st.department || '-'}</td>
                          <td className="py-3.5 px-5 text-xs text-stone-500 font-mono">{st.joining_date || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* FEES & FINANCE TAB */}
        {activeTab === 'fees' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
            {/* Fee structure list */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-stone-200">
                <h2 className="text-sm sm:text-base font-bold text-stone-900">Fee Structures</h2>
                <p className="text-xs text-stone-500">Standard institutional fee heads and rates</p>
              </div>
              {feeStructures.length === 0 ? (
                <div className="p-8 sm:p-12 text-center text-stone-400">
                  <DollarSign className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-stone-300" />
                  <p className="text-sm">No fee heads configured.</p>
                </div>
              ) : (
                <>
                  {/* Mobile Fee Cards */}
                  <div className="block md:hidden divide-y divide-stone-100">
                    {feeStructures.map((f) => (
                      <div key={f.id} className="p-4 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-stone-900 text-sm">{f.fee_head}</div>
                          <div className="text-xs text-stone-500">{f.term}</div>
                        </div>
                        <div className="font-mono font-bold text-base text-stone-900">${f.amount}</div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm text-stone-700">
                      <thead className="bg-stone-50 border-b border-stone-200 text-xs uppercase font-semibold text-stone-500">
                        <tr>
                          <th className="py-3 px-5">Fee Head</th>
                          <th className="py-3 px-5">Term</th>
                          <th className="py-3 px-5">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {feeStructures.map((f) => (
                          <tr key={f.id} className="hover:bg-stone-50/70">
                            <td className="py-3 px-5 font-semibold text-stone-900">{f.fee_head}</td>
                            <td className="py-3 px-5 text-xs">{f.term}</td>
                            <td className="py-3 px-5 font-mono font-bold text-stone-900">${f.amount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* Add Fee Head Form */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-sm h-fit">
              <h3 className="text-base font-bold text-stone-900 mb-1">Add Fee Head</h3>
              <p className="text-xs text-stone-500 mb-4">Define a new fee head for student billings</p>

              {feeError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs mb-4">
                  {feeError}
                </div>
              )}

              <form onSubmit={handleCreateFeeStructure} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">Fee Head Name</label>
                  <input
                    type="text"
                    required
                    value={feeHead}
                    onChange={(e) => setFeeHead(e.target.value)}
                    placeholder="e.g. Tuition Fee Term 1"
                    className="w-full px-3.5 py-2.5 sm:py-2 border border-stone-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">Amount ($)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={feeAmount}
                    onChange={(e) => setFeeAmount(e.target.value)}
                    placeholder="1200.00"
                    className="w-full px-3.5 py-2.5 sm:py-2 border border-stone-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">Academic Term</label>
                  <input
                    type="text"
                    required
                    value={feeTerm}
                    onChange={(e) => setFeeTerm(e.target.value)}
                    placeholder="Term 1 - 2026"
                    className="w-full px-3.5 py-2.5 sm:py-2 border border-stone-300 rounded-xl text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingFee}
                  className="w-full py-3 sm:py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-sm font-semibold transition min-h-[44px]"
                >
                  {submittingFee ? 'Adding...' : 'Add Fee Structure'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Modal: Provision Staff */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-stone-200 max-h-[92vh] overflow-y-auto my-auto">
            <h3 className="text-lg font-bold text-stone-900">Provision Faculty / Staff</h3>
            <p className="text-xs text-stone-500 mt-1 mb-4">
              Creates a profile scoped to {currentSchool?.name} and provisions temporary login credentials.
            </p>

            {staffError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{staffError}</span>
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="Sarah Jenkins"
                  className="w-full px-3.5 py-2.5 sm:py-2 border border-stone-300 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="s.jenkins@school.edu"
                  className="w-full px-3.5 py-2.5 sm:py-2 border border-stone-300 rounded-xl text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Designation</label>
                  <input
                    type="text"
                    required
                    value={staffDesignation}
                    onChange={(e) => setStaffDesignation(e.target.value)}
                    placeholder="Teacher"
                    className="w-full px-3.5 py-2.5 sm:py-2 border border-stone-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={staffDepartment}
                    onChange={(e) => setStaffDepartment(e.target.value)}
                    placeholder="Science"
                    className="w-full px-3.5 py-2.5 sm:py-2 border border-stone-300 rounded-xl text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  className="px-4 py-2.5 text-sm text-stone-600 hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingStaff}
                  className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-sm font-semibold transition min-h-[44px]"
                >
                  {submittingStaff ? 'Provisioning...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Staff Credentials Display */}
      {createdStaffCreds && (
        <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border-2 border-emerald-500 animate-in fade-in zoom-in-95 my-auto">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Key className="w-6 h-6" />
            </div>
            <h3 className="text-center text-lg font-bold text-stone-900">Staff Credentials Ready</h3>
            <p className="text-center text-xs text-stone-500 mt-1 mb-4">
              Share these one-time temporary credentials with the faculty member.
            </p>

            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2 text-xs font-mono break-all">
              <div>
                <span className="text-stone-500">Name:</span> <span className="font-semibold text-stone-800">{createdStaffCreds.fullName}</span>
              </div>
              <div>
                <span className="text-stone-500">Email:</span> <span className="font-semibold text-stone-800">{createdStaffCreds.email}</span>
              </div>
              <div>
                <span className="text-stone-500">Password:</span>{' '}
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {createdStaffCreds.password}
                </span>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <button
                onClick={copyCredentials}
                className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 min-h-[44px]"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy Credentials'}</span>
              </button>
              <button
                onClick={() => setCreatedStaffCreds(null)}
                className="w-full py-2.5 text-sm text-stone-600 hover:text-stone-900 min-h-[44px]"
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
