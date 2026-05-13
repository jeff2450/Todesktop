import { useState, useEffect } from 'react';
import { ArrowLeft, Edit2, Copy, Check, Terminal, Box, Clock, Monitor, Globe, WifiOff, Wifi } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Project } from '../lib/database.types';
import { generateConfig } from '../lib/config';

interface Props {
  projectId: string;
  onBack: () => void;
  onEdit: (id: string) => void;
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

const ModeIcon = ({ mode }: { mode: string }) => {
  if (mode === 'online') return <Globe className="w-4 h-4" />;
  if (mode === 'hybrid') return <Wifi className="w-4 h-4" />;
  return <WifiOff className="w-4 h-4" />;
};

function SyntaxJson({ value }: { value: string }) {
  const highlighted = value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"([^"]+)":/g, '<span class="text-blue-300">"$1"</span>:')
    .replace(/: "([^"]*)"/g, ': <span class="text-green-300">"$1"</span>')
    .replace(/: (\d+)/g, ': <span class="text-yellow-300">$1</span>')
    .replace(/: (true|false)/g, ': <span class="text-orange-300">$1</span>')
    .replace(/: (null)/g, ': <span class="text-red-300">$1</span>');
  return (
    <pre
      className="text-sm font-mono leading-6 text-gray-300"
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
}

export function ProjectDetail({ projectId, onBack, onEdit }: Props) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('projects').select('*').eq('id', projectId).maybeSingle().then(({ data }) => {
      setProject(data);
      setLoading(false);
    });
  }, [projectId]);

  async function copyText(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400">Project not found.</div>
      </div>
    );
  }

  const configJson = JSON.stringify(generateConfig(project), null, 2);
  const cliCommands = `npx webtoapp doctor\nnpx webtoapp init\nnpx webtoapp convert`;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Nav */}
      <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-100 transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </button>
            <span className="text-gray-700">/</span>
            <div className="flex items-center gap-2 min-w-0">
              <Box className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="text-sm font-medium text-white truncate">{project.name}</span>
            </div>
          </div>
          <button
            onClick={() => onEdit(projectId)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium text-sm transition-colors border border-gray-700 shrink-0"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-white">{project.name}</h1>
              <p className="text-gray-500 font-mono text-sm mt-1">{project.app_id}</p>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${modeColors[project.mode] ?? modeColors.offline}`}>
                <ModeIcon mode={project.mode} />
                {project.mode}
              </span>
              <span className="px-2.5 py-1 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-400 font-mono">
                v{project.version}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Updated {timeAgo(project.updated_at)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Created {timeAgo(project.created_at)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
          {/* Left: config + CLI */}
          <div className="space-y-6">
            {/* Config JSON */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-800">
                <span className="text-xs font-medium text-gray-400 font-mono">webtoapp.config.json</span>
                <button
                  onClick={() => copyText(configJson, 'config')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  {copied === 'config' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied === 'config' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="p-6 overflow-x-auto">
                <SyntaxJson value={configJson} />
              </div>
            </div>

            {/* CLI */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-xs font-medium text-gray-400">CLI commands — run these in your project root</span>
                </div>
                <button
                  onClick={() => copyText(cliCommands, 'cli')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  {copied === 'cli' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied === 'cli' ? 'Copied!' : 'Copy all'}
                </button>
              </div>
              <div className="p-6 space-y-3">
                {[
                  { cmd: 'npx webtoapp doctor', desc: 'Checks your environment (Node, electron-builder, etc.)' },
                  { cmd: 'npx webtoapp init', desc: 'Writes webtoapp.config.json to your project root' },
                  { cmd: 'npx webtoapp convert', desc: 'Runs the full packaging pipeline and writes artifacts to /dist' },
                ].map(({ cmd, desc }) => (
                  <div key={cmd} className="group flex items-start justify-between gap-4">
                    <div>
                      <div className="font-mono text-sm">
                        <span className="text-blue-400">$ </span>
                        <span className="text-gray-200">{cmd}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
                    </div>
                    <button
                      onClick={() => copyText(cmd, cmd)}
                      className="shrink-0 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-gray-800 rounded transition-all"
                    >
                      {copied === cmd ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: metadata cards */}
          <div className="space-y-5">
            {/* Build targets */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-xs font-medium text-gray-400 mb-4">Build targets</h3>
              {(['windows', 'linux', 'macos'] as const).map((t) => {
                const active = project.targets.includes(t);
                return (
                  <div key={t} className="flex items-center gap-3 py-2.5 border-b border-gray-800 last:border-0">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      active ? 'bg-blue-600 border-blue-600' : 'border-gray-700 bg-gray-800'
                    }`}>
                      {active && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <Monitor className={`w-4 h-4 ${active ? 'text-blue-400' : 'text-gray-600'}`} />
                    <div>
                      <div className={`text-sm font-medium ${active ? 'text-white' : 'text-gray-600'}`}>
                        {t === 'windows' ? 'Windows' : t === 'linux' ? 'Linux' : 'macOS'}
                      </div>
                      <div className="text-xs text-gray-600">
                        {t === 'windows' ? '.exe installer' : t === 'linux' ? '.AppImage / .deb' : '.dmg disk image'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Details */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-medium text-gray-400">Configuration details</h3>
              {[
                { label: 'Backend', value: `${project.backend.type} (port ${project.backend.port})` },
                { label: 'Auth', value: project.auth.type },
                { label: 'Database', value: project.database.type },
                ...(project.source ? [{ label: 'Source', value: project.source }] : []),
                ...(project.framework ? [{ label: 'Framework', value: project.framework }] : []),
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between gap-4">
                  <span className="text-xs text-gray-500 shrink-0">{label}</span>
                  <span className="text-xs text-gray-300 text-right font-mono truncate">{value}</span>
                </div>
              ))}
            </div>

            {project.notes && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h3 className="text-xs font-medium text-gray-400 mb-2">Notes</h3>
                <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">{project.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
