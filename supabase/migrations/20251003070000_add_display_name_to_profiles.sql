/*
  # Add display_name to profiles table

  ## Changes
  1. Add `display_name` column to profiles table
     - `display_name` (text) - User's full display name from SSO providers

  2. Update the handle_new_user trigger function
     - Extract display_name from raw_user_meta_data (for Microsoft SSO: 'name' field)
     - Extract username from raw_user_meta_data or email
     - Ensure backward compatibility with existing auth methods

  ## Notes
  - Microsoft SSO provides 'name' in raw_user_meta_data which contains the user's display name
  - If no display_name is available, username will be used as fallback
*/

-- Add display_name column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'display_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN display_name text;
  END IF;
END $$;

-- Update the trigger function to handle display_name from SSO
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    new.id,
    COALESCE(
      new.raw_user_meta_data->>'username',
      new.raw_user_meta_data->>'preferred_username',
      split_part(new.email, '@', 1)
    ),
    COALESCE(
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'username'
    ),
    COALESCE(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    )
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
