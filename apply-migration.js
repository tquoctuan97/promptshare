import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const migrationSQL = readFileSync('./supabase/migrations/20251003070000_add_display_name_to_profiles.sql', 'utf8');

const sqlStatements = migrationSQL
  .split(/;\s*$/)
  .map(stmt => stmt.trim())
  .filter(stmt => stmt && !stmt.startsWith('/*'));

console.log('Applying migration...');

for (const sql of sqlStatements) {
  if (!sql) continue;

  try {
    const { error } = await supabase.rpc('exec_sql', { query: sql });
    if (error) {
      console.error('Error executing SQL:', error);
    } else {
      console.log('Successfully executed statement');
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

console.log('Migration complete!');
