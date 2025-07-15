/*
  # Add difficulty_level and estimated_duration columns to courses table

  1. Changes
    - Add `difficulty_level` column to courses table (text type)
    - Add `estimated_duration` column to courses table (text type)
    - Set default values for existing records

  2. Security
    - No changes to RLS policies needed
*/

DO $$
BEGIN
  -- Add difficulty_level column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'difficulty_level'
  ) THEN
    ALTER TABLE courses ADD COLUMN difficulty_level text DEFAULT 'Beginner';
  END IF;

  -- Add estimated_duration column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'estimated_duration'
  ) THEN
    ALTER TABLE courses ADD COLUMN estimated_duration text DEFAULT '4 weeks';
  END IF;
END $$;