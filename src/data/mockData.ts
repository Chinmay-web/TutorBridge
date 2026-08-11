export type Subject = string;
export type RequestStatus = 'unmatched' | 'matched' | 'pending';
export type TutorStatus = 'active' | 'inactive' | 'pending';

export interface TimeSlot {
  day: string;
  startTime: string; // 'HH:MM' 24h
  endTime: string;   // 'HH:MM' 24h
}

/** Returns true if two TimeSlots have any overlapping minutes on the same day. */
export function slotsOverlap(a: TimeSlot, b: TimeSlot): boolean {
  if (a.day !== b.day) return false;
  return a.startTime < b.endTime && b.startTime < a.endTime;
}

/** Returns all pairs of overlapping slots between two availability arrays. */
export function computeOverlap(a: TimeSlot[], b: TimeSlot[]): Array<{ a: TimeSlot; b: TimeSlot }> {
  const result: Array<{ a: TimeSlot; b: TimeSlot }> = [];
  for (const sa of a) {
    for (const sb of b) {
      if (slotsOverlap(sa, sb)) result.push({ a: sa, b: sb });
    }
  }
  return result;
}

export interface StudentRequest {
  id: string;
  studentName: string;
  email: string;
  subject: string;
  gradeLevel: string;
  availability: TimeSlot[];
  timezone: string;
  description: string;
  status: RequestStatus;
  matchedTutorId?: string;
  submittedAt: string;
}

export interface Tutor {
  id: string;
  name: string;
  email: string;
  phone: string;
  subjects: string[];
  availability: TimeSlot[];
  timezone: string;
  experience: string;
  bio: string;
  status: TutorStatus;
  joinedAt: string;
}

export interface Match {
  id: string;
  requestId: string;
  tutorId: string;
  createdAt: string;
}

export const SUBJECTS = [
  'Algebra', 'Geometry', 'Pre-Calculus', 'Calculus', 'Statistics',
  'Biology', 'Chemistry', 'Physics', 'Earth Science',
  'English / Writing', 'Reading Comprehension', 'SAT / ACT Prep',
  'US History', 'World History', 'Spanish', 'French', 'Mandarin',
  'Computer Science', 'Economics',
];

export const GRADE_LEVELS = [
  'K–2nd', '3rd–5th', '6th–8th', '9th–10th', '11th–12th', 'College',
];

export const mockTutors: Tutor[] = [
  {
    id: 't1',
    name: 'Maya Okonkwo',
    email: 'maya.okonkwo@email.com',
    phone: '(512) 555-0142',
    subjects: ['Algebra', 'Pre-Calculus', 'Calculus', 'Statistics'],
    availability: [
      { day: 'Tuesday', startTime: '15:00', endTime: '18:00' },
      { day: 'Thursday', startTime: '15:00', endTime: '18:00' },
      { day: 'Saturday', startTime: '10:00', endTime: '13:00' },
    ],
    timezone: 'America/Chicago',
    experience: '4 years',
    bio: 'Math teacher at Austin ISD, passionate about making math approachable for all students.',
    status: 'active',
    joinedAt: '2025-09-03',
  },
  {
    id: 't2',
    name: 'Daniel Reyes',
    email: 'd.reyes@email.com',
    phone: '(737) 555-0287',
    subjects: ['Biology', 'Chemistry', 'Physics'],
    availability: [
      { day: 'Monday', startTime: '18:00', endTime: '20:00' },
      { day: 'Wednesday', startTime: '18:00', endTime: '20:00' },
      { day: 'Sunday', startTime: '14:00', endTime: '17:00' },
    ],
    timezone: 'America/Chicago',
    experience: '2 years',
    bio: 'Graduate student in biochemistry at UT Austin. Loves working with curious students.',
    status: 'active',
    joinedAt: '2025-10-15',
  },
  {
    id: 't3',
    name: 'Priya Nair',
    email: 'priya.nair@email.com',
    phone: '(512) 555-0391',
    subjects: ['English / Writing', 'Reading Comprehension', 'SAT / ACT Prep'],
    availability: [
      { day: 'Tuesday', startTime: '09:00', endTime: '11:30' },
      { day: 'Friday', startTime: '14:00', endTime: '17:00' },
      { day: 'Saturday', startTime: '09:00', endTime: '12:00' },
    ],
    timezone: 'America/Chicago',
    experience: '6 years',
    bio: 'Former high school English teacher, now tutoring full-time. Specializes in test prep.',
    status: 'active',
    joinedAt: '2025-08-21',
  },
  {
    id: 't4',
    name: 'James Whitfield',
    email: 'james.w@email.com',
    phone: '(512) 555-0044',
    subjects: ['US History', 'World History', 'Economics'],
    availability: [
      { day: 'Wednesday', startTime: '09:00', endTime: '12:00' },
      { day: 'Thursday', startTime: '09:00', endTime: '12:00' },
      { day: 'Sunday', startTime: '15:00', endTime: '18:00' },
    ],
    timezone: 'America/Chicago',
    experience: '3 years',
    bio: 'History enthusiast and community college instructor. Makes history feel relevant.',
    status: 'active',
    joinedAt: '2025-11-02',
  },
  {
    id: 't5',
    name: 'Sofia Castellanos',
    email: 'sofia.c@email.com',
    phone: '(737) 555-0156',
    subjects: ['Spanish', 'French', 'English / Writing'],
    availability: [
      { day: 'Monday', startTime: '14:00', endTime: '17:00' },
      { day: 'Friday', startTime: '09:00', endTime: '11:00' },
      { day: 'Saturday', startTime: '13:00', endTime: '16:00' },
    ],
    timezone: 'America/Chicago',
    experience: '1 year',
    bio: 'Native Spanish speaker, fluent in French. Enthusiastic about language learning.',
    status: 'pending',
    joinedAt: '2026-01-18',
  },
  {
    id: 't6',
    name: 'Ethan Park',
    email: 'ethan.park@email.com',
    phone: '(512) 555-0723',
    subjects: ['Computer Science', 'Algebra', 'Statistics'],
    availability: [
      { day: 'Tuesday', startTime: '18:00', endTime: '20:30' },
      { day: 'Thursday', startTime: '18:00', endTime: '20:30' },
      { day: 'Sunday', startTime: '13:00', endTime: '16:00' },
    ],
    timezone: 'America/Chicago',
    experience: '2 years',
    bio: 'Software engineer volunteering his weekends to help the next generation of coders.',
    status: 'inactive',
    joinedAt: '2025-07-30',
  },
];

