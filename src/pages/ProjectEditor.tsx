import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Save, Copy, Check, AlertCircle, Box,
  Monitor, Globe, Wifi, WifiOff, Terminal
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Project } from '../lib/database.types';
import { generateConfig, suggestAppId, validateSemver, validateAppId } from '../lib/config';

interface Props {
  projectId: string | null; // null = new
  onBack: () => void;
  onSaved: (id: string) => void;
}

const TARGETS = ['windows', 'linux', 'macos'] as const;
const MODES = [
  { value: 'offline', label: 'Offline', desc: 'Bundles your static build — no internet required', icon: WifiOff, color: 'green' },
  { value: 'online', label: 'Online', desc: 'Loads a remote URL inside the Electron window', icon: Globe, color: 'blue' },
  { value: 'hybrid', label: 'Hybrid', desc: 'Bundles core UI, fetches live data from the network', icon: Wifi, color: 'yellow' },
] as const;

const BACKEND_TYPES = ['auto', 'supabase', 'firebase', 'express', 'none'] as const;
const AUTH_TYPES = ['local', 'clerk', 'auth0', 'supabase'] as const;
const DB_TYPES = ['sqlite', 'postgres', 'none'] as const;
const FRAMEWORKS = ['', 'react-vite', 'nextjs', 'vue', 'svelte', 'other'] as const;

type FormState = {
  name: string;
  app_id: string;
  version: string;
  source: string;
  mode: 'offline' | 'online' | 'hybrid';
  targets: string[];
  backend_type: string;
  backend_port: string;
  auth_type: string;
  auth_email: string;
  db_type: string;
  framework: string;
  notes: string;
};

const defaults: FormState = {
  name: '',
  app_id: '',
  version: '1.0.0',
  source: '',
  mode: 'offline',
  targets: [],
  backend_type: 'auto',
  backend_port: '3000',
  auth_type: 'local',
  auth_email: '',
  db_type: 'sqlite',
  framework: '',
  notes: '',
};

function projectToForm(p: Project): FormState {
  return {
    name: p.name,
    app_id: p.app_id,
    version: p.version,
    source: p.source,
    mode: p.mode,
    targets: p.targets,
    backend_type: p.backend?.type ?? 'auto',
    backend_port: String(p.backend?.port ?? 3000),
    auth_type: p.auth?.type ?? 'local',
    auth_email: p.auth?.defaultAdminEmail ?? '',
    db_type: p.database?.type ?? 'sqlite',
    framework: p.framework ?? '',
    notes: p.notes ?? '',
  };
}

function formToProject(f: FormState): Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at'> {
  return {
    name: f.name,
    app_id: f.app_id,
    version: f.version,
    source: f.source,
    mode: f.mode,
    targets: f.targets,
    backend: { type: f.backend_type, port: parseInt(f.backend_port) || 3000 },
    auth: { type: f.auth_type, defaultAdminEmail: f.auth_email },
    database: { type: f.db_type },
    framework: f.framework,
    notes: f.notes,
  };
}

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
      className="text-xs font-mono leading-5 text-gray-300"
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
}

