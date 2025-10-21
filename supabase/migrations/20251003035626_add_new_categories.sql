/*
  # Add New Categories to Prompts Table

  ## Overview
  This migration expands the category options for prompts from 3 to 13 categories,
  providing more granular classification for different types of AI prompts.

  ## Changes Made
  
  ### Modified Tables
  - `prompts` table
    - Updated `category` column constraint to include 10 new categories
    - Previous categories: Code, Writing, Communication
    - New categories added:
      1. Docs - Documentation and technical writing
      2. Project - Project management and planning
      3. Learning - Educational and learning prompts
      4. AI & Tools - AI tools and automation
      5. Design - Creative design and visual prompts
      6. Career - Professional development and career
      7. Fun - Entertainment and creative fun
      8. Misc - Miscellaneous prompts
      9. Image - Image generation prompts
      10. Browser - Web browsing and research

  ## Notes
  - Existing data is preserved
  - The constraint is dropped and recreated to allow new values
  - All existing prompts with old categories remain valid
*/

-- Drop the existing category constraint
ALTER TABLE prompts DROP CONSTRAINT IF EXISTS prompts_category_check;

-- Add new constraint with all 13 categories
ALTER TABLE prompts ADD CONSTRAINT prompts_category_check 
  CHECK (category IN (
    'Code',
    'Writing', 
    'Communication',
    'Docs',
    'Project',
    'Learning',
    'AI & Tools',
    'Design',
    'Career',
    'Fun',
    'Misc',
    'Image',
    'Browser'
  ));