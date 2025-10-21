/*
  # PromptShare Database Schema

  ## Overview
  This migration creates the complete database schema for PromptShare, a community-driven platform
  for sharing and discovering AI prompt templates.

  ## 1. New Tables

  ### `profiles`
  - `id` (uuid, primary key) - Links to auth.users
  - `username` (text, unique) - User's display name
  - `avatar_url` (text) - URL to user's avatar image

  ### `prompts`
  - `id` (uuid, primary key) - Unique prompt identifier
  - `created_at` (timestamptz) - Creation timestamp
  - `user_id` (uuid, foreign key) - Author of the prompt
  - `title` (text, not null) - Prompt title
  - `description` (text) - Brief description
  - `prompt_text` (text, not null) - The actual prompt content
  - `model` (text) - Target AI model (e.g., "GPT-4", "DALL-E 3")
  - `preview_output_url` (text, nullable) - URL to preview image/output
  - `category` (text) - Category: 'Code', 'Writing', or 'Communication'

  ### `likes`
  - `id` (uuid, primary key) - Unique like identifier
  - `prompt_id` (uuid, foreign key) - Referenced prompt
  - `user_id` (uuid, foreign key) - User who liked
  - `created_at` (timestamptz) - When the like was created
  - Unique constraint on (prompt_id, user_id) to prevent duplicate likes

  ### `comments`
  - `id` (uuid, primary key) - Unique comment identifier
  - `prompt_id` (uuid, foreign key) - Referenced prompt
  - `user_id` (uuid, foreign key) - Comment author
  - `comment_text` (text, not null) - Comment content
  - `created_at` (timestamptz) - When the comment was created

  ## 2. Security

  - Enable RLS on all tables
  - Public read access to prompts, profiles, likes, and comments
  - Authenticated users can manage their own content
  - Automatic profile creation on user sign-up via trigger

  ## 3. Storage

  - Create public bucket 'prompt-previews' for storing preview images
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- Create prompts table
CREATE TABLE IF NOT EXISTS prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  prompt_text text NOT NULL,
  model text,
  preview_output_url text,
  category text CHECK (category IN ('Code', 'Writing', 'Communication'))
);

-- Create likes table
CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id uuid REFERENCES prompts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(prompt_id, user_id)
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id uuid REFERENCES prompts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  comment_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompts(category);
CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON prompts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_prompt_id ON likes(prompt_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_prompt_id ON comments(prompt_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Prompts policies
CREATE POLICY "Anyone can view prompts"
  ON prompts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create prompts"
  ON prompts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prompts"
  ON prompts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own prompts"
  ON prompts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Anyone can view likes"
  ON likes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create likes"
  ON likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Anyone can view comments"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to automatically create profile on user sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for prompt previews
INSERT INTO storage.buckets (id, name, public)
VALUES ('prompt-previews', 'prompt-previews', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for prompt-previews bucket
CREATE POLICY "Public can view preview images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'prompt-previews');

CREATE POLICY "Authenticated users can upload preview images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'prompt-previews');

CREATE POLICY "Users can update own preview images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'prompt-previews' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'prompt-previews' AND owner = auth.uid());

CREATE POLICY "Users can delete own preview images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'prompt-previews' AND owner = auth.uid());
