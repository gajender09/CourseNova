/*
  # Create courses table

  1. New Tables
    - `courses`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `description` (text)
      - `image_url` (text)
      - `difficulty_level` (text)
      - `estimated_duration` (text)
      - `modules` (jsonb, course modules)
      - `glossary` (jsonb, terms and definitions)
      - `roadmap` (jsonb, learning path)
      - `resources` (jsonb, articles and videos)
      - `created_by` (uuid, foreign key to users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `courses` table
    - Add policies for course creation and viewing
*/

CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image_url text,
  difficulty_level text DEFAULT 'Beginner',
  estimated_duration text DEFAULT '4-6 weeks',
  modules jsonb DEFAULT '[]'::jsonb,
  glossary jsonb DEFAULT '[]'::jsonb,
  roadmap jsonb DEFAULT '[]'::jsonb,
  resources jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view courses"
  ON courses
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create courses"
  ON courses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own courses"
  ON courses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);