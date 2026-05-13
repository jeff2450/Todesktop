import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TaskProvider } from './context/TaskContext';
import { Landing } from './pages/Landing';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { ProjectEditor } from './pages/ProjectEditor';
import { ProjectDetail } from './pages/ProjectDetail';
import { Tasks } from './pages/Tasks';

type Route =
  | { page: 'landing' }
  | { page: 'auth' }
  | { page: 'dashboard' }
  | { page: 'tasks' }
  | { page: 'new-project' }
  | { page: 'edit-project'; id: string }
  | { page: 'view-project'; id: string };

function App() {
  return (
    <AuthProvider>
      <TaskProvider>
        <Router />
      </TaskProvider>
    </AuthProvider>
  );
}

function Router() {
  const { session, loading } = useAuth();
  const [route, setRoute] = useState<Route>({ page: 'landing' });

  useEffect(() => {
    if (loading) return;
    if (session && (route.page === 'landing' || route.page === 'auth')) {
      setRoute({ page: 'dashboard' });
    }
    if (!session && ['dashboard', 'tasks', 'new-project', 'edit-project', 'view-project'].includes(route.page)) {
      setRoute({ page: 'auth' });
    }
  }, [session, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (route.page === 'landing') {
    return (
      <Landing
        onGetStarted={() => setRoute(session ? { page: 'dashboard' } : { page: 'auth' })}
        onTasks={session ? () => setRoute({ page: 'tasks' }) : undefined}
      />
    );
  }

  if (route.page === 'auth') {
    return <Auth onBack={() => setRoute({ page: 'landing' })} />;
  }

  if (!session) {
    return <Auth onBack={() => setRoute({ page: 'landing' })} />;
  }

  if (route.page === 'dashboard') {
    return (
      <Dashboard
        onNewProject={() => setRoute({ page: 'new-project' })}
        onOpenProject={(id) => setRoute({ page: 'view-project', id })}
        onLanding={() => setRoute({ page: 'landing' })}
      />
    );
  }

  if (route.page === 'tasks') {
    return <Tasks onLanding={() => setRoute({ page: 'landing' })} />;
  }

  if (route.page === 'new-project') {
    return (
      <ProjectEditor
        projectId={null}
        onBack={() => setRoute({ page: 'dashboard' })}
        onSaved={(id) => setRoute({ page: 'view-project', id })}
      />
    );
  }

  if (route.page === 'edit-project') {
    return (
      <ProjectEditor
        projectId={route.id}
        onBack={() => setRoute({ page: 'view-project', id: route.id })}
        onSaved={(id) => setRoute({ page: 'view-project', id })}
      />
    );
  }

  if (route.page === 'view-project') {
    return (
      <ProjectDetail
        projectId={route.id}
        onBack={() => setRoute({ page: 'dashboard' })}
        onEdit={(id) => setRoute({ page: 'edit-project', id })}
      />
    );
  }

  return null;
}

export default App;
