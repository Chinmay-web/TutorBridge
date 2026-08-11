import { useState } from 'react';
import type { TimeSlot } from '../data/mockData';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const TIMES: string[] = [];
for (let h = 7; h <= 22; h++) {
  TIMES.push(`${String(h).padStart(2, '0')}:00`);
  if (h < 22) TIMES.push(`${String(h).padStart(2, '0')}:30`);
}

export const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern (ET)' },
  { value: 'America/Chicago', label: 'Central (CT)' },
  { value: 'America/Denver', label: 'Mountain (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific (PT)' },
  { value: 'America/Anchorage', label: 'Alaska (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii (HT)' },
];

export function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const period = h < 12 ? 'AM' : 'PM';
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

export function formatSlot(slot: TimeSlot): string {
  return `${slot.day} ${formatTime(slot.startTime)}–${formatTime(slot.endTime)}`;
}

interface AvailabilityPickerProps {
  slots: TimeSlot[];
  timezone: string;
  onChange: (slots: TimeSlot[], timezone: string) => void;
  error?: string;
}

export default function AvailabilityPicker({ slots, timezone, onChange, error }: AvailabilityPickerProps) {
  const [day, setDay] = useState('Monday');
  const [startTime, setStartTime] = useState('16:00');
  const [endTime, setEndTime] = useState('17:30');
  const [addError, setAddError] = useState('');

  const validEndTimes = TIMES.filter(t => t > startTime);

  const handleAdd = () => {
    if (endTime <= startTime) {
      setAddError('End time must be after start time.');
      return;
    }
    const duplicate = slots.some(s => s.day === day && s.startTime === startTime && s.endTime === endTime);
    if (duplicate) {
      setAddError('This slot is already added.');
      return;
    }
    setAddError('');
    onChange([...slots, { day, startTime, endTime }], timezone);
  };

  const handleRemove = (i: number) => {
    onChange(slots.filter((_, idx) => idx !== i), timezone);
  };

  const handleTimezone = (tz: string) => {
    onChange(slots, tz);
  };

  return (
    <div className="space-y-4">
      {/* Timezone */}
      <div>
        <label htmlFor="timezone" className="block text-sm font-medium text-slate-700 mb-1.5">
          Timezone <span className="text-rose-500" aria-hidden="true">*</span>
        </label>
        <select
          id="timezone"
          value={timezone}
          onChange={e => handleTimezone(e.target.value)}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-blue-500 text-sm text-slate-900 bg-white appearance-none transition-colors"
        >
          {TIMEZONES.map(tz => (
            <option key={tz.value} value={tz.value}>{tz.label}</option>
          ))}
        </select>
      </div>

      {/* Add slot row */}
      <div>
        <p className="text-sm font-medium text-slate-700 mb-1.5">
          Availability slots <span className="text-rose-500" aria-hidden="true">*</span>
        </p>
        <p className="text-xs text-slate-400 mb-3">Add all time slots when you're available. You can add multiple.</p>

        <div className="flex flex-wrap gap-2 items-end">
          {/* Day */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Day</label>
            <select
              value={day}
              onChange={e => setDay(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-blue-500 text-sm text-slate-900 bg-white appearance-none transition-colors"
              aria-label="Day of week"
            >
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Start */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Start time</label>
            <select
              value={startTime}
              onChange={e => {
                setStartTime(e.target.value);
                if (endTime <= e.target.value) {
                  const next = TIMES.find(t => t > e.target.value);
                  if (next) setEndTime(next);
                }
                setAddError('');
              }}
              className="px-3 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-blue-500 text-sm text-slate-900 bg-white appearance-none transition-colors"
              aria-label="Start time"
            >
              {TIMES.filter(t => t < '22:00').map(t => (
                <option key={t} value={t}>{formatTime(t)}</option>
              ))}
            </select>
          </div>

          {/* End */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">End time</label>
            <select
              value={endTime}
              onChange={e => { setEndTime(e.target.value); setAddError(''); }}
              className="px-3 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-blue-500 text-sm text-slate-900 bg-white appearance-none transition-colors"
              aria-label="End time"
            >
              {validEndTimes.map(t => (
                <option key={t} value={t}>{formatTime(t)}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors self-end"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            Add slot
          </button>
        </div>

        {addError && <p className="mt-1.5 text-xs text-rose-600">{addError}</p>}
      </div>

      {/* Slot list */}
      {slots.length > 0 && (
        <ul className="space-y-2" aria-label="Added availability slots">
          {slots.map((slot, i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-3 px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-xl"
            >
              <div className="flex items-center gap-2.5">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-blue-500 flex-shrink-0" aria-hidden="true">
                  <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M7 4.5V7l1.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-sm text-blue-800 font-medium">{slot.day}</span>
                <span className="text-sm text-blue-600">{formatTime(slot.startTime)} – {formatTime(slot.endTime)}</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="text-blue-400 hover:text-rose-500 transition-colors p-0.5 rounded"
                aria-label={`Remove ${formatSlot(slot)}`}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      {slots.length === 0 && (
        <p className="text-xs text-slate-400 italic">No slots added yet. Use the controls above to add your availability.</p>
      )}

      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
