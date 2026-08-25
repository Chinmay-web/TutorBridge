import { useState, useEffect } from 'react';
import Nav from './components/Nav';
import Landing from './pages/Landing';
import StudentForm from './pages/StudentForm';
import TutorForm from './pages/TutorForm';
import Dashboard from './pages/Dashboard';
import CoordinatorLogin from './pages/CoordinatorLogin';
import { supabase } from './lib/supabase';

type Page = 'landing' | 'student-form' | 'tutor-form' | 'dashboard';

export default function App() {
  const [page, setPage] = useState<Page>('landing');

  const navigate = (p: string) => {
    setPage(p as Page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      <Nav page={page} onNavigate={navigate} />
      {page === 'landing' && <Landing onNavigate={navigate} />}
      {page === 'student-form' && <StudentForm onNavigate={navigate} />}
      {page === 'tutor-form' && <TutorForm onNavigate={navigate} />}
      {page === 'dashboard' && (
        <CoordinatorGate onNavigate={navigate} />
      )}
    </div>
  );
}

function CoordinatorGate({ onNavigate }: { onNavigate: (p: string) => void }) {
  const [checking, setChecking] = useState(true);
  const [isCoordinator, setIsCoordinator] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      setChecking(true);
      setIsCoordinator(false);
      setSignedIn(false);

      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr || !user) {
        if (!mounted) return;
        setChecking(false);
        setSignedIn(false);
        return;
      }

      if (!mounted) return;
      setSignedIn(true);

      const { data: coordData, error: coordErr } = await supabase
        .from('coordinators')
        .select('is_active')
        .eq('user_id', user.id)
        .maybeSingle();

      if (coordErr) {
        console.error('Coordinator lookup error:', coordErr);
        setChecking(false);
        return;
      }

      if (coordData && coordData.is_active) {
        setIsCoordinator(true);
      } else {
        setIsCoordinator(false);
      }

      setChecking(false);
    };

    check();

    return () => {
      mounted = false;
    };
  }, [reload]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-slate-600">Checking coordinator access…</div>
      </div>
    );
  }

  if (!signedIn) {
    return (
      <CoordinatorLogin
        onAuthChange={() => {
          // re-check auth
          setReload(r => r + 1);
        }}
      />
    );
  }

  if (!isCoordinator) {
    return (
      <div className="min-h-screen bg-slate-25 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 max-w-md w-full text-center">
          <h2 className="font-display font-bold text-2xl text-slate-900 mb-2">Access denied</h2>
          <p className="text-sm text-slate-500 mb-6">Your account is not an active coordinator. If you believe this is a mistake, sign out and contact the site administrator.</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                onNavigate('landing');
              }}
              className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg"
            >
              Sign out
            </button>
            <button
              onClick={() => onNavigate('landing')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Back to site
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <Dashboard onSignedOut={() => setReload(r => r + 1)} />;
}