export const mockRequests: StudentRequest[] = [
  {
    id: 'r1',
    studentName: 'Amara Johnson',
    email: 'amara.j@student.edu',
    subject: 'Algebra',
    gradeLevel: '9th–10th',
    availability: [
      { day: 'Tuesday', startTime: '15:30', endTime: '17:30' },
      { day: 'Thursday', startTime: '15:30', endTime: '17:30' },
    ],
    timezone: 'America/Chicago',
    description: 'Struggling with quadratic equations and graphing functions. Would love a patient tutor.',
    status: 'matched',
    matchedTutorId: 't1',
    submittedAt: '2026-01-20',
  },
  {
    id: 'r2',
    studentName: 'Luis Fernandez',
    email: 'luis.f@student.edu',
    subject: 'Biology',
    gradeLevel: '11th–12th',
    availability: [
      { day: 'Monday', startTime: '18:30', endTime: '20:00' },
      { day: 'Wednesday', startTime: '18:30', endTime: '20:00' },
    ],
    timezone: 'America/Chicago',
    description: 'Preparing for AP Biology exam. Need help with cellular respiration and genetics.',
    status: 'matched',
    matchedTutorId: 't2',
    submittedAt: '2026-01-22',
  },
  {
    id: 'r3',
    studentName: 'Destiny Williams',
    email: 'destiny.w@student.edu',
    subject: 'SAT / ACT Prep',
    gradeLevel: '11th–12th',
    availability: [
      { day: 'Saturday', startTime: '09:30', endTime: '12:00' },
      { day: 'Sunday', startTime: '14:00', endTime: '16:30' },
    ],
    timezone: 'America/Chicago',
    description: 'Taking the SAT in March. Math and reading sections are my weakest areas.',
    status: 'unmatched',
    submittedAt: '2026-01-28',
  },
  {
    id: 'r4',
    studentName: 'Marcus Thompson',
    email: 'marcus.t@student.edu',
    subject: 'English / Writing',
    gradeLevel: '6th–8th',
    availability: [
      { day: 'Tuesday', startTime: '10:00', endTime: '11:30' },
      { day: 'Friday', startTime: '15:00', endTime: '17:00' },
    ],
    timezone: 'America/Chicago',
    description: 'Needs help with essay structure and grammar. Working on a school project.',
    status: 'unmatched',
    submittedAt: '2026-02-01',
  },
  {
    id: 'r5',
    studentName: 'Isabelle Chen',
    email: 'isabelle.c@student.edu',
    subject: 'Chemistry',
    gradeLevel: '11th–12th',
    availability: [
      { day: 'Wednesday', startTime: '18:00', endTime: '19:30' },
      { day: 'Sunday', startTime: '15:00', endTime: '17:00' },
    ],
    timezone: 'America/Chicago',
    description: 'Balancing equations and stoichiometry are really challenging for me.',
    status: 'unmatched',
    submittedAt: '2026-02-04',
  },
  {
    id: 'r6',
    studentName: 'Kofi Asante',
    email: 'kofi.a@student.edu',
    subject: 'Pre-Calculus',
    gradeLevel: '11th–12th',
    availability: [
      { day: 'Tuesday', startTime: '15:00', endTime: '17:00' },
      { day: 'Saturday', startTime: '10:00', endTime: '12:00' },
    ],
    timezone: 'America/Chicago',
    description: 'Trigonometry unit is really tough. I have a test in two weeks.',
    status: 'pending',
    submittedAt: '2026-02-06',
  },
  {
    id: 'r7',
    studentName: 'Elena Romero',
    email: 'elena.r@student.edu',
    subject: 'Spanish',
    gradeLevel: '6th–8th',
    availability: [
      { day: 'Monday', startTime: '15:00', endTime: '16:30' },
      { day: 'Saturday', startTime: '14:00', endTime: '16:00' },
    ],
    timezone: 'America/Chicago',
    description: 'Just starting Spanish 1. Need help with pronunciation and basic grammar.',
    status: 'unmatched',
    submittedAt: '2026-02-08',
  },
];

export const mockMatches: Match[] = [
  { id: 'm1', requestId: 'r1', tutorId: 't1', createdAt: '2026-01-23' },
  { id: 'm2', requestId: 'r2', tutorId: 't2', createdAt: '2026-01-25' },
];
