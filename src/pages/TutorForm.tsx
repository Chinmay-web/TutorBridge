import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { SUBJECTS, type TimeSlot } from '../data/mockData';
import AvailabilityPicker from '../components/AvailabilityPicker';

interface TutorFormProps {
  onNavigate: (page: string) => void;
}

export default function TutorForm({ onNavigate }: TutorFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subjects: [] as string[],
    availability: [] as TimeSlot[],
    timezone: 'America/Chicago',
    experience: '',
    bio: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleSubject = (s: string) => {
    setForm(prev => ({
      ...prev,
      subjects: prev.subjects.includes(s) ? prev.subjects.filter(x => x !== s) : [...prev.subjects, s],
    }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required.';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'A valid email is required.';
    if (form.subjects.length === 0) e.subjects = 'Please select at least one subject.';
    if (form.availability.length === 0) e.availability = 'Please add at least one availability slot.';
    if (!form.experience) e.experience = 'Please select your experience level.';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length > 0) { setErrors(e2); return; }

    setSubmitting(true);
    setSubmitError('');

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      subjects: form.subjects,
      bio: form.bio.trim() || null,
      availability: form.availability.map(slot => ({
        day: slot.day,
        startTime: slot.startTime,
        endTime: slot.endTime,
        timezone: form.timezone,
      })),
    };

    const { error } = await supabase.from('tutors').insert(payload);

    setSubmitting(false);

    if (error) {
      console.error('Supabase tutor insert error:', error);
      setSubmitError('Unable to submit your application right now. Please try again in a moment.');
      return;
    }

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
          <h2 className="font-display font-bold text-2xl text-slate-900">Application submitted!</h2>
          <p className="mt-3 text-slate-500 text-sm leading-relaxed">
            Thank you, <strong>{form.name}</strong>! We're thrilled you want to volunteer.
            Our coordinator team will review your application and contact you at <strong>{form.email}</strong> within a few days.
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
          <h1 className="font-display font-bold text-3xl text-slate-900">Become a volunteer tutor</h1>
          <p className="mt-2 text-slate-500">Share your expertise and make a real difference. Applications are reviewed within 48 hours.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
          {/* Name + Email */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="t-name" className="block text-sm font-medium text-slate-700 mb-1.5">
                Full name <span className="text-rose-500" aria-hidden="true">*</span>
              </label>
              <input
                id="t-name"
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErrors(p => ({ ...p, name: '' })); }}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-900 placeholder-slate-400 transition-colors ${errors.name ? 'border-rose-400 bg-rose-50' : 'border-slate-200 hover:border-slate-300 focus:border-blue-500'}`}
                placeholder="Your full name"
              />
              {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="t-email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Email address <span className="text-rose-500" aria-hidden="true">*</span>
              </label>
              <input
                id="t-email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={e => { setForm(p => ({ ...p, email: e.target.value })); setErrors(p => ({ ...p, email: '' })); }}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-900 placeholder-slate-400 transition-colors ${errors.email ? 'border-rose-400 bg-rose-50' : 'border-slate-200 hover:border-slate-300 focus:border-blue-500'}`}
                placeholder="you@example.com"
              />
              {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email}</p>}
            </div>
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="t-phone" className="block text-sm font-medium text-slate-700 mb-1.5">
              Phone number <span className="text-slate-400 text-xs">(optional)</span>
            </label>
            <input
              id="t-phone"
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-blue-500 text-sm text-slate-900 placeholder-slate-400 transition-colors"
              placeholder="(512) 555-0100"
            />
          </div>

          {/* Subjects */}
          <div>
            <p className="block text-sm font-medium text-slate-700 mb-1.5">
              Subjects you can tutor <span className="text-rose-500" aria-hidden="true">*</span>
            </p>
            <p className="text-xs text-slate-400 mb-3">Select all that apply</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Subjects">
              {SUBJECTS.map(s => {
                const checked = form.subjects.includes(s);
                return (
                  <label
                    key={s}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium cursor-pointer transition-all select-none ${checked ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() => { toggleSubject(s); setErrors(p => ({ ...p, subjects: '' })); }}
                    />
                    {s}
                  </label>
                );
              })}
            </div>
            {errors.subjects && <p className="mt-2 text-xs text-rose-600">{errors.subjects}</p>}
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

          {/* Experience */}
          <div>
            <label htmlFor="t-experience" className="block text-sm font-medium text-slate-700 mb-1.5">
              Tutoring / teaching experience <span className="text-rose-500" aria-hidden="true">*</span>
            </label>
            <select
              id="t-experience"
              value={form.experience}
              onChange={e => { setForm(p => ({ ...p, experience: e.target.value })); setErrors(p => ({ ...p, experience: '' })); }}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-900 transition-colors bg-white appearance-none ${errors.experience ? 'border-rose-400 bg-rose-50' : 'border-slate-200 hover:border-slate-300 focus:border-blue-500'}`}
            >
              <option value="">Select experience level…</option>
              <option value="none">No prior tutoring experience</option>
              <option value="less-than-1">Less than 1 year</option>
              <option value="1-2">1–2 years</option>
              <option value="3-5">3–5 years</option>
              <option value="5+">5+ years</option>
            </select>
            {errors.experience && <p className="mt-1 text-xs text-rose-600">{errors.experience}</p>}
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="t-bio" className="block text-sm font-medium text-slate-700 mb-1.5">
              Tell us about yourself <span className="text-slate-400 text-xs">(optional)</span>
            </label>
            <textarea
              id="t-bio"
              rows={4}
              value={form.bio}
              onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-blue-500 text-sm text-slate-900 placeholder-slate-400 resize-none transition-colors"
              placeholder="Your background, teaching philosophy, or anything that would help us place you with the right students…"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting…' : 'Submit application'}
          </button>
          {submitError && <p className="mt-3 text-sm text-rose-600">{submitError}</p>}
        </form>
      </div>
    </div>
  );
}
