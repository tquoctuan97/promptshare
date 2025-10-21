import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Adding display_name column to profiles table...');

const alterTableSQL = `
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name text;
`;

try {
  const { error: alterError } = await supabase.rpc('exec_sql', { sql: alterTableSQL });
  if (alterError) {
    console.log('Note: Using direct query approach...');

    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: alterTableSQL })
    });

    console.log('Response:', await response.text());
  } else {
    console.log('Successfully added display_name column!');
  }
} catch (err) {
  console.error('Error:', err.message);
}

console.log('\nUpdating trigger function...');

const triggerSQL = `
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
`;

try {
  const { error: triggerError } = await supabase.rpc('exec_sql', { sql: triggerSQL });
  if (!triggerError) {
    console.log('Successfully updated trigger function!');
  }
} catch (err) {
  console.error('Error:', err.message);
}

console.log('\nMigration instructions:');
console.log('Please run the following SQL in your Supabase SQL Editor:');
console.log('\n' + '='.repeat(80));
console.log(alterTableSQL);
console.log(triggerSQL);
console.log('='.repeat(80));
