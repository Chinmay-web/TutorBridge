import { Fragment, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  computeOverlap,
  type StudentRequest,
  type Tutor,
  type TimeSlot,
} from '../data/mockData';
import { formatTime, formatSlot, TIMEZONES } from '../components/AvailabilityPicker';

type Tab = 'requests' | 'tutors' | 'matching' | 'assignments';
type RequestStatus = StudentRequest['status'];
type TutorStatus = Tutor['status'];
type IssueType = 'one_time_cancellation' | 'schedule_change' | 'needs_rematch';
type IssueReportedBy = 'student' | 'tutor';

interface DashboardProps {
  onSignedOut: () => void;
}

type DbStudentRequest = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  grade_level: string;
  subject: string;
  availability: TimeSlot[] | null;
  additional_info: string | null;
  status: RequestStatus;
  created_at: string;
};

type DbTutor = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subjects: string[] | null;
  availability: TimeSlot[] | null;
  bio: string | null;
  status: TutorStatus;
  created_at: string;
};

type Assignment = {
  id: string;
  requestId: string;
  studentName: string;
  studentEmail: string;
  tutorName: string;
  tutorEmail: string;
  subject: string;
  assignedAt: string;
  issueType: IssueType | null;
  issueReportedBy: IssueReportedBy | null;
  issueNote: string | null;
  issueReportedAt: string | null;
  isActive: boolean;
};

type DbAssignment = {
  id: string;
  request_id: string;
  assigned_at: string;
  issue_type: IssueType | null;
  issue_reported_by: IssueReportedBy | null;
  issue_note: string | null;
  issue_reported_at: string | null;
  is_active: boolean;
  student_requests: {
    name: string;
    email: string;
    subject: string;
  } | null;
  tutors: {
    name: string;
    email: string;
  } | null;
};

const STATUS_BADGE: Record<RequestStatus, string> = {
  unmatched: 'bg-amber-50 text-amber-700 border-amber-200',
  matched: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-blue-50 text-blue-700 border-blue-200',
};

const STATUS_LABEL: Record<RequestStatus, string> = {
  unmatched: 'Unmatched',
  matched: 'Matched',
  pending: 'Pending',
};

const TUTOR_STATUS_BADGE: Record<TutorStatus, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  inactive: 'bg-slate-100 text-slate-500 border-slate-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
};

function tzLabel(tz: string) {
  return TIMEZONES.find(t => t.value === tz)?.label ?? tz;
}

