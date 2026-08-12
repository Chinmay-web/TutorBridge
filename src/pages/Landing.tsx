interface LandingProps {
  onNavigate: (page: string) => void;
}

export default function Landing({ onNavigate }: LandingProps) {
  return (
    <main>
      {/* Hero */}
      <section className="relative bg-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, #eff6ff 0%, transparent 70%)' }} className="absolute inset-0" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
          <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold tracking-wide uppercase px-3 py-1.5 rounded-full mb-6 border border-blue-100">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Nonprofit tutoring for every student
          </span>
          <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-slate-900 leading-tight tracking-tight max-w-3xl mx-auto">
            Every student deserves a{' '}
            <span className="text-blue-600">great tutor.</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
            TutorBridge connects K–12 students with skilled volunteer tutors — free of charge.
            Whether you need help or want to give it, we make the match.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => onNavigate('student-form')}
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-base px-6 py-3.5 rounded-xl transition-colors shadow-sm shadow-blue-200"
            >
              Request Tutoring
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              onClick={() => onNavigate('tutor-form')}
              className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-base px-6 py-3.5 rounded-xl transition-colors border border-slate-200"
            >
              Become a Tutor
            </button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="font-display font-bold text-3xl text-slate-900">How it works</h2>
          <p className="mt-3 text-slate-500">Simple. Fast. Free.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              step: '01',
              title: 'Submit a request',
              body: 'Students or parents fill out a short form with their subject, schedule, and grade level. No account needed.',
              icon: (
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                  <rect x="3" y="2" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.7"/>
                  <path d="M7 8h8M7 12h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                </svg>
              ),
            },
            {
              step: '02',
              title: 'We find a match',
              body: 'Our coordinators review requests and pair each student with a qualified volunteer tutor based on subject and availability.',
              icon: (
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                  <circle cx="8" cy="9" r="3.5" stroke="currentColor" strokeWidth="1.7"/>
                  <circle cx="15" cy="9" r="3.5" stroke="currentColor" strokeWidth="1.7"/>
                  <path d="M2 19c0-3.314 2.686-5 6-5M20 19c0-3.314-2.686-5-6-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                  <path d="M11 14h0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                </svg>
              ),
            },
            {
              step: '03',
              title: 'Start learning',
              body: 'Student and tutor connect directly. Sessions happen online or in-person — whatever works for both parties.',
              icon: (
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                  <path d="M11 2L13.5 8.5H20L14.5 12.5L16.5 19L11 15.5L5.5 19L7.5 12.5L2 8.5H8.5L11 2Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
                </svg>
              ),
            },
          ].map(item => (
            <div key={item.step} className="bg-white border border-slate-100 rounded-2xl p-7 hover:border-slate-200 hover:shadow-sm transition-all">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  {item.icon}
                </div>
                <span className="text-xs font-semibold text-slate-300 font-display mt-2.5">{item.step}</span>
              </div>
              <h3 className="font-display font-semibold text-lg text-slate-900 mt-4">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="bg-blue-600 rounded-2xl p-8 text-white">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center mb-5">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M10 2a5 5 0 100 10A5 5 0 0010 2zM3 17c0-3 3-5 7-5s7 2 7 5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className="font-display font-bold text-2xl">Need a tutor?</h3>
            <p className="mt-2 text-blue-100 text-sm leading-relaxed">
              We offer free tutoring support in 18+ subjects. Flexible scheduling, no commitment required.
            </p>
            <button
              onClick={() => onNavigate('student-form')}
              className="mt-6 inline-flex items-center gap-2 bg-white text-blue-600 hover:bg-blue-50 font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
            >
              Request tutoring
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2.5 7h9M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <div className="bg-slate-900 rounded-2xl p-8 text-white">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-5">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M10 2L12.5 7.5H18L13.5 11.5L15.5 17L10 13.5L4.5 17L6.5 11.5L2 7.5H7.5L10 2Z" stroke="white" strokeWidth="1.7" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="font-display font-bold text-2xl">Want to give back?</h3>
            <p className="mt-2 text-slate-400 text-sm leading-relaxed">
              Share your knowledge and make a lasting impact in your community. Volunteer a few hours a week.
            </p>
            <button
              onClick={() => onNavigate('tutor-form')}
              className="mt-6 inline-flex items-center gap-2 bg-white text-slate-900 hover:bg-slate-100 font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
            >
              Become a tutor
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2.5 7h9M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-slate-25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-display font-semibold text-slate-700 text-sm">TutorBridge</span>
          <p className="text-xs text-slate-400">© 2026 TutorBridge. A nonprofit tutoring initiative.</p>
        </div>
      </footer>
    </main>
  );
}
