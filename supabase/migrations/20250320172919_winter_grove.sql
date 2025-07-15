/*
  # Course and Enrollment System

  1. New Tables
    - `courses`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `image_url` (text)
      - `modules` (jsonb)
      - `glossary` (jsonb)
      - `roadmap` (jsonb)
      - `resources` (jsonb)
      - `created_at` (timestamp)
      - `created_by` (uuid, references auth.users)

    - `enrollments`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `course_id` (uuid, references courses)
      - `progress` (integer)
      - `completed_modules` (jsonb)
      - `enrolled_at` (timestamp)
      - `last_accessed` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for course creation and viewing
    - Add policies for enrollment management
*/

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image_url text,
  modules jsonb,
  glossary jsonb,
  roadmap jsonb,
  resources jsonb,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  course_id uuid REFERENCES courses(id),
  progress integer DEFAULT 0,
  completed_modules jsonb DEFAULT '[]'::jsonb,
  enrolled_at timestamptz DEFAULT now(),
  last_accessed timestamptz DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Courses policies
CREATE POLICY "Users can view all courses"
  ON courses
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create courses"
  ON courses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Enrollments policies
CREATE POLICY "Users can view their enrollments"
  ON enrollments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can enroll in courses"
  ON enrollments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their enrollment progress"
  ON enrollments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);