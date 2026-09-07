import React, { useState } from 'react';
import { useEduOS } from '../../context/EduOSContext';
import { Calendar, BookOpen, DollarSign, Bell, CheckCircle, Clock, School, Send } from 'lucide-react';

export const StudentParentDashboard: React.FC = () => {
  const {
    currentSchool,
    currentProfile,
    currentRole,
    students,
    attendance,
    homework,
    homeworkSubmissions,
    feeStructures,
    feePayments,
    announcements,
    parentChildren,
    activeParentChildId,
    setActiveParentChildId,
    submitHomework,
    logout,
    refreshData
  } = useEduOS();

  const [activeTab, setActiveTab] = useState<'attendance' | 'homework' | 'fees' | 'announcements'>('attendance');

  // Active student context
  const activeStudent = currentRole === 'parent'
    ? parentChildren.find((c) => c.id === activeParentChildId) || parentChildren[0] || students[0]
    : students.find((s) => s.profile_id === currentProfile?.id) || students[0];

  const studentAttendance = activeStudent
    ? attendance.filter((a) => a.student_id === activeStudent.id)
    : [];

  const studentPayments = activeStudent
    ? feePayments.filter((p) => p.student_id === activeStudent.id)
    : [];

  // Homework submission state
  const [selectedHw, setSelectedHw] = useState<any | null>(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const [submittingHw, setSubmittingHw] = useState(false);

  const handleSubmitSolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHw || !activeStudent || !submissionContent) return;

    setSubmittingHw(true);
    await submitHomework(selectedHw.id, activeStudent.id, submissionContent);
    setSelectedHw(null);
    setSubmissionContent('');
    await refreshData();
    setSubmittingHw(false);
  };

  const presentCount = studentAttendance.filter((a) => a.status === 'present').length;
  const attendanceRate = studentAttendance.length > 0
    ? Math.round((presentCount / studentAttendance.length) * 100)
    : 100;

  const totalPaid = studentPayments.reduce((acc, curr) => acc + (Number(curr.amount_paid) || 0), 0);
  const totalFeesDue = feeStructures.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const balanceRemaining = Math.max(0, totalFeesDue - totalPaid);

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
                  {currentSchool?.name || 'Student & Guardian Portal'}
                </h1>
                <p className="text-[11px] sm:text-xs text-stone-500 truncate">
                  {currentRole === 'parent' ? 'Guardian Portal' : 'Student Portal'} • <span className="font-semibold text-stone-800">{currentProfile?.full_name}</span>
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
            {currentRole === 'parent' && parentChildren.length > 1 && (
              <div className="flex items-center gap-1.5 shrink-0 mr-1">
                <span className="text-[11px] text-stone-500 font-medium hidden sm:inline">Child:</span>
                <select
                  value={activeParentChildId || ''}
                  onChange={(e) => setActiveParentChildId(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-stone-300 rounded-xl bg-stone-50 font-semibold text-stone-800"
                >
                  {parentChildren.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name || c.full_name} ({c.admission_no || c.admission_number})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <nav className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-semibold shrink-0">
              <button
                onClick={() => setActiveTab('attendance')}
                className={`px-3 py-2 sm:py-1.5 rounded-lg transition whitespace-nowrap ${
                  activeTab === 'attendance' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Attendance
              </button>
              <button
                onClick={() => setActiveTab('homework')}
                className={`px-3 py-2 sm:py-1.5 rounded-lg transition whitespace-nowrap ${
                  activeTab === 'homework' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Homework ({homework.length})
              </button>
              <button
                onClick={() => setActiveTab('fees')}
                className={`px-3 py-2 sm:py-1.5 rounded-lg transition whitespace-nowrap ${
                  activeTab === 'fees' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Fees
              </button>
              <button
                onClick={() => setActiveTab('announcements')}
                className={`px-3 py-2 sm:py-1.5 rounded-lg transition whitespace-nowrap ${
                  activeTab === 'announcements' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Notices ({announcements.length})
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
        {/* Banner with student details */}
        {activeStudent && (
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Active Student Record</span>
              <h2 className="text-lg sm:text-xl font-bold text-stone-900">{activeStudent.name || activeStudent.full_name}</h2>
              <p className="text-xs text-stone-500 font-mono mt-0.5">
                Adm: <span className="text-stone-800 font-semibold">{activeStudent.admission_no || activeStudent.admission_number}</span> {activeStudent.roll_no ? `| Roll: ${activeStudent.roll_no}` : ''}
              </p>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-stone-100">
              <div className="text-left sm:text-right">
                <p className="text-[11px] sm:text-xs text-stone-500">Attendance Rate</p>
                <p className="text-base sm:text-lg font-bold text-emerald-600">{attendanceRate}%</p>
              </div>
              <div className="text-right border-l border-stone-200 pl-4 sm:pl-6">
                <p className="text-[11px] sm:text-xs text-stone-500">Fee Balance</p>
                <p className="text-base sm:text-lg font-bold text-stone-900">${balanceRemaining.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* ATTENDANCE TAB */}
        {activeTab === 'attendance' && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-stone-200">
              <h2 className="text-sm sm:text-base font-bold text-stone-900">Attendance Record</h2>
              <p className="text-xs text-stone-500">Official log of daily presence marked by faculty</p>
            </div>
            {studentAttendance.length === 0 ? (
              <div className="p-8 sm:p-12 text-center text-stone-400">
                <Calendar className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-stone-300" />
                <p className="text-sm">No attendance records logged yet.</p>
              </div>
            ) : (
              <>
                {/* Mobile Attendance Cards */}
                <div className="block md:hidden divide-y divide-stone-100">
                  {studentAttendance.map((rec) => (
                    <div key={rec.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Calendar className="w-4 h-4 text-stone-400" />
                        <span className="font-mono text-xs font-semibold text-stone-800">{rec.date}</span>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider ${
                          rec.status === 'present'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : rec.status === 'absent'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-sm text-stone-700">
                    <thead className="bg-stone-50 border-b border-stone-200 text-xs uppercase font-semibold text-stone-500">
                      <tr>
                        <th className="py-3 px-5">Date</th>
                        <th className="py-3 px-5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {studentAttendance.map((rec) => (
                        <tr key={rec.id} className="hover:bg-stone-50/70">
                          <td className="py-3.5 px-5 font-mono text-xs text-stone-800">{rec.date}</td>
                          <td className="py-3.5 px-5">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider ${
                                rec.status === 'present'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : rec.status === 'absent'
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {rec.status}
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
        )}

        {/* HOMEWORK TAB */}
        {activeTab === 'homework' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-stone-200">
                <h2 className="text-sm sm:text-base font-bold text-stone-900">Homework & Assignments</h2>
                <p className="text-xs text-stone-500">Select an assignment to review instructions and submit work</p>
              </div>
              {homework.length === 0 ? (
                <div className="p-8 sm:p-12 text-center text-stone-400">
                  <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-stone-300" />
                  <p className="text-sm">No homework currently assigned.</p>
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {homework.map((hw) => {
                    const isSubmitted = homeworkSubmissions.some(
                      (sub) => sub.homework_id === hw.id && sub.student_id === activeStudent?.id
                    );
                    return (
                      <div
                        key={hw.id}
                        onClick={() => setSelectedHw(hw)}
                        className={`p-4 sm:p-5 cursor-pointer transition ${
                          selectedHw?.id === hw.id ? 'bg-stone-50 border-l-4 border-stone-900' : 'hover:bg-stone-50/70'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1">
                          <h3 className="text-sm font-bold text-stone-900">{hw.title}</h3>
                          <span
                            className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold w-fit ${
                              isSubmitted
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {isSubmitted ? 'Submitted' : 'Pending'}
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 mt-2 line-clamp-2">{hw.description}</p>
                        <div className="mt-3 flex items-center gap-2 text-xs text-stone-400 font-mono">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Due: {hw.due_date}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Submit work drawer/box */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-sm h-fit">
              <h3 className="text-base font-bold text-stone-900 mb-1">
                {selectedHw ? `Submit: ${selectedHw.title}` : 'Submit Assignment'}
              </h3>
              <p className="text-xs text-stone-500 mb-4">
                {selectedHw ? selectedHw.description : 'Select a homework item on the left to write and submit your response.'}
              </p>

              {selectedHw ? (
                <form onSubmit={handleSubmitSolution} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">Your Submission / Notes</label>
                    <textarea
                      required
                      rows={5}
                      value={submissionContent}
                      onChange={(e) => setSubmissionContent(e.target.value)}
                      placeholder="Type your response, answers, or reference link..."
                      className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-sm"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    disabled={submittingHw}
                    className="w-full py-3 sm:py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50 min-h-[44px]"
                  >
                    <Send className="w-4 h-4" />
                    <span>{submittingHw ? 'Submitting...' : 'Submit Solution'}</span>
                  </button>
                </form>
              ) : (
                <div className="p-6 bg-stone-50 rounded-xl text-center text-xs text-stone-400 border border-dashed border-stone-200">
                  Tap an assignment from the list to begin submission
                </div>
              )}
            </div>
          </div>
        )}

        {/* FEES TAB */}
        {activeTab === 'fees' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {/* Dues */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-stone-200">
                <h2 className="text-sm sm:text-base font-bold text-stone-900">Fee Schedule & Dues</h2>
                <p className="text-xs text-stone-500">Applicable institutional fees</p>
              </div>
              {feeStructures.length === 0 ? (
                <div className="p-8 text-center text-stone-400 text-xs">No fee schedules set.</div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {feeStructures.map((f) => (
                    <div key={f.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-stone-900">{f.fee_head}</p>
                        <p className="text-xs text-stone-500">{f.term}</p>
                      </div>
                      <span className="font-mono font-bold text-stone-900">${f.amount}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payments History */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-stone-200">
                <h2 className="text-sm sm:text-base font-bold text-stone-900">Payment History & Receipts</h2>
                <p className="text-xs text-stone-500">Official payments recorded in database</p>
              </div>
              {studentPayments.length === 0 ? (
                <div className="p-8 text-center text-stone-400 text-xs">No payments recorded.</div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {studentPayments.map((p) => (
                    <div key={p.id} className="p-4 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <p className="text-sm font-semibold text-stone-900">${p.amount_paid}</p>
                        </div>
                        <p className="text-xs text-stone-400 font-mono">Receipt: {p.receipt_number}</p>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 bg-stone-100 rounded text-xs text-stone-700 font-mono uppercase">
                          {p.payment_method}
                        </span>
                        <p className="text-xs text-stone-400 mt-1 font-mono">
                          {p.paid_at ? new Date(p.paid_at).toLocaleDateString() : p.payment_date}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ANNOUNCEMENTS TAB */}
        {activeTab === 'announcements' && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-stone-200">
              <h2 className="text-sm sm:text-base font-bold text-stone-900">School Notices & Circulars</h2>
              <p className="text-xs text-stone-500">Official updates from administration and faculty</p>
            </div>
            {announcements.length === 0 ? (
              <div className="p-8 sm:p-12 text-center text-stone-400">
                <Bell className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-stone-300" />
                <p className="text-sm">No announcements at this time.</p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {announcements.map((anc) => (
                  <div key={anc.id} className="p-4 sm:p-5 hover:bg-stone-50/70 transition space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="text-sm font-bold text-stone-900">{anc.title}</h3>
                      <span className="text-xs font-mono text-stone-400">
                        {anc.created_at ? new Date(anc.created_at).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600">{anc.content || anc.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
