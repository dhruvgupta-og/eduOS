import React, { useState } from 'react';
import { useEduOS } from '../../context/EduOSContext';
import { Users, CheckCircle, Calendar, Plus, BookOpen, Bell, Copy, Check, Key, AlertCircle, School } from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const {
    currentSchool,
    currentProfile,
    classes,
    students,
    attendance,
    announcements,
    homework,
    session,
    logout,
    markAttendance,
    createAnnouncement,
    createHomework,
    refreshData
  } = useEduOS();

  const [activeTab, setActiveTab] = useState<'attendance' | 'students' | 'homework' | 'announcements'>('attendance');
  const [selectedClassId, setSelectedClassId] = useState<string>(() => classes[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Attendance batch state: studentId -> status
  const [attendanceState, setAttendanceState] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  const [savingAttendance, setSavingAttendance] = useState(false);

  // Student Provisioning Modal
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [admissionNo, setAdmissionNo] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [createStudentLogin, setCreateStudentLogin] = useState(false);
  const [studentEmail, setStudentEmail] = useState('');
  const [submittingStudent, setSubmittingStudent] = useState(false);
  const [studentError, setStudentError] = useState<string | null>(null);
  const [createdStudentCreds, setCreatedStudentCreds] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  // Homework modal
  const [hwTitle, setHwTitle] = useState('');
  const [hwDesc, setHwDesc] = useState('');
  const [hwDueDate, setHwDueDate] = useState(new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]);
  const [submittingHw, setSubmittingHw] = useState(false);

  // Announcement state
  const [ancTitle, setAncTitle] = useState('');
  const [ancContent, setAncContent] = useState('');
  const [ancRole, setAncRole] = useState('all');
  const [submittingAnc, setSubmittingAnc] = useState(false);

  // Filter students for attendance
  const filteredStudents = selectedClassId
    ? students.filter((s) => s.class_id === selectedClassId)
    : students;

  const handleSaveAttendance = async () => {
    setSavingAttendance(true);
    const records = filteredStudents.map((s) => ({
      student_id: s.id,
      class_id: selectedClassId || classes[0]?.id,
      status: attendanceState[s.id] || 'present',
    }));

    await markAttendance(records, selectedDate);
    setSavingAttendance(false);
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingStudent(true);
    setStudentError(null);

    try {
      const res = await fetch('/api/provision/student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          studentName,
          admissionNo,
          rollNo,
          classId: selectedClassId || classes[0]?.id,
          parentName,
          parentEmail,
          parentPhone,
          createStudentLogin,
          studentEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to provision student & parent');
      }

      setCreatedStudentCreds(data);
      setShowStudentModal(false);
      setStudentName('');
      setAdmissionNo('');
      setRollNo('');
      setParentName('');
      setParentEmail('');
      setParentPhone('');
      await refreshData();
    } catch (err: any) {
      setStudentError(err.message || 'Provisioning failed');
    } finally {
      setSubmittingStudent(false);
    }
  };

  const handleCreateHw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hwTitle || !hwDesc) return;
    setSubmittingHw(true);
    const classId = selectedClassId || classes[0]?.id;
    if (classId) {
      await createHomework(classId, hwTitle, hwDesc, hwDueDate);
      setHwTitle('');
      setHwDesc('');
    }
    setSubmittingHw(false);
  };

  const handleCreateAnc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ancTitle || !ancContent) return;
    setSubmittingAnc(true);
    await createAnnouncement(ancTitle, ancContent, ancRole);
    setAncTitle('');
    setAncContent('');
    setSubmittingAnc(false);
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
                  {currentSchool?.name || 'Faculty Portal'}
                </h1>
                <p className="text-[11px] sm:text-xs text-stone-500 truncate">
                  Teacher Console • <span className="font-semibold text-stone-800">{currentProfile?.full_name}</span>
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
                onClick={() => setActiveTab('attendance')}
                className={`px-3 py-2 sm:py-1.5 rounded-lg transition whitespace-nowrap ${
                  activeTab === 'attendance' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Attendance
              </button>
              <button
                onClick={() => setActiveTab('students')}
                className={`px-3 py-2 sm:py-1.5 rounded-lg transition whitespace-nowrap ${
                  activeTab === 'students' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Students ({students.length})
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

      {/* Main Container */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
        {/* ATTENDANCE TAB */}
        {activeTab === 'attendance' && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-stone-900">Attendance Roll Call</h2>
                <p className="text-xs text-stone-500">Record and submit class attendance to database</p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 sm:py-1.5 border border-stone-300 rounded-xl text-xs font-mono bg-white min-h-[40px] sm:min-h-0"
                />
                <button
                  onClick={handleSaveAttendance}
                  disabled={savingAttendance || filteredStudents.length === 0}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50 min-h-[44px] sm:min-h-0"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{savingAttendance ? 'Saving...' : 'Submit Attendance'}</span>
                </button>
              </div>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="p-8 sm:p-12 text-center text-stone-400">
                <Users className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-stone-300" />
                <p className="text-sm">No students found for this class.</p>
              </div>
            ) : (
              <>
                {/* Mobile Attendance Cards (Touch Optimized) */}
                <div className="block md:hidden divide-y divide-stone-100">
                  {filteredStudents.map((s) => {
                    const currentStatus = attendanceState[s.id] || 'present';
                    return (
                      <div key={s.id} className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-stone-900 text-sm">{s.name || s.full_name}</div>
                            <div className="text-xs text-stone-500 font-mono">
                              Adm: {s.admission_no || s.admission_number} {s.roll_no ? `• Roll: ${s.roll_no}` : ''}
                            </div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                              currentStatus === 'present'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : currentStatus === 'absent'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {currentStatus}
                          </span>
                        </div>

                        {/* 3 Large Mobile Tap Buttons */}
                        <div className="grid grid-cols-3 gap-2">
                          {(['present', 'absent', 'late'] as const).map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => setAttendanceState((prev) => ({ ...prev, [s.id]: st }))}
                              className={`py-2.5 rounded-xl text-xs font-semibold capitalize transition flex items-center justify-center min-h-[44px] active:scale-[0.98] ${
                                currentStatus === st
                                  ? st === 'present'
                                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                                    : st === 'absent'
                                    ? 'bg-red-600 text-white shadow-xs font-bold'
                                    : 'bg-amber-600 text-white shadow-xs font-bold'
                                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200 border border-stone-200'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
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
                        <th className="py-3 px-5">Roll No</th>
                        <th className="py-3 px-5">Student Name</th>
                        <th className="py-3 px-5">Admission No</th>
                        <th className="py-3 px-5 text-right">Attendance Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {filteredStudents.map((s) => {
                        const currentStatus = attendanceState[s.id] || 'present';
                        return (
                          <tr key={s.id} className="hover:bg-stone-50/70">
                            <td className="py-3.5 px-5 font-mono text-xs">{s.roll_no || s.roll_number || '-'}</td>
                            <td className="py-3.5 px-5 font-semibold text-stone-900">{s.name || s.full_name}</td>
                            <td className="py-3.5 px-5 font-mono text-xs text-stone-500">{s.admission_no || s.admission_number}</td>
                            <td className="py-3.5 px-5 text-right">
                              <div className="inline-flex rounded-xl border border-stone-200 p-1 bg-stone-50 gap-1">
                                {(['present', 'absent', 'late'] as const).map((st) => (
                                  <button
                                    key={st}
                                    onClick={() => setAttendanceState((prev) => ({ ...prev, [s.id]: st }))}
                                    className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                                      currentStatus === st
                                        ? st === 'present'
                                          ? 'bg-emerald-600 text-white shadow-xs'
                                          : st === 'absent'
                                          ? 'bg-red-600 text-white shadow-xs'
                                          : 'bg-amber-600 text-white shadow-xs'
                                        : 'text-stone-600 hover:text-stone-900'
                                    }`}
                                  >
                                    {st}
                                  </button>
                                ))}
                              </div>
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
        )}

        {/* STUDENTS TAB */}
        {activeTab === 'students' && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-stone-900">Student & Guardian Roster</h2>
                <p className="text-xs text-stone-500">Provision students with linked parent credentials</p>
              </div>
              <button
                onClick={() => setShowStudentModal(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl shadow-sm transition min-h-[44px] sm:min-h-0"
              >
                <Plus className="w-4 h-4" />
                <span>Enroll Student</span>
              </button>
            </div>

            {students.length === 0 ? (
              <div className="p-8 sm:p-12 text-center text-stone-400">
                <Users className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-stone-300" />
                <p className="text-sm">No students currently enrolled.</p>
                <button
                  onClick={() => setShowStudentModal(true)}
                  className="mt-3 px-4 py-2.5 bg-stone-900 text-white text-xs font-semibold rounded-xl"
                >
                  Enroll First Student
                </button>
              </div>
            ) : (
              <>
                {/* Mobile Cards */}
                <div className="block md:hidden divide-y divide-stone-100">
                  {students.map((s) => (
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
                      {students.map((s) => (
                        <tr key={s.id} className="hover:bg-stone-50/70">
                          <td className="py-3.5 px-5 font-semibold text-stone-900">{s.name || s.full_name}</td>
                          <td className="py-3.5 px-5 font-mono text-xs">{s.admission_no || s.admission_number}</td>
                          <td className="py-3.5 px-5 font-mono text-xs">{s.roll_no || s.roll_number || '-'}</td>
                          <td className="py-3.5 px-5">
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
        )}

        {/* HOMEWORK TAB */}
        {activeTab === 'homework' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-stone-200">
                <h2 className="text-sm sm:text-base font-bold text-stone-900">Active Homework Assignments</h2>
                <p className="text-xs text-stone-500">Assignments posted for students and parents</p>
              </div>
              {homework.length === 0 ? (
                <div className="p-8 sm:p-12 text-center text-stone-400">
                  <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-stone-300" />
                  <p className="text-sm">No homework assignments posted.</p>
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {homework.map((hw) => (
                    <div key={hw.id} className="p-4 sm:p-5 hover:bg-stone-50/70 transition space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1">
                        <h3 className="text-sm font-bold text-stone-900">{hw.title}</h3>
                        <span className="px-2.5 py-0.5 rounded-lg bg-stone-100 text-stone-700 text-xs font-mono w-fit">
                          Due: {hw.due_date}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600">{hw.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-sm h-fit">
              <h3 className="text-base font-bold text-stone-900 mb-1">Post Homework</h3>
              <p className="text-xs text-stone-500 mb-4">Create assignment for your class</p>

              <form onSubmit={handleCreateHw} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={hwTitle}
                    onChange={(e) => setHwTitle(e.target.value)}
                    placeholder="Chapter 4: Calculus Practice"
                    className="w-full px-3.5 py-2.5 sm:py-2 border border-stone-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">Description / Instructions</label>
                  <textarea
                    required
                    rows={3}
                    value={hwDesc}
                    onChange={(e) => setHwDesc(e.target.value)}
                    placeholder="Complete questions 1 to 15 on page 84..."
                    className="w-full px-3.5 py-2.5 sm:py-2 border border-stone-300 rounded-xl text-sm"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={hwDueDate}
                    onChange={(e) => setHwDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 sm:py-2 border border-stone-300 rounded-xl text-sm font-mono bg-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingHw}
                  className="w-full py-3 sm:py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-sm font-semibold transition min-h-[44px]"
                >
                  {submittingHw ? 'Posting...' : 'Post Assignment'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ANNOUNCEMENTS TAB */}
        {activeTab === 'announcements' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-stone-200">
                <h2 className="text-sm sm:text-base font-bold text-stone-900">Broadcast Announcements</h2>
                <p className="text-xs text-stone-500">Institutional notices for students, parents, and faculty</p>
              </div>
              {announcements.length === 0 ? (
                <div className="p-8 sm:p-12 text-center text-stone-400">
                  <Bell className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-stone-300" />
                  <p className="text-sm">No announcements published.</p>
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {announcements.map((anc) => (
                    <div key={anc.id} className="p-4 sm:p-5 hover:bg-stone-50/70 transition space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1">
                        <h3 className="text-sm font-bold text-stone-900">{anc.title}</h3>
                        <span className="px-2 py-0.5 bg-stone-100 rounded text-xs text-stone-600 uppercase font-semibold w-fit">
                          Target: {anc.target_role}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600">{anc.content || anc.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-sm h-fit">
              <h3 className="text-base font-bold text-stone-900 mb-1">New Announcement</h3>
              <p className="text-xs text-stone-500 mb-4">Broadcast notice across school</p>

              <form onSubmit={handleCreateAnc} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={ancTitle}
                    onChange={(e) => setAncTitle(e.target.value)}
                    placeholder="Parent-Teacher Conference Schedule"
                    className="w-full px-3.5 py-2.5 sm:py-2 border border-stone-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">Target Audience</label>
                  <select
                    value={ancRole}
                    onChange={(e) => setAncRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 sm:py-2 border border-stone-300 rounded-xl text-sm bg-white"
                  >
                    <option value="all">Everyone</option>
                    <option value="parent">Parents Only</option>
                    <option value="student">Students Only</option>
                    <option value="teacher">Faculty Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">Content</label>
                  <textarea
                    required
                    rows={4}
                    value={ancContent}
                    onChange={(e) => setAncContent(e.target.value)}
                    placeholder="Details about the event or notice..."
                    className="w-full px-3.5 py-2.5 sm:py-2 border border-stone-300 rounded-xl text-sm"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  disabled={submittingAnc}
                  className="w-full py-3 sm:py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-sm font-semibold transition min-h-[44px]"
                >
                  {submittingAnc ? 'Publishing...' : 'Publish Announcement'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Modal: Enroll Student */}
      {showStudentModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-stone-200 max-h-[92vh] overflow-y-auto my-auto">
            <h3 className="text-lg font-bold text-stone-900">Enroll Student & Guardian</h3>
            <p className="text-xs text-stone-500 mt-1 mb-4">
              Registers student and creates parent Supabase Auth credentials.
            </p>

            {studentError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{studentError}</span>
              </div>
            )}

            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div className="space-y-3">
                <p className="text-xs font-bold text-stone-800 uppercase tracking-wider">Student Details</p>
                <div>
                  <label className="block text-xs text-stone-600 mb-1">Student Full Name</label>
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Liam Gallagher"
                    className="w-full px-3.5 py-2.5 sm:py-2 border border-stone-300 rounded-xl text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-stone-600 mb-1">Admission Number</label>
                    <input
                      type="text"
                      required
                      value={admissionNo}
                      onChange={(e) => setAdmissionNo(e.target.value)}
                      placeholder="ADM-2026-042"
                      className="w-full px-3.5 py-2.5 sm:py-2 border border-stone-300 rounded-xl text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-600 mb-1">Roll Number</label>
                    <input
                      type="text"
                      value={rollNo}
                      onChange={(e) => setRollNo(e.target.value)}
                      placeholder="24"
                      className="w-full px-3.5 py-2.5 sm:py-2 border border-stone-300 rounded-xl text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-stone-100 space-y-3">
                <p className="text-xs font-bold text-stone-800 uppercase tracking-wider">Parent / Guardian Details</p>
                <div>
                  <label className="block text-xs text-stone-600 mb-1">Guardian Full Name</label>
                  <input
                    type="text"
                    required
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="Margaret Gallagher"
                    className="w-full px-3.5 py-2.5 sm:py-2 border border-stone-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-600 mb-1">Guardian Email</label>
                  <input
                    type="email"
                    required
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    placeholder="margaret@example.com"
                    className="w-full px-3.5 py-2.5 sm:py-2 border border-stone-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-600 mb-1">Guardian Phone (Optional)</label>
                  <input
                    type="tel"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="+1 (555) 987-6543"
                    className="w-full px-3.5 py-2.5 sm:py-2 border border-stone-300 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowStudentModal(false)}
                  className="px-4 py-2.5 text-sm text-stone-600 hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingStudent}
                  className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-sm font-semibold transition min-h-[44px]"
                >
                  {submittingStudent ? 'Enrolling...' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Parent Credentials Display */}
      {createdStudentCreds && (
        <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border-2 border-emerald-500 animate-in fade-in zoom-in-95 my-auto">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Key className="w-6 h-6" />
            </div>
            <h3 className="text-center text-lg font-bold text-stone-900">Guardian Credentials Ready</h3>
            <p className="text-center text-xs text-stone-500 mt-1 mb-4">
              Share these login credentials with the parent for portal access.
            </p>

            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2 text-xs font-mono break-all">
              <div>
                <span className="text-stone-500">Guardian:</span> <span className="font-semibold text-stone-800">{createdStudentCreds.parentCredentials?.fullName}</span>
              </div>
              <div>
                <span className="text-stone-500">Email:</span> <span className="font-semibold text-stone-800">{createdStudentCreds.parentCredentials?.email}</span>
              </div>
              <div>
                <span className="text-stone-500">Password:</span>{' '}
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {createdStudentCreds.parentCredentials?.password}
                </span>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <button
                onClick={() => {
                  const text = `EduOS Parent Portal Credentials\nGuardian: ${createdStudentCreds.parentCredentials?.fullName}\nEmail: ${createdStudentCreds.parentCredentials?.email}\nPassword: ${createdStudentCreds.parentCredentials?.password}\nLogin: ${window.location.origin}/login`;
                  navigator.clipboard.writeText(text);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2500);
                }}
                className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 min-h-[44px]"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy Parent Credentials'}</span>
              </button>
              <button
                onClick={() => setCreatedStudentCreds(null)}
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