function normalizeRequestStatus(status: string): RequestStatus {
  if (status === 'assigned') return 'matched';
  if (status === 'closed') return 'unmatched';
  if (status === 'pending') return 'pending';
  return 'pending';
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

function AvatarCircle({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const colors = ['bg-blue-100 text-blue-700', 'bg-violet-100 text-violet-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700'];
  const color = colors[name.charCodeAt(0) % colors.length];
  const sz = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';
  return (
    <div className={`${sz} ${color} rounded-full flex items-center justify-center font-semibold flex-shrink-0`}>
      {initials(name)}
    </div>
  );
}

function SlotPill({ slot, tz }: { slot: TimeSlot; tz?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg whitespace-nowrap">
      <svg width="11" height="11" viewBox="0 0 11 11" fill="none" className="text-slate-400 flex-shrink-0" aria-hidden="true">
        <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M5.5 3.5V5.5l1.2 1.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span className="font-medium text-slate-700">{slot.day.slice(0, 3)}</span>
      {formatTime(slot.startTime)}–{formatTime(slot.endTime)}
      {tz && <span className="text-slate-400 ml-0.5">{tzLabel(tz)}</span>}
    </span>
  );
}

function OverlapPills({ overlaps }: { overlaps: Array<{ a: TimeSlot; b: TimeSlot }> }) {
  if (overlaps.length === 0) return null;
  return (
    <div className="mt-2 space-y-1">
      <p className="text-xs font-medium text-emerald-700 flex items-center gap-1">
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
          <path d="M2 5.5l2.5 2.5 4.5-4.5" stroke="#059669" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {overlaps.length} overlapping slot{overlaps.length > 1 ? 's' : ''}
      </p>
      <div className="flex flex-wrap gap-1">
        {overlaps.slice(0, 3).map((ov, i) => {
          const start = ov.a.startTime > ov.b.startTime ? ov.a.startTime : ov.b.startTime;
          const end = ov.a.endTime < ov.b.endTime ? ov.a.endTime : ov.b.endTime;
          return (
            <span key={i} className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-lg">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M5 3V5l1 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {ov.a.day.slice(0, 3)} {formatTime(start)}–{formatTime(end)}
            </span>
          );
        })}
        {overlaps.length > 3 && (
          <span className="text-xs text-slate-400">+{overlaps.length - 3} more</span>
        )}
      </div>
    </div>
  );
}

// Compare two availability arrays and return overlapping slot pairs only when slot.timezone matches
function computeOverlapWithTimezone(a: TimeSlot[], b: TimeSlot[]) {
  const result: Array<{ a: TimeSlot; b: TimeSlot }> = [];
  for (const sa of a) {
    for (const sb of b) {
      const saTz = (sa as any).timezone;
      const sbTz = (sb as any).timezone;
      if (saTz || sbTz) {
        if (!saTz || !sbTz) continue;
        if (saTz !== sbTz) continue;
      }
      if (sa.day !== sb.day) continue;
      if (sa.startTime < sb.endTime && sb.startTime < sa.endTime) {
        result.push({ a: sa, b: sb });
      }
    }
  }
  return result;
}

export default function Dashboard({ onSignedOut }: DashboardProps) {
  const [tab, setTab] = useState<Tab>('requests');
  const [requests, setRequests] = useState<StudentRequest[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [userChecked, setUserChecked] = useState(false);
  const [isCoordinator, setIsCoordinator] = useState(false);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [requestFilter, setRequestFilter] = useState<RequestStatus | 'all'>('all');
  const [tutorFilter, setTutorFilter] = useState<TutorStatus | 'all'>('all');
  const [updatingTutorIds, setUpdatingTutorIds] = useState<string[]>([]);
  const [updateError, setUpdateError] = useState('');
  const [searchRequests, setSearchRequests] = useState('');
  const [searchTutors, setSearchTutors] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [matchSuccess, setMatchSuccess] = useState<{ student: string; tutor: string } | null>(null);
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  const lastUpdated = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const [assigningRequestIds, setAssigningRequestIds] = useState<string[]>([]);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [issueType, setIssueType] = useState<IssueType>('one_time_cancellation');
  const [issueReportedBy, setIssueReportedBy] = useState<IssueReportedBy>('student');
  const [issueNote, setIssueNote] = useState('');
  const [savingAssignmentIds, setSavingAssignmentIds] = useState<string[]>([]);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutError('');

    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Coordinator sign-out error:', error);
      setSignOutError('Unable to sign out. Please try again.');
      setSigningOut(false);
      return;
    }

    onSignedOut();
  };

  useEffect(() => {
    // Check auth state and coordinator membership first
    const checkAuth = async () => {
      setUserChecked(false);
      setIsCoordinator(false);
      setAuthUserId(null);

      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr || !user) {
        // not signed in
        setUserChecked(true);
        setLoading(false);
        return;
      }

      setAuthUserId(user.id);

      // Check coordinators table for this user
      const { data: coordData, error: coordErr } = await supabase
        .from('coordinators')
        .select('user_id,is_active')
        .eq('user_id', user.id)
        .maybeSingle();

      if (coordErr) {
        console.error('Coordinator lookup error:', coordErr);
        setLoadError('Unable to verify coordinator membership.');
        setUserChecked(true);
        setLoading(false);
        return;
      }

      if (!coordData || !coordData.is_active) {
        setIsCoordinator(false);
        setUserChecked(true);
        setLoading(false);
        return;
      }

      setIsCoordinator(true);
      setUserChecked(true);

      // Now load actual dashboard data
      setLoading(true);
      setLoadError('');

      const [requestsResponse, tutorsResponse, assignmentsResponse] = await Promise.all([
        supabase.from<DbStudentRequest>('student_requests')
          .select('id,name,email,phone,grade_level,subject,availability,additional_info,status,created_at'),
        supabase.from<DbTutor>('tutors')
          .select('id,name,email,phone,subjects,availability,bio,status,created_at'),
        supabase.from<DbAssignment>('assignments')
          .select('id,request_id,assigned_at,issue_type,issue_reported_by,issue_note,issue_reported_at,is_active,student_requests(name,email,subject),tutors(name,email)'),
      ]);

      if (requestsResponse.error || tutorsResponse.error || assignmentsResponse.error) {
        console.error('Dashboard Supabase read errors:', requestsResponse.error, tutorsResponse.error, assignmentsResponse.error);
        setLoadError('Unable to load dashboard data.');
        setLoading(false);
        return;
      }

      setRequests((requestsResponse.data ?? []).map(row => ({
        id: row.id,
        studentName: row.name,
        email: row.email,
        subject: row.subject,
        gradeLevel: row.grade_level,
        availability: row.availability ?? [],
        timezone: row.availability?.[0]?.timezone ?? 'America/Chicago',
        description: row.additional_info ?? '',
        status: normalizeRequestStatus(row.status),
        matchedTutorId: undefined,
        submittedAt: row.created_at,
      })));

      setTutors((tutorsResponse.data ?? []).map(row => ({
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone ?? '',
        subjects: row.subjects ?? [],
        availability: row.availability ?? [],
        timezone: row.availability?.[0]?.timezone ?? 'America/Chicago',
        experience: 'Not specified',
        bio: row.bio ?? '',
        status: row.status,
        joinedAt: row.created_at,
      })));

      setAssignments((assignmentsResponse.data ?? []).map(row => ({
        id: row.id,
        requestId: row.request_id,
        studentName: row.student_requests?.name ?? 'Unknown student',
        studentEmail: row.student_requests?.email ?? 'Unavailable',
        tutorName: row.tutors?.name ?? 'Unknown tutor',
        tutorEmail: row.tutors?.email ?? 'Unavailable',
        subject: row.student_requests?.subject ?? 'Unavailable',
        assignedAt: row.assigned_at,
        issueType: row.issue_type,
        issueReportedBy: row.issue_reported_by,
        issueNote: row.issue_note,
        issueReportedAt: row.issue_reported_at,
        isActive: row.is_active,
      })));

      setLoading(false);
    };

    checkAuth();
  }, []);

  const openRequests = requests.filter(r => r.status === 'unmatched' || r.status === 'pending').length;
  const activeTutors = tutors.filter(t => t.status === 'accepted').length;
  const matches = requests.filter(r => r.status === 'matched').length;

  const filteredRequests = requests.filter(r => {
    if (requestFilter !== 'all' && r.status !== requestFilter) return false;
    if (searchRequests && !r.studentName.toLowerCase().includes(searchRequests.toLowerCase()) && !r.subject.toLowerCase().includes(searchRequests.toLowerCase())) return false;
    return true;
  });

  const filteredTutors = tutors.filter(t => {
    if (tutorFilter !== 'all' && t.status !== tutorFilter) return false;
    if (searchTutors && !t.name.toLowerCase().includes(searchTutors.toLowerCase()) && !t.subjects.some(s => s.toLowerCase().includes(searchTutors.toLowerCase()))) return false;
    return true;
  });

  const isUpdating = (id: string) => updatingTutorIds.includes(id);

  const updateTutorStatus = async (id: string, newStatus: 'accepted' | 'rejected') => {
    if (isUpdating(id)) return;
    setUpdateError('');
    setUpdatingTutorIds(prev => [...prev, id]);

    try {
      const { data, error } = await supabase
        .from('tutors')
        .update({ status: newStatus })
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Tutor status update error:', error);
        setUpdateError('Unable to update tutor status. Please try again.');
        return;
      }

      // Update local state
      setTutors(prev => prev.map(t => t.id === id ? { ...t, status: (data as any)?.status ?? newStatus } : t));
    } catch (err) {
      console.error('Tutor status update exception:', err);
      setUpdateError('Unable to update tutor status. Please try again.');
    } finally {
      setUpdatingTutorIds(prev => prev.filter(x => x !== id));
    }
  };

  const selectedRequest = requests.find(r => r.id === selectedRequestId);

  const eligibleTutors = selectedRequest
    ? tutors
        .filter(t => t.status === 'accepted')
        .map(t => ({
          tutor: t,
          subjectMatch: t.subjects.includes(selectedRequest.subject),
          overlaps: computeOverlap(selectedRequest.availability, t.availability),
        }))
        .filter(({ subjectMatch, overlaps }) => subjectMatch || overlaps.length > 0)
        .sort((a, b) => { 
          const scoreA = (a.subjectMatch ? 10 : 0) + a.overlaps.length;
          const scoreB = (b.subjectMatch ? 10 : 0) + b.overlaps.length;
          return scoreB - scoreA;
        })
    : [];

  const assignForRequest = (requestId: string, tutorId: string) => {
    if (assigningRequestIds.includes(requestId)) return;
    setUpdateError('');
    if (!isCoordinator) {
      setUpdateError('You must be signed in as an active coordinator to assign.');
      return;
    }

    const req = requests.find(r => r.id === requestId);
    if (!req) return;
    const tutor = tutors.find(t => t.id === tutorId);

    // Prevent duplicate submissions for this request
    setAssigningRequestIds(prev => [...prev, requestId]);

    (async () => {
      let createdAssignmentId: string | null = null;
      let reusedAssignment: {
        id: string;
        tutor_id: string | null;
        assigned_by: string;
        assigned_at: string;
        issue_type: IssueType | null;
        issue_reported_by: IssueReportedBy | null;
        issue_note: string | null;
        issue_reported_at: string | null;
        is_active: boolean;
      } | null = null;
      try {
        // Get current authenticated user
        const { data: userData, error: userErr } = await supabase.auth.getUser();
        const currentUser = userData?.user ?? null;
        if (userErr || !currentUser) {
          console.error('No authenticated user for assignment:', userErr);
          setUpdateError('You must be signed in to create an assignment.');
          return;
        }

        // Reuse an existing row because assignments.request_id is unique.
        const { data: existingAssignment, error: existingErr } = await supabase
          .from('assignments')
          .select('id,tutor_id,assigned_by,assigned_at,issue_type,issue_reported_by,issue_note,issue_reported_at,is_active')
          .eq('request_id', requestId)
          .maybeSingle();

        if (existingErr) {
          console.error('Existing assignment lookup error:', existingErr);
          setUpdateError('Unable to check for an existing assignment. Please try again.');
          return;
        }

        reusedAssignment = existingAssignment;

        if (existingAssignment?.is_active) {
          setUpdateError('This request already has an active assignment.');
          return;
        }

        const assignmentPayload = {
          tutor_id: tutorId,
          assigned_by: currentUser.id,
          assigned_at: new Date().toISOString(),
          is_active: true,
          issue_type: null,
          issue_reported_by: null,
          issue_note: null,
          issue_reported_at: null,
        };

        const { data: assignData, error: assignErr } = existingAssignment
          ? await supabase
              .from('assignments')
              .update(assignmentPayload)
              .eq('id', existingAssignment.id)
              .select()
              .maybeSingle()
          : await supabase
              .from('assignments')
              .insert({ request_id: requestId, ...assignmentPayload })
              .select()
              .maybeSingle();

        if (assignErr) {
          console.error('Assignment insert error:', assignErr);
          setUpdateError('Unable to create assignment. Please try again.');
          return;
        }

        createdAssignmentId = (assignData as { id?: string } | null)?.id ?? null;

        // 2) Update request status to 'assigned'
        const { data: reqData, error: reqErr } = await supabase
          .from('student_requests')
          .update({ status: 'assigned' })
          .eq('id', requestId)
          .select()
          .maybeSingle();

        if (reqErr) {
          console.error('Student request update error after assignment:', reqErr);
          setUpdateError('Assignment created but failed to update request status. Rolling back.');

          // Roll back a new row by deleting it, or restore the reused row.
          if (reusedAssignment) {
            const { error: restoreErr } = await supabase
              .from('assignments')
              .update({
                tutor_id: reusedAssignment.tutor_id,
                assigned_by: reusedAssignment.assigned_by,
                assigned_at: reusedAssignment.assigned_at,
                issue_type: reusedAssignment.issue_type,
                issue_reported_by: reusedAssignment.issue_reported_by,
                issue_note: reusedAssignment.issue_note,
                issue_reported_at: reusedAssignment.issue_reported_at,
                is_active: reusedAssignment.is_active,
              })
              .eq('id', reusedAssignment.id);
            if (restoreErr) console.error('Failed to restore reused assignment:', restoreErr);
          } else if (createdAssignmentId) {
            const { error: delErr } = await supabase
              .from('assignments')
              .delete()
              .eq('id', createdAssignmentId);
            if (delErr) console.error('Failed to rollback assignment delete:', delErr);
          }

          return;
        }

        // Success: update local UI
        setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: normalizeRequestStatus('assigned'), matchedTutorId: tutorId } : r));
        setAssignments(prev => [
          {
            id: (assignData as { id?: string } | null)?.id ?? `${requestId}-${tutorId}`,
            requestId,
            studentName: req.studentName,
            studentEmail: req.email,
            tutorName: tutor?.name ?? 'Unknown tutor',
            tutorEmail: tutor?.email ?? 'Unavailable',
            subject: req.subject,
            assignedAt: (assignData as { assigned_at?: string } | null)?.assigned_at ?? new Date().toISOString(),
            issueType: null,
            issueReportedBy: null,
            issueNote: null,
            issueReportedAt: null,
            isActive: true,
          },
          ...prev.filter(assignment => assignment.id !== ((assignData as { id?: string } | null)?.id ?? `${requestId}-${tutorId}`)),
        ]);
        setMatchSuccess({ student: req.studentName, tutor: tutor?.name ?? '' });
        setExpandedRequestId(null);
        setTimeout(() => setMatchSuccess(null), 4000);
      } catch (err) {
        console.error('Assignment operation exception:', err);
        setUpdateError('Unable to create assignment. Please try again.');
        // Attempt rollback if needed
        if ((err as any)?.createdAssignmentId) {
          try {
            await supabase.from('assignments').delete().eq('id', (err as any).createdAssignmentId);
          } catch (delErr) {
            console.error('Rollback delete exception:', delErr);
          }
        }
      } finally {
        setAssigningRequestIds(prev => prev.filter(x => x !== requestId));
      }
    })();
  };

  const saveAssignmentIssue = async (assignment: Assignment) => {
    if (savingAssignmentIds.includes(assignment.id)) return;
    setUpdateError('');
    setSavingAssignmentIds(prev => [...prev, assignment.id]);

    const previousAssignment = { ...assignment };
    const issueReportedAt = new Date().toISOString();
    const isRematch = issueType === 'needs_rematch';

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      const currentUser = userData?.user ?? null;
      if (userError || !currentUser) {
        console.error('No authenticated user for assignment issue update:', userError);
        setUpdateError('You must be signed in as an active coordinator to manage an issue.');
        return;
      }

      const { error: assignmentError } = await supabase
        .from('assignments')
        .update({
          assigned_by: currentUser.id,
          issue_type: issueType,
          issue_reported_by: issueReportedBy,
          issue_note: issueNote.trim() || null,
          issue_reported_at: issueReportedAt,
          is_active: !isRematch,
        })
        .eq('id', assignment.id);

      if (assignmentError) {
        console.error('Assignment issue update error:', assignmentError);
        setUpdateError('Unable to save the assignment issue. Please try again.');
        return;
      }

      if (isRematch) {
        const { error: requestError } = await supabase
          .from('student_requests')
          .update({ status: 'pending' })
          .eq('id', assignment.requestId);

        if (requestError) {
          console.error('Rematch request update error:', requestError);
          const { error: rollbackError } = await supabase
            .from('assignments')
            .update({
              assigned_by: currentUser.id,
              issue_type: previousAssignment.issueType,
              issue_reported_by: previousAssignment.issueReportedBy,
              issue_note: previousAssignment.issueNote,
              issue_reported_at: previousAssignment.issueReportedAt,
              is_active: previousAssignment.isActive,
            })
            .eq('id', assignment.id);
          if (rollbackError) console.error('Rematch assignment rollback error:', rollbackError);
          setUpdateError('Unable to return the student to matching. The assignment was rolled back.');
          return;
        }
      }

      setAssignments(prev => prev.map(item => item.id === assignment.id ? {
        ...item,
        issueType,
        issueReportedBy,
        issueNote: issueNote.trim() || null,
        issueReportedAt,
        isActive: !isRematch,
      } : item));

      if (isRematch) {
        setRequests(prev => prev.map(request => request.id === assignment.requestId ? {
          ...request,
          status: 'pending',
          matchedTutorId: undefined,
        } : request));
      }

      setEditingAssignmentId(null);
      setIssueNote('');
    } catch (error) {
      console.error('Assignment issue operation exception:', error);
      setUpdateError('Unable to save the assignment issue. Please try again.');
    } finally {
      setSavingAssignmentIds(prev => prev.filter(id => id !== assignment.id));
    }
  };

  return (
    <div className="min-h-screen bg-slate-25">
      {/* Dashboard header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="font-display font-bold text-2xl text-slate-900">Coordinator Dashboard</h1>
              <p className="mt-0.5 text-sm text-slate-500">Manage requests, tutors, and matches</p>
            </div>
            <span className="text-xs text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
              Last updated: {lastUpdated}
            </span>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
            {signOutError && <p className="text-xs text-rose-600">{signOutError}</p>}
          </div>

          {/* Stats */}
          <dl className="mt-6 grid grid-cols-3 gap-4">
            {[
              {
                label: 'Open Requests', value: openRequests, color: 'text-amber-600', bg: 'bg-amber-50',
                icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><rect x="2" y="1.5" width="14" height="15" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M5.5 7h7M5.5 10h4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
              },
              {
                label: 'Active Tutors', value: activeTutors, color: 'text-emerald-600', bg: 'bg-emerald-50',
                icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M1 15.5c0-2.761 2.239-4 6-4M13 11v6M16 14H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
              },
              {
                label: 'Matches Made', value: matches, color: 'text-blue-600', bg: 'bg-blue-50',
                icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="6" cy="7" r="3" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="7" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M1 15.5c0-2.761 2.239-4 5-4M17 15.5c0-2.761-2.239-4-5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
              },
            ].map(stat => (
              <div key={stat.label} className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center flex-shrink-0`}>
                    {stat.icon}
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500 hidden sm:block">{stat.label}</dt>
                    <dd className="font-display font-bold text-2xl text-slate-900">{stat.value}</dd>
                    <dt className="text-xs text-slate-500 sm:hidden">{stat.label}</dt>
                  </div>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="mb-6 bg-white border border-slate-100 rounded-2xl p-6 text-slate-500">
            Loading dashboard data…
          </div>
        )}
        {loadError && !loading && (
          <div className="mb-6 bg-rose-50 border border-rose-200 rounded-2xl p-6 text-rose-700">
            <p className="font-semibold">Unable to load dashboard data.</p>
            <p className="mt-1 text-sm text-rose-700/80">
              Coordinator auth may be required before this page can read live data.
            </p>
          </div>
        )}

        {/* Success toast */}
        {matchSuccess && (
          <div className="mb-6 flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3.5 text-sm text-emerald-800" role="status">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" className="flex-shrink-0">
              <path d="M3.5 9l4 4 7-7" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>
              <strong>{matchSuccess.student}</strong> has been matched with <strong>{matchSuccess.tutor}</strong>.
            </span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-6" role="tablist" aria-label="Dashboard sections">
          {(['requests', 'tutors', 'matching', 'assignments'] as Tab[]).map(t => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t === 'matching' ? 'Match Students' : t === 'requests' ? 'Requests' : t === 'tutors' ? 'Tutors' : 'Assignments'}
            </button>
          ))}
        </div>

        {/* ── Requests tab ── */}
        {tab === 'requests' && (
          <section aria-label="Tutoring requests">
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
                  <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <input
                  type="search"
                  placeholder="Search by student or subject…"
                  value={searchRequests}
                  onChange={e => setSearchRequests(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-blue-500 text-sm text-slate-900 placeholder-slate-400 bg-white transition-colors"
                />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {(['all', 'unmatched', 'pending', 'matched'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setRequestFilter(f)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${requestFilter === f ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'}`}
                  >
                    {f === 'all' ? 'All' : STATUS_LABEL[f]}
                  </button>
                ))}
              </div>
            </div>

            {updateError && (
              <div className="mb-4 bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-700">
                {updateError}
              </div>
            )}

            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px]" aria-label="Student requests table">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-25">
                      <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3.5">Student</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3.5">Subject</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3.5 hidden md:table-cell">Grade</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3.5 hidden lg:table-cell">Availability</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3.5">Status</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3.5 hidden sm:table-cell">Submitted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredRequests.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-sm text-slate-400">No requests match your filter.</td>
                      </tr>
                    ) : filteredRequests.map(req => {
                      const matchedTutor = req.matchedTutorId ? tutors.find(t => t.id === req.matchedTutorId) : null;
                      return (
                        <>
                          <tr key={req.id} className="hover:bg-slate-25 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <AvatarCircle name={req.studentName} />
                              <div>
                                <p className="text-sm font-medium text-slate-900">{req.studentName}</p>
                                <p className="text-xs text-slate-400">{req.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-700">{req.subject}</td>
                          <td className="px-4 py-4 text-sm text-slate-700 hidden md:table-cell">{req.gradeLevel}</td>
                          <td className="px-4 py-4 hidden lg:table-cell">
                            <div className="flex flex-col gap-1">
                              {req.availability.slice(0, 2).map((s, i) => (
                                <SlotPill key={i} slot={s} />
                              ))}
                              {req.availability.length > 2 && (
                                <span className="text-xs text-slate-400">+{req.availability.length - 2} more</span>
                              )}
                              <span className="text-xs text-slate-400">{tzLabel(req.timezone)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div>
                              <span className={`inline-flex items-center border px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[req.status]}`}>
                                {STATUS_LABEL[req.status]}
                              </span>
                              {matchedTutor && (
                                <p className="text-xs text-slate-400 mt-0.5">→ {matchedTutor.name}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-xs text-slate-400 hidden sm:table-cell">{req.submittedAt}</td>
                          </tr>

                          {/* Expanded tutors for pending requests */}
                          {req.status === 'pending' && (
                            <tr key={req.id + '-expanded'} className="bg-slate-50">
                              <td colSpan={6} className="px-5 py-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="text-sm text-slate-600">Eligible tutors for <strong className="text-slate-900">{req.studentName}</strong> ({req.subject})</div>
                                  <div>
                                    <button
                                      onClick={() => setExpandedRequestId(prev => prev === req.id ? null : req.id)}
                                      className="text-xs bg-white border border-slate-200 text-slate-700 px-3 py-1 rounded-lg"
                                    >
                                      {expandedRequestId === req.id ? 'Hide' : 'View tutors'}
                                    </button>
                                  </div>
                                </div>

                                {expandedRequestId !== req.id ? null : (
                                  (() => {
                                    const elig = tutors
                                      .filter(t => t.status === 'accepted')
                                      .map(t => ({
                                        tutor: t,
                                        subjectMatch: t.subjects.includes(req.subject),
                                        overlaps: computeOverlapWithTimezone(req.availability, t.availability),
                                      }))
                                      .filter(({ subjectMatch, overlaps }) => subjectMatch || overlaps.length > 0)
                                      .sort((a, b) => {
                                        const scoreA = (a.subjectMatch ? 10 : 0) + a.overlaps.length;
                                        const scoreB = (b.subjectMatch ? 10 : 0) + b.overlaps.length;
                                        return scoreB - scoreA;
                                      });

                                    if (elig.length === 0) {
                                      return (
                                        <div className="bg-white border border-slate-100 rounded-xl p-6 text-center">
                                          <p className="text-sm text-slate-400">No eligible tutors — no accepted tutors match both subject and availability (same timezone).</p>
                                        </div>
                                      );
                                    }

                                    return (
                                      <div className="space-y-3">
                                        {elig.map(({ tutor, subjectMatch, overlaps }) => (
                                          <div key={tutor.id} className="bg-white border border-slate-100 rounded-xl p-4 hover:border-slate-200 hover:shadow-sm transition-all">
                                            <div className="flex items-start gap-3">
                                              <AvatarCircle name={tutor.name} />
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                  <p className="text-sm font-medium text-slate-900">{tutor.name}</p>
                                                  {subjectMatch && (
                                                    <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded-full">Subject match</span>
                                                  )}
                                                </div>
                                                <p className="text-xs text-slate-500 mt-0.5">{tutor.subjects.slice(0, 3).join(', ')}</p>
                                                <p className="text-xs text-slate-400 mt-0.5">{tutor.experience} · {tzLabel(tutor.timezone)}</p>

                                                {overlaps.length > 0 ? (
                                                  <OverlapPills overlaps={overlaps} />
                                                ) : (
                                                  <p className="mt-1.5 text-xs text-amber-600 flex items-center gap-1">
                                                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                                                      <path d="M5 3v2.5M5 7h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                                                      <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.3"/>
                                                    </svg>
                                                    No direct overlapping slots (subject match only)
                                                  </p>
                                                )}

                                                <div className="mt-3 flex gap-2">
                                                  <button
                                                    onClick={() => assignForRequest(req.id, tutor.id)}
                                                    disabled={assigningRequestIds.includes(req.id)}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
                                                  >
                                                    {assigningRequestIds.includes(req.id) ? 'Assigning…' : 'Assign'}
                                                  </button>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    );
                                  })()
                                )}
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 border-t border-slate-50 bg-slate-25">
                <p className="text-xs text-slate-400">{filteredRequests.length} of {requests.length} requests</p>
              </div>
            </div>
          </section>
        )}

        {/* ── Tutors tab ── */}
        {tab === 'tutors' && (
          <section aria-label="Volunteer tutors">
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
                  <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <input
                  type="search"
                  placeholder="Search by name or subject…"
                  value={searchTutors}
                  onChange={e => setSearchTutors(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-blue-500 text-sm text-slate-900 placeholder-slate-400 bg-white transition-colors"
                />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {(['all', 'accepted', 'pending', 'inactive'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setTutorFilter(f)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${tutorFilter === f ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'}`}
                  >
                    {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px]" aria-label="Tutors table">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-25">
                      <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3.5">Tutor</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3.5">Subjects</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3.5 hidden lg:table-cell">Availability</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3.5 hidden md:table-cell">Experience</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredTutors.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-sm text-slate-400">No tutors match your filter.</td>
                      </tr>
                    ) : filteredTutors.map(tutor => (
                      <tr key={tutor.id} className="hover:bg-slate-25 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <AvatarCircle name={tutor.name} />
                            <div>
                              <p className="text-sm font-medium text-slate-900">{tutor.name}</p>
                              <p className="text-xs text-slate-400">{tutor.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {tutor.subjects.slice(0, 2).map(s => (
                              <span key={s} className="inline-block bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">{s}</span>
                            ))}
                            {tutor.subjects.length > 2 && (
                              <span className="text-xs text-slate-400 px-1">+{tutor.subjects.length - 2}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 hidden lg:table-cell">
                          <div className="flex flex-col gap-1">
                            {tutor.availability.slice(0, 2).map((s, i) => (
                              <SlotPill key={i} slot={s} />
                            ))}
                            {tutor.availability.length > 2 && (
                              <span className="text-xs text-slate-400">+{tutor.availability.length - 2} more</span>
                            )}
                            <span className="text-xs text-slate-400">{tzLabel(tutor.timezone)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-700 hidden md:table-cell">{tutor.experience}</td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-2">
                            <span className={`inline-flex items-center border px-2 py-0.5 rounded-full text-xs font-medium ${TUTOR_STATUS_BADGE[tutor.status]}`}>
                              {tutor.status.charAt(0).toUpperCase() + tutor.status.slice(1)}
                            </span>

                            {isCoordinator && tutor.status === 'pending' && (
                              <div className="flex items-center gap-2 mt-1">
                                <button
                                  onClick={() => updateTutorStatus(tutor.id, 'accepted')}
                                  disabled={isUpdating(tutor.id)}
                                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg disabled:opacity-50"
                                >
                                  {isUpdating(tutor.id) ? 'Processing…' : 'Approve'}
                                </button>
                                <button
                                  onClick={() => updateTutorStatus(tutor.id, 'rejected')}
                                  disabled={isUpdating(tutor.id)}
                                  className="text-xs bg-white border border-slate-200 text-slate-700 px-3 py-1 rounded-lg disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 border-t border-slate-50 bg-slate-25">
                <p className="text-xs text-slate-400">{filteredTutors.length} of {tutors.length} tutors</p>
              </div>
            </div>
          </section>
        )}

        {/* ── Assignments tab ── */}
        {tab === 'assignments' && (
          <section aria-label="Assignments">
            <div className="mb-4">
              <h2 className="font-display font-semibold text-base text-slate-900">Persistent assignments</h2>
              <p className="mt-0.5 text-sm text-slate-500">Review student and tutor pairings created by coordinators.</p>
            </div>

            {updateError && (
              <div className="mb-4 bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-700">
                {updateError}
              </div>
            )}

            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]" aria-label="Assignments table">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-25">
                      <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3.5">Student</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3.5">Tutor</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3.5">Subject</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3.5">Assigned date</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3.5">Status</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {assignments.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-12 text-sm text-slate-400">No assignments yet.</td>
                      </tr>
                    ) : assignments.map(assignment => (
                      <Fragment key={assignment.id}>
                      <tr key={assignment.id} className="hover:bg-slate-25 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <AvatarCircle name={assignment.studentName} />
                            <div>
                              <p className="text-sm font-medium text-slate-900">{assignment.studentName}</p>
                              <p className="text-xs text-slate-400">{assignment.studentEmail}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <AvatarCircle name={assignment.tutorName} />
                            <div>
                              <p className="text-sm font-medium text-slate-900">{assignment.tutorName}</p>
                              <p className="text-xs text-slate-400">{assignment.tutorEmail}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-700">{assignment.subject}</td>
                        <td className="px-4 py-4 text-sm text-slate-500">
                          {new Date(assignment.assignedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex w-fit items-center border px-2 py-0.5 rounded-full text-xs font-medium ${assignment.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                              {assignment.isActive ? 'Active' : 'Needs Rematch / Inactive'}
                            </span>
                            {assignment.issueType && (
                              <span className="text-xs text-amber-700">
                                {assignment.issueType === 'one_time_cancellation' ? 'One-time cancellation' : assignment.issueType === 'schedule_change' ? 'Schedule change' : 'Needs rematch'}
                              </span>
                            )}
                            {assignment.issueNote && <span className="text-xs text-slate-400">{assignment.issueNote}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <button
                            onClick={() => {
                              setEditingAssignmentId(assignment.id);
                              setIssueType(assignment.issueType ?? 'one_time_cancellation');
                              setIssueReportedBy(assignment.issueReportedBy ?? 'student');
                              setIssueNote(assignment.issueNote ?? '');
                              setUpdateError('');
                            }}
                            className="text-xs bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50"
                          >
                            Manage issue
                          </button>
                        </td>
                      </tr>
                      {editingAssignmentId === assignment.id && (
                        <tr key={`${assignment.id}-editor`} className="bg-slate-50">
                          <td colSpan={6} className="px-5 py-4">
                            <div className="grid gap-3 sm:grid-cols-3 items-end">
                              <label className="text-xs font-medium text-slate-600">
                                Issue type
                                <select value={issueType} onChange={event => setIssueType(event.target.value as IssueType)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-800">
                                  <option value="one_time_cancellation">One-time cancellation</option>
                                  <option value="schedule_change">Schedule change</option>
                                  <option value="needs_rematch">Needs rematch</option>
                                </select>
                              </label>
                              <label className="text-xs font-medium text-slate-600">
                                Reported by
                                <select value={issueReportedBy} onChange={event => setIssueReportedBy(event.target.value as IssueReportedBy)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-800">
                                  <option value="student">Student</option>
                                  <option value="tutor">Tutor</option>
                                </select>
                              </label>
                              <label className="text-xs font-medium text-slate-600">
                                Short note
                                <input value={issueNote} onChange={event => setIssueNote(event.target.value)} maxLength={300} placeholder="Add a note" className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-800" />
                              </label>
                            </div>
                            <div className="mt-3 flex justify-end gap-2">
                              <button onClick={() => setEditingAssignmentId(null)} className="text-xs border border-slate-200 bg-white text-slate-700 px-3 py-1.5 rounded-lg">Cancel</button>
                              <button onClick={() => saveAssignmentIssue(assignment)} disabled={savingAssignmentIds.includes(assignment.id)} className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg disabled:opacity-50">
                                {savingAssignmentIds.includes(assignment.id) ? 'Saving…' : 'Save issue'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 border-t border-slate-50 bg-slate-25">
                <p className="text-xs text-slate-400">{assignments.length} assignment{assignments.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </section>
        )}

        {/* ── Matching tab ── */}
        {tab === 'matching' && (
          <section aria-label="Matching interface">
            <div className="grid lg:grid-cols-2 gap-5">
              {/* Left: open student requests */}
              <div>
                <h2 className="font-display font-semibold text-base text-slate-900 mb-3">
                  Open student requests
                  <span className="ml-2 text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    {requests.filter(r => r.status !== 'matched').length} open
                  </span>
                </h2>
                <div className="space-y-2">
                  {requests.filter(r => r.status !== 'matched').map(req => (
                    <button
                      key={req.id}
                      onClick={() => setSelectedRequestId(prev => prev === req.id ? null : req.id)}
                      aria-pressed={selectedRequestId === req.id}
                      className={`w-full text-left bg-white border rounded-xl p-4 transition-all hover:border-blue-300 ${selectedRequestId === req.id ? 'border-blue-400 ring-2 ring-blue-100 shadow-sm' : 'border-slate-100'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <AvatarCircle name={req.studentName} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-slate-900">{req.studentName}</p>
                            <p className="text-xs text-slate-500">{req.subject} · {req.gradeLevel}</p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center border px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${STATUS_BADGE[req.status]}`}>
                          {STATUS_LABEL[req.status]}
                        </span>
                      </div>
                      {req.description && (
                        <p className="mt-2.5 text-xs text-slate-500 line-clamp-2 leading-relaxed pl-10">{req.description}</p>
                      )}
                      <div className="mt-2 pl-10 flex flex-wrap gap-1">
                        {req.availability.map((s, i) => <SlotPill key={i} slot={s} />)}
                        <span className="text-xs text-slate-400 self-center">{tzLabel(req.timezone)}</span>
                      </div>
                    </button>
                  ))}
                  {requests.filter(r => r.status !== 'matched').length === 0 && (
                    <div className="text-center py-10 text-sm text-slate-400">All requests have been matched!</div>
                  )}
                </div>
              </div>

              {/* Right: eligible tutors */}
              <div>
                <h2 className="font-display font-semibold text-base text-slate-900 mb-3">
                  {selectedRequest
                    ? <>Available tutors for <span className="text-blue-600">{selectedRequest.subject}</span></>
                    : 'Select a request to see available tutors'}
                </h2>

                {!selectedRequest ? (
                  <div className="bg-white border border-dashed border-slate-200 rounded-xl py-16 text-center">
                    <svg className="mx-auto mb-3 text-slate-300" width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                      <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="22" cy="12" r="7" stroke="currentColor" strokeWidth="2"/>
                      <path d="M2 27c0-5 4.5-8 10-8M30 27c0-5-4.5-8-10-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <p className="text-sm text-slate-400">Select a student request from the left panel</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                      {eligibleTutors.length === 0 && (
                      <div className="bg-white border border-slate-100 rounded-xl py-10 text-center">
                        <p className="text-sm text-slate-400">No accepted tutors match this subject and availability.</p>
                        <p className="mt-1 text-xs text-slate-300">Check the tutors tab or try a different request.</p>
                      </div>
                    )}
                    {eligibleTutors.map(({ tutor, subjectMatch, overlaps }) => (
                      <div key={tutor.id} className="bg-white border border-slate-100 rounded-xl p-4 hover:border-slate-200 hover:shadow-sm transition-all">
                        <div className="flex items-start gap-3">
                          <AvatarCircle name={tutor.name} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium text-slate-900">{tutor.name}</p>
                              {subjectMatch && (
                                <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded-full">Subject match</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{tutor.subjects.slice(0, 3).join(', ')}</p>
                            <p className="text-xs text-slate-400 mt-0.5">Experience: {tutor.experience} · {tzLabel(tutor.timezone)}</p>

                            {/* Overlapping slots */}
                            {overlaps.length > 0 ? (
                              <OverlapPills overlaps={overlaps} />
                            ) : (
                              <p className="mt-1.5 text-xs text-amber-600 flex items-center gap-1">
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                                  <path d="M5 3v2.5M5 7h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                                  <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.3"/>
                                </svg>
                                No direct time overlap — subject match only
                              </p>
                            )}

                            {/* Tutor's slots for reference */}
                            <div className="mt-2 flex flex-wrap gap-1">
                              {tutor.availability.map((s, i) => <SlotPill key={i} slot={s} />)}
                            </div>
                          </div>
                          <button
                            onClick={() => assignForRequest(selectedRequest.id, tutor.id)}
                            disabled={assigningRequestIds.includes(selectedRequest.id)}
                            className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {assigningRequestIds.includes(selectedRequest.id) ? 'Assigning…' : 'Assign'}
                          </button>
                        </div>
                      </div>
                    ))}
                    {eligibleTutors.length > 0 && (
                      <p className="text-xs text-slate-400 pt-1 text-center">
                        {eligibleTutors.length} eligible tutor{eligibleTutors.length !== 1 ? 's' : ''} · sorted by best match
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
