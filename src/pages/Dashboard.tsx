import { useState, useEffect } from 'react';
import { Plus, Search, Box, LogOut, Trash2, ExternalLink, Clock, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Project } from '../lib/database.types';

interface Props {
  onNewProject: () => void;
  onOpenProject: (id: string) => void;
  onLanding: () => void;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const modeColors: Record<string, string> = {
  offline: 'bg-green-900/40 text-green-300 border-green-800/40',
  online: 'bg-blue-900/40 text-blue-300 border-blue-800/40',
  hybrid: 'bg-yellow-900/40 text-yellow-300 border-yellow-800/40',
};

export function Dashboard({ onNewProject, onOpenProject, onLanding }: Props) {
  const { user, profile, signOut } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    setLoading(true);
    const { data } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false });
    setProjects(data ?? []);
    setLoading(false);
  }

  async function deleteProject(id: string) {
    setDeletingId(id);
    await supabase.from('projects').delete().eq('id', id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setDeletingId(null);
  }

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.app_id.toLowerCase().includes(search.toLowerCase())
  );

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'there';

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Nav */}
      <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <button
            onClick={onLanding}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-100 transition-colors"
          >
            <Box className="w-5 h-5 text-blue-400" />
            <span className="font-semibold tracking-tight text-white">WebToApp</span>
          </button>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400 hidden sm:block">{user?.email}</span>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Good to see you, {displayName}</h1>
            <p className="text-sm text-gray-400 mt-1">
              {projects.length === 0 ? 'No projects yet' : `${projects.length} project${projects.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <button
            onClick={onNewProject}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-sm transition-all hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            New project
          </button>
        </div>

        {/* Search */}
        {projects.length > 0 && (
          <div className="relative mb-6 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full bg-gray-900 border border-gray-800 text-gray-100 rounded-lg pl-9 pr-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition-colors"
            />
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 && search ? (
          <div className="text-center py-16 text-gray-500">
            No projects matching "{search}"
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-900 border border-gray-800 mb-5">
              <Box className="w-7 h-7 text-gray-600" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">No projects yet</h2>
            <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
              Create your first project to generate a webtoapp.config.json and CLI commands.
            </p>
            <button
              onClick={onNewProject}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((project) => (
              <div
                key={project.id}
                className="group bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-all cursor-pointer relative"
                onClick={() => onOpenProject(project.id)}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-semibold text-white truncate group-hover:text-blue-300 transition-colors">
                    {project.name || 'Untitled'}
                  </h3>
                  <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-mono border ${modeColors[project.mode] ?? modeColors.offline}`}>
                    {project.mode}
                  </span>
                </div>

                <p className="text-xs text-gray-500 font-mono mb-3 truncate">{project.app_id || '—'}</p>

                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  {(project.targets ?? []).map((t) => (
                    <span key={t} className="px-1.5 py-0.5 bg-gray-800 text-gray-400 text-xs rounded border border-gray-700">
                      {t}
                    </span>
                  ))}
                  {(project.targets ?? []).length === 0 && (
                    <span className="text-xs text-gray-600">No targets</span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {timeAgo(project.updated_at)}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}
                      disabled={deletingId === project.id}
                      className="p-1.5 hover:bg-red-900/30 hover:text-red-400 rounded transition-colors"
                    >
                      {deletingId === project.id ? (
                        <span className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin block" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onOpenProject(project.id); }}
                      className="p-1.5 hover:bg-gray-700 rounded transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
