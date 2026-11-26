import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { TasksPage } from './pages/TasksPage';
import { TeamsPage } from './pages/TeamsPage';
import { DirectoryPage } from './pages/DirectoryPage';
import { TeamLeaderBoardPage } from './pages/TeamLeaderBoardPage';
import { useAuth } from './context/AuthContext';

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-obsidian text-cream/60 font-mono text-sm">
      Connecting to HMorix Workspace...
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="min-h-screen bg-obsidian flex">
      <Sidebar />
      <main className="flex-1 lg:ml-56 min-h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

function TLRoute({ children }: { children: React.ReactNode }) {
  const { isLeader } = useAuth();
  if (!isLeader) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/dashboard" element={<ProtectedLayout><DashboardPage /></ProtectedLayout>} />
      <Route path="/tasks" element={<ProtectedLayout><TasksPage /></ProtectedLayout>} />
      <Route path="/teams" element={<ProtectedLayout><TeamsPage /></ProtectedLayout>} />
      <Route path="/directory" element={<ProtectedLayout><DirectoryPage /></ProtectedLayout>} />
      <Route path="/leader" element={<ProtectedLayout><TLRoute><TeamLeaderBoardPage /></TLRoute></ProtectedLayout>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
