import type { Project } from './database.types';

export function generateConfig(p: Partial<Project>): Record<string, unknown> {
  return {
    name: p.name || '',
    appId: p.app_id || '',
    version: p.version || '1.0.0',
    source: p.source || '',
    mode: p.mode || 'offline',
    targets: p.targets || [],
    backend: p.backend || { type: 'auto', port: 3000 },
    auth: p.auth || { type: 'local', defaultAdminEmail: '' },
    database: p.database || { type: 'sqlite' },
    ...(p.framework ? { framework: p.framework } : {}),
    ...(p.notes ? { notes: p.notes } : {}),
  };
}

export function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function suggestAppId(name: string) {
  const slug = toSlug(name);
  return slug ? `com.mycompany.${slug}` : '';
}

export function validateSemver(v: string) {
  return /^\d+\.\d+\.\d+$/.test(v);
}

export function validateAppId(id: string) {
  return /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*){2,}$/.test(id);
}