export function ProjectEditor({ projectId, onBack, onSaved }: Props) {
  const { user } = useAuth();
  const [form, setForm] = useState<FormState>(defaults);
  const [loading, setLoading] = useState(!!projectId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});

  useEffect(() => {
    if (!projectId) return;
    supabase.from('projects').select('*').eq('id', projectId).maybeSingle().then(({ data }) => {
      if (data) setForm(projectToForm(data));
      setLoading(false);
    });
  }, [projectId]);

  const set = useCallback(<K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: val };
      if (key === 'name' && !touched.app_id) {
        next.app_id = suggestAppId(val as string);
      }
      return next;
    });
    setTouched((prev) => ({ ...prev, [key]: true }));
  }, [touched.app_id]);

  function toggleTarget(t: string) {
    setForm((prev) => ({
      ...prev,
      targets: prev.targets.includes(t)
        ? prev.targets.filter((x) => x !== t)
        : [...prev.targets, t],
    }));
  }

  const configObj = generateConfig({
    ...formToProject(form),
    id: projectId ?? undefined,
  });
  const configJson = JSON.stringify(configObj, null, 2);

  const semverOk = validateSemver(form.version);
  const appIdOk = !form.app_id || validateAppId(form.app_id);
  const nameOk = form.name.trim().length > 0;
  const targetsOk = form.targets.length > 0;
  const canSave = nameOk && semverOk && appIdOk && targetsOk;

  async function save() {
    if (!canSave || !user) return;
    setSaving(true);
    setError('');
    try {
      const payload = { ...formToProject(form), user_id: user.id };
      if (projectId) {
        const { error } = await supabase.from('projects').update(payload).eq('id', projectId);
        if (error) throw error;
        onSaved(projectId);
      } else {
        const { data, error } = await supabase.from('projects').insert(payload).select().maybeSingle();
        if (error) throw error;
        if (data) onSaved(data.id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function copyText(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  const cliCommands = `npx webtoapp doctor\nnpx webtoapp init\nnpx webtoapp convert`;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Nav */}
      <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </button>
            <span className="text-gray-700">/</span>
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-white truncate max-w-48">
                {form.name || 'New project'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {error && (
              <span className="hidden sm:flex items-center gap-1.5 text-sm text-red-400">
                <AlertCircle className="w-4 h-4" />
                {error}
              </span>
            )}
            <button
              onClick={save}
              disabled={!canSave || saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-colors"
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save project
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-8">
        {/* Form */}
        <div className="space-y-8">
          {/* Basics */}
          <Section title="Basics" subtitle="Core app metadata">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="App name" required error={touched.name && !nameOk ? 'Name is required' : ''}>
                <input
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="My Desktop App"
                  className={input()}
                />
              </Field>
              <Field
                label="Version"
                required
                error={touched.version && !semverOk ? 'Must be semver (e.g. 1.0.0)' : ''}
              >
                <input
                  value={form.version}
                  onChange={(e) => set('version', e.target.value)}
                  placeholder="1.0.0"
                  className={input()}
                />
              </Field>
            </div>
            <Field
              label="App ID"
              hint="Reverse-DNS format, e.g. com.company.appname"
              error={touched.app_id && form.app_id && !appIdOk ? 'Must be reverse-DNS format (com.company.app)' : ''}
            >
              <input
                value={form.app_id}
                onChange={(e) => { set('app_id', e.target.value); setTouched((p) => ({ ...p, app_id: true })); }}
                placeholder="com.mycompany.myapp"
                className={input('font-mono')}
              />
            </Field>
          </Section>

          {/* Source */}
          <Section title="Source" subtitle="Where your web project lives">
            <Field label="Project path or repo URL">
              <input
                value={form.source}
                onChange={(e) => set('source', e.target.value)}
                placeholder="/Users/me/my-app  or  https://github.com/org/repo"
                className={input()}
              />
            </Field>
            <Field label="Framework">
              <select value={form.framework} onChange={(e) => set('framework', e.target.value)} className={input()}>
                {FRAMEWORKS.map((f) => (
                  <option key={f} value={f}>{f || '— auto-detect —'}</option>
                ))}
              </select>
            </Field>
          </Section>

          {/* Mode */}
          <Section title="Mode" subtitle="How the packaged app loads your UI">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {MODES.map(({ value, label, desc, icon: Icon, color }) => {
                const active = form.mode === value;
                const border = active
                  ? color === 'green' ? 'border-green-500 bg-green-900/20' :
                    color === 'blue' ? 'border-blue-500 bg-blue-900/20' :
                    'border-yellow-500 bg-yellow-900/20'
                  : 'border-gray-700 hover:border-gray-600';
                const iconColor = active
                  ? color === 'green' ? 'text-green-400' : color === 'blue' ? 'text-blue-400' : 'text-yellow-400'
                  : 'text-gray-500';
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => set('mode', value)}
                    className={`text-left p-4 rounded-xl border transition-all ${border}`}
                  >
                    <Icon className={`w-5 h-5 mb-2 ${iconColor}`} />
                    <div className="font-medium text-sm text-white">{label}</div>
                    <div className="text-xs text-gray-400 mt-1 leading-relaxed">{desc}</div>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Targets */}
          <Section
            title="Build targets"
            subtitle="Select platforms to package for"
            error={touched.targets !== undefined && !targetsOk ? 'Select at least one target' : ''}
          >
            <div className="flex flex-wrap gap-3">
              {TARGETS.map((t) => {
                const active = form.targets.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { toggleTarget(t); setTouched((p) => ({ ...p, targets: true })); }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      active ? 'bg-blue-900/30 border-blue-500 text-blue-200' : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    <Monitor className="w-4 h-4" />
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Backend */}
          <Section title="Backend" subtitle="Server integration for the app shell">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Backend type">
                <select value={form.backend_type} onChange={(e) => set('backend_type', e.target.value)} className={input()}>
                  {BACKEND_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Port">
                <input
                  type="number"
                  value={form.backend_port}
                  onChange={(e) => set('backend_port', e.target.value)}
                  placeholder="3000"
                  className={input()}
                />
              </Field>
            </div>
          </Section>

          {/* Auth */}
          <Section title="Authentication" subtitle="Auth provider for the packaged app">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Auth type">
                <select value={form.auth_type} onChange={(e) => set('auth_type', e.target.value)} className={input()}>
                  {AUTH_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Default admin email">
                <input
                  type="email"
                  value={form.auth_email}
                  onChange={(e) => set('auth_email', e.target.value)}
                  placeholder="admin@example.com"
                  className={input()}
                />
              </Field>
            </div>
          </Section>

          {/* Database */}
          <Section title="Database" subtitle="Embedded database type">
            <Field label="Database type">
              <select value={form.db_type} onChange={(e) => set('db_type', e.target.value)} className={input()}>
                {DB_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          </Section>

          {/* Notes */}
          <Section title="Notes" subtitle="Extra context for the conversion (optional)">
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={3}
              placeholder="Anything the converter should know..."
              className={`${input()} resize-none`}
            />
          </Section>
        </div>

        {/* Preview panel */}
        <div className="xl:sticky xl:top-[72px] h-fit space-y-4">
          {/* Validation summary */}
          {!canSave && Object.keys(touched).length > 0 && (
            <div className="flex items-start gap-2 p-3 bg-yellow-900/20 border border-yellow-800/40 rounded-lg text-sm text-yellow-300">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                {!nameOk && <div>App name is required</div>}
                {!semverOk && <div>Version must be semver (1.0.0)</div>}
                {form.app_id && !appIdOk && <div>App ID must be reverse-DNS</div>}
                {!targetsOk && <div>Select at least one target</div>}
              </div>
            </div>
          )}

          {/* Config JSON */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <span className="text-xs font-medium text-gray-400 font-mono">webtoapp.config.json</span>
              <button
                onClick={() => copyText(configJson, 'config')}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
              >
                {copied === 'config' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === 'config' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="p-4 overflow-x-auto max-h-80">
              <SyntaxJson value={configJson} />
            </div>
          </div>

          {/* CLI commands */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-xs font-medium text-gray-400">CLI commands</span>
              </div>
              <button
                onClick={() => copyText(cliCommands, 'cli')}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
              >
                {copied === 'cli' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === 'cli' ? 'Copied!' : 'Copy all'}
              </button>
            </div>
            <div className="p-4 font-mono text-xs space-y-1.5">
              {['npx webtoapp doctor', 'npx webtoapp init', 'npx webtoapp convert'].map((cmd) => (
                <div key={cmd} className="flex items-center justify-between gap-2 group">
                  <div>
                    <span className="text-blue-400">$ </span>
                    <span className="text-gray-300">{cmd}</span>
                  </div>
                  <button
                    onClick={() => copyText(cmd, cmd)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-800 rounded transition-all"
                  >
                    {copied === cmd ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-gray-500" />}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Target checklist */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs font-medium text-gray-400 mb-3">Build target checklist</p>
            {(['windows', 'linux', 'macos'] as const).map((t) => {
              const active = form.targets.includes(t);
              return (
                <div key={t} className="flex items-center gap-2.5 py-1.5">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    active ? 'bg-blue-600 border-blue-600' : 'border-gray-600 bg-gray-800'
                  }`}>
                    {active && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <span className={`text-sm ${active ? 'text-white' : 'text-gray-500'}`}>
                    {t === 'windows' ? 'Windows (.exe)' : t === 'linux' ? 'Linux (.AppImage)' : 'macOS (.dmg)'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, subtitle, children, error }: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, hint, required, error, children }: {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        {hint && <span className="ml-1.5 text-gray-600 font-normal">{hint}</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

function input(extra = '') {
  return `w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition-colors ${extra}`.trim();
}
