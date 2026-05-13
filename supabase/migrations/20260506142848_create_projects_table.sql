/*
  # Create projects table

  1. New Tables
    - `projects`
      - `id` (uuid, pk)
      - `user_id` (uuid, references auth.users)
      - `name` (text) — display name for the project
      - `app_id` (text) — reverse-DNS app identifier e.g. com.acme.myapp
      - `version` (text) — semver string
      - `mode` (text) — offline | online | hybrid
      - `targets` (text[]) — array of: windows, linux, macos
      - `backend` (jsonb) — { type, port }
      - `auth` (jsonb) — { type, defaultAdminEmail }
      - `database` (jsonb) — { type }
      - `source` (text) — project path or repo URL
      - `framework` (text) — detected stack hint
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - RLS enabled
    - Users can only read/write their own projects
*/

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  app_id text NOT NULL DEFAULT '',
  version text NOT NULL DEFAULT '1.0.0',
  mode text NOT NULL DEFAULT 'offline',
  targets text[] NOT NULL DEFAULT '{}',
  backend jsonb NOT NULL DEFAULT '{"type":"auto","port":3000}',
  auth jsonb NOT NULL DEFAULT '{"type":"local","defaultAdminEmail":""}',
  database jsonb NOT NULL DEFAULT '{"type":"sqlite"}',
  source text NOT NULL DEFAULT '',
  framework text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Auto-update updated_at on change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
