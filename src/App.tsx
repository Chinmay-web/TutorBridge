import { useState } from 'react';
import Nav from './components/Nav';
import Landing from './pages/Landing';
import StudentForm from './pages/StudentForm';
import TutorForm from './pages/TutorForm';
import Dashboard from './pages/Dashboard';

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
      {page === 'dashboard' && <Dashboard />}
    </div>
  );
}
