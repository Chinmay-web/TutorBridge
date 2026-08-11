import { useState } from 'react';
import { SUBJECTS, GRADE_LEVELS, type TimeSlot } from '../data/mockData';
import AvailabilityPicker from '../components/AvailabilityPicker';

interface StudentFormProps {
  onNavigate: (page: string) => void;
}

export default function StudentForm({ onNavigate }: StudentFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    gradeLevel: '',
    availability: [] as TimeSlot[],
    timezone: 'America/Chicago',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required.';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'A valid email is required.';
    if (!form.subject) e.subject = 'Please choose a subject.';
    if (!form.gradeLevel) e.gradeLevel = 'Please select a grade level.';
    if (form.availability.length === 0) e.availability = 'Please add at least one availability slot.';
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length > 0) { setErrors(e2); return; }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-25 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <path d="M6 14l6 6 10-10" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="font-display font-bold text-2xl text-slate-900">Request received!</h2>
          <p className="mt-3 text-slate-500 text-sm leading-relaxed">
            Thanks, <strong>{form.name}</strong>! We've received your tutoring request for <strong>{form.subject}</strong>.
            A coordinator will reach out to you at <strong>{form.email}</strong> within 2–3 business days.
          </p>
          <button
            onClick={() => onNavigate('landing')}
            className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-25 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-5 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M8.5 2L3.5 7L8.5 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
          <h1 className="font-display font-bold text-3xl text-slate-900">Request tutoring</h1>
          <p className="mt-2 text-slate-500">Fill out this short form and we'll match you with a volunteer tutor. Free, always.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
              Full name <span className="text-rose-500" aria-hidden="true">*</span>
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErrors(p => ({ ...p, name: '' })); }}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-900 placeholder-slate-400 transition-colors ${errors.name ? 'border-rose-400 bg-rose-50' : 'border-slate-200 hover:border-slate-300 focus:border-blue-500'}`}
              placeholder="Your full name"
              aria-invalid={!!errors.name}
            />
            {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
              Email address <span className="text-rose-500" aria-hidden="true">*</span>
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={e => { setForm(p => ({ ...p, email: e.target.value })); setErrors(p => ({ ...p, email: '' })); }}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-900 placeholder-slate-400 transition-colors ${errors.email ? 'border-rose-400 bg-rose-50' : 'border-slate-200 hover:border-slate-300 focus:border-blue-500'}`}
              placeholder="you@example.com"
              aria-invalid={!!errors.email}
            />
            {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email}</p>}
          </div>

          {/* Subject + Grade level */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-1.5">
                Subject <span className="text-rose-500" aria-hidden="true">*</span>
              </label>
              <select
                id="subject"
                value={form.subject}
                onChange={e => { setForm(p => ({ ...p, subject: e.target.value })); setErrors(p => ({ ...p, subject: '' })); }}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-900 transition-colors bg-white appearance-none ${errors.subject ? 'border-rose-400 bg-rose-50' : 'border-slate-200 hover:border-slate-300 focus:border-blue-500'}`}
                aria-invalid={!!errors.subject}
              >
                <option value="">Choose a subject…</option>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.subject && <p className="mt-1 text-xs text-rose-600">{errors.subject}</p>}
            </div>
            <div>
              <label htmlFor="grade" className="block text-sm font-medium text-slate-700 mb-1.5">
                Grade level <span className="text-rose-500" aria-hidden="true">*</span>
              </label>
              <select
                id="grade"
                value={form.gradeLevel}
                onChange={e => { setForm(p => ({ ...p, gradeLevel: e.target.value })); setErrors(p => ({ ...p, gradeLevel: '' })); }}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-900 transition-colors bg-white appearance-none ${errors.gradeLevel ? 'border-rose-400 bg-rose-50' : 'border-slate-200 hover:border-slate-300 focus:border-blue-500'}`}
                aria-invalid={!!errors.gradeLevel}
              >
                <option value="">Choose grade level…</option>
                {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              {errors.gradeLevel && <p className="mt-1 text-xs text-rose-600">{errors.gradeLevel}</p>}
            </div>
          </div>

          {/* Availability */}
          <div className="border-t border-slate-100 pt-5">
            <AvailabilityPicker
              slots={form.availability}
              timezone={form.timezone}
              onChange={(slots, timezone) => {
                setForm(p => ({ ...p, availability: slots, timezone }));
                setErrors(p => ({ ...p, availability: '' }));
              }}
              error={errors.availability}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1.5">
              What do you need help with? <span className="text-slate-400 text-xs">(optional)</span>
            </label>
            <textarea
              id="description"
              rows={4}
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-blue-500 text-sm text-slate-900 placeholder-slate-400 resize-none transition-colors"
              placeholder="Describe the specific topics, upcoming tests, or goals you have in mind…"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Submit request
          </button>
        </form>
      </div>
    </div>
  );
}
