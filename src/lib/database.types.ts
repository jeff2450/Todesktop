export type AppRole = 'admin' | 'user';

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  app_id: string;
  version: string;
  mode: 'offline' | 'online' | 'hybrid';
  targets: string[];
  backend: { type: string; port: number };
  auth: { type: string; defaultAdminEmail: string };
  database: { type: string };
  source: string;
  framework: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
      };
      projects: {
        Row: Project;
        Insert: Omit<Project, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<Project, 'id' | 'user_id' | 'created_at'>>;
      };
      user_roles: {
        Row: { id: string; user_id: string; role: AppRole; created_at: string };
        Insert: { user_id: string; role: AppRole };
        Update: never;
      };
    };
  };
}
