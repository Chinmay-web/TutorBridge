interface NavProps {
  page: string;
  onNavigate: (page: string) => void;
}

export default function Nav({ page, onNavigate }: NavProps) {
  const isCoordinator = page.startsWith('dashboard');

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2.5 group"
            aria-label="Go to TutorBridge home"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-700 transition-colors">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M2 11 L8 3 L14 11" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5 11 L11 11" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-display font-bold text-lg text-slate-900 tracking-tight">TutorBridge</span>
          </button>

          <div className="flex items-center gap-1 sm:gap-2">
            {!isCoordinator && (
              <>
                <button
                  onClick={() => onNavigate('student-form')}
                  className="hidden sm:block text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Request Tutoring
                </button>
                <button
                  onClick={() => onNavigate('tutor-form')}
                  className="hidden sm:block text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Volunteer
                </button>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
                >
                  Coordinator
                </button>
              </>
            )}
            {isCoordinator && (
              <button
                onClick={() => onNavigate('landing')}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M8.5 2L3.5 7L8.5 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back to site
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
