# Functional Requirements Document (FRD)

## PromptShare - AI Prompt Community Platform

**Version:** 1.0
**Last Updated:** October 21, 2025
**Document Type:** Functional Requirements Document
**Status:** Active

---

## 1. Introduction

### 1.1 Purpose
This Functional Requirements Document (FRD) defines the detailed functional specifications for PromptShare, a community-driven platform for sharing and discovering AI prompt templates. This document serves as a guide for developers, testers, and stakeholders to understand the exact behavior and functionality of each feature.

### 1.2 Scope
This document covers all functional requirements for the PromptShare MVP (Minimum Viable Product), including:
- User authentication and authorization
- Prompt management (create, read, update, delete)
- Social interactions (likes, comments)
- Navigation and user interface behaviors
- Data validation and error handling

### 1.3 Definitions and Acronyms
- **MVP:** Minimum Viable Product
- **RLS:** Row-Level Security
- **SSO:** Single Sign-On
- **CRUD:** Create, Read, Update, Delete
- **UI:** User Interface
- **UX:** User Experience

### 1.4 References
- Product Requirements Document (PRD) v1.0
- Database Schema Documentation
- Supabase API Documentation

---

## 2. System Overview

### 2.1 System Architecture
PromptShare is a single-page application (SPA) built with React and TypeScript, utilizing Supabase as the backend-as-a-service platform. The system follows a client-server architecture where:
- Frontend handles UI rendering and user interactions
- Supabase manages authentication, database operations, and file storage
- React Query manages data fetching and caching

### 2.2 User Roles
1. **Anonymous User:** Can browse and view prompts
2. **Authenticated User:** Can create, like, comment, and manage own content
3. **Prompt Owner:** Has additional permissions to edit/delete owned prompts
4. **Comment Owner:** Can edit/delete own comments

---

## 3. Functional Requirements

## FR-1: User Authentication

### FR-1.1: User Registration with Email/Password

**Description:** Users can create a new account using email and password.

**Functional Flow:**
1. User navigates to authentication page (/auth)
2. User clicks "Sign Up" tab
3. User enters email, password, and username
4. System validates input fields
5. System creates user account in auth.users table
6. System automatically creates profile in profiles table via trigger
7. System logs user in and redirects to home page

**Input Requirements:**
- Email: Valid email format, not already registered
- Password: Minimum 6 characters
- Username: 3-30 characters, alphanumeric and underscores only, unique

**Output/Results:**
- User account created in database
- Profile record created with username
- User session established
- JWT token stored in browser
- Redirect to home page (/)

**Validation Rules:**
- Email must match pattern: `^[^\s@]+@[^\s@]+\.[^\s@]+$`
- Password minimum length: 6 characters
- Username must be unique (case-insensitive)
- Username must match pattern: `^[a-zA-Z0-9_]{3,30}$`

**Error Handling:**
- Email already exists: Display "This email is already registered"
- Weak password: Display "Password must be at least 6 characters"
- Invalid email format: Display "Please enter a valid email address"
- Username taken: Display "This username is already taken"
- Network error: Display "Connection failed. Please try again"

**Dependencies:**
- Supabase Auth service must be available
- Database trigger handle_new_user must be active

**Success Criteria:**
- User can successfully create account
- Profile automatically created in profiles table
- User immediately logged in after registration
- No duplicate usernames or emails allowed

---

### FR-1.2: User Login with Email/Password

**Description:** Registered users can log in using their email and password.

**Functional Flow:**
1. User navigates to authentication page (/auth)
2. User enters email and password in "Sign In" tab
3. System validates credentials against Supabase Auth
4. System establishes authenticated session
5. System redirects user to home page

**Input Requirements:**
- Email: Valid email format
- Password: String (minimum 6 characters)

**Output/Results:**
- User session established
- JWT token stored
- User redirected to home page (/)
- Navigation bar updates to show user profile

**Validation Rules:**
- Email required, must be non-empty
- Password required, must be non-empty

**Error Handling:**
- Invalid credentials: Display "Invalid email or password"
- Account not found: Display "Invalid email or password" (same message for security)
- Too many attempts: Display "Too many login attempts. Please try again later"
- Network error: Display "Connection failed. Please try again"

**Dependencies:**
- Supabase Auth service
- Valid user account in auth.users table

**Success Criteria:**
- Valid users can log in successfully
- Session persists across browser sessions
- Invalid credentials rejected with appropriate error message

---

### FR-1.3: Microsoft SSO Authentication

**Description:** Users can authenticate using their Microsoft account via Azure AD SSO.

**Functional Flow:**
1. User clicks "Sign in with Microsoft" button
2. System redirects to Microsoft login page
3. User authenticates with Microsoft
4. Microsoft redirects back to application with auth token
5. System creates/updates user profile with Microsoft data
6. System extracts display_name from raw_user_meta_data->>'name'
7. System extracts avatar_url from raw_user_meta_data->>'picture'
8. System creates profile if first-time login
9. System redirects user to home page

**Input Requirements:**
- User's Microsoft account credentials (handled by Microsoft)
- Microsoft OAuth consent

**Output/Results:**
- User account created/logged in
- Profile populated with:
  - display_name: User's full name from Microsoft
  - username: Generated from email or Microsoft username
  - avatar_url: Microsoft profile picture URL
- User session established

**Data Extraction Logic:**
```javascript
username: COALESCE(
  raw_user_meta_data->>'username',
  raw_user_meta_data->>'preferred_username',
  split_part(email, '@', 1)
)

display_name: COALESCE(
  raw_user_meta_data->>'name',
  raw_user_meta_data->>'full_name',
  raw_user_meta_data->>'username'
)

avatar_url: COALESCE(
  raw_user_meta_data->>'avatar_url',
  raw_user_meta_data->>'picture'
)
```

**Error Handling:**
- User cancels Microsoft login: Return to auth page
- Microsoft service unavailable: Display "Microsoft login temporarily unavailable"
- Profile creation fails: Display "Account creation failed. Please try again"

**Dependencies:**
- Supabase Microsoft OAuth configuration
- Azure AD app registration
- Database trigger handle_new_user

**Success Criteria:**
- Users can authenticate with Microsoft account
- Display name automatically populated
- Profile picture automatically populated
- First-time users have profile created automatically

---

### FR-1.4: User Logout

**Description:** Authenticated users can log out of their account.

**Functional Flow:**
1. User clicks on profile avatar in navbar
2. User clicks "Logout" option
3. System terminates user session
4. System clears JWT token from storage
5. System redirects to home page
6. Navbar updates to show login/signup buttons

**Input Requirements:**
- Active user session

**Output/Results:**
- Session terminated
- JWT token removed from browser storage
- User redirected to home page (/)
- UI updates to anonymous state

**Error Handling:**
- Logout fails: Display "Logout failed. Please try again" and retry

**Dependencies:**
- Supabase Auth service

**Success Criteria:**
- User successfully logged out
- Session cleared completely
- User cannot access authenticated features without re-login

---

### FR-1.5: Session Persistence

**Description:** User sessions persist across browser sessions until explicitly logged out.

**Functional Flow:**
1. User logs in successfully
2. System stores session token in browser localStorage
3. User closes browser
4. User reopens browser and navigates to application
5. System checks for existing session token
6. System validates token with Supabase
7. System restores user session if valid

**Input Requirements:**
- Valid JWT token in localStorage

**Output/Results:**
- User remains logged in across browser sessions
- User profile data available immediately

**Validation Rules:**
- Token must not be expired
- Token must be valid and not revoked

**Error Handling:**
- Expired token: Clear session and redirect to auth page
- Invalid token: Clear session and redirect to auth page

**Dependencies:**
- Supabase Auth session management
- Browser localStorage availability

**Success Criteria:**
- Users stay logged in after closing browser
- Invalid/expired sessions automatically cleared

---

## FR-2: User Profiles

### FR-2.1: View User Profile

**Description:** Users can view detailed profile pages for any user in the system.

**Functional Flow:**
1. User clicks on username or avatar anywhere in the app
2. System navigates to /profile/:userId
3. System fetches user profile data
4. System fetches all prompts created by user
5. System displays profile information and prompts

**Input Requirements:**
- Valid user ID in URL parameter

**Output/Results:**
Display the following information:
- Avatar (profile picture or default)
- Display name (if available)
- Username
- Join date (relative format: "Joined 2 months ago")
- Total prompts created count
- Total likes received across all prompts
- Grid of all user's prompts

**Data Requirements:**
```sql
SELECT
  id,
  username,
  display_name,
  avatar_url,
  created_at
FROM profiles
WHERE id = :userId
```

```sql
SELECT
  prompts.*,
  COUNT(likes.id) as like_count
FROM prompts
LEFT JOIN likes ON likes.prompt_id = prompts.id
WHERE prompts.user_id = :userId
GROUP BY prompts.id
ORDER BY prompts.created_at DESC
```

**UI Components:**
- Profile header with avatar and stats
- Prompt grid (same layout as home page)
- Back navigation button
- Loading skeleton during data fetch

**Error Handling:**
- User not found: Display "User not found" message with back button
- Network error: Display error state with retry button
- No prompts: Display "This user hasn't shared any prompts yet"

**Dependencies:**
- profiles table
- prompts table
- likes table (for counts)

**Success Criteria:**
- Profile page displays correct user information
- All user's prompts visible in grid
- Like counts accurate
- Navigation works from all entry points

---

### FR-2.2: Profile Statistics

**Description:** Profile pages display aggregated statistics about the user's activity.

**Functional Flow:**
1. System loads profile page
2. System calculates total prompts by user
3. System calculates total likes received across all prompts
4. System displays statistics in profile header

**Calculations:**
- **Total Prompts:** COUNT of prompts where user_id = profile.id
- **Total Likes Received:** COUNT of likes where prompt_id IN (user's prompts)

**Output/Results:**
Display format:
```
12 prompts · 156 likes
```

**Data Requirements:**
```sql
-- Total prompts
SELECT COUNT(*) FROM prompts WHERE user_id = :userId

-- Total likes received
SELECT COUNT(likes.id)
FROM likes
JOIN prompts ON prompts.id = likes.prompt_id
WHERE prompts.user_id = :userId
```

**UI Requirements:**
- Statistics displayed on single line
- Separated by middle dot (·)
- Clickable stats (future: filter to liked prompts)

**Success Criteria:**
- Counts are accurate and real-time
- Statistics update when user creates/deletes prompts
- Like counts update when prompts receive likes

---

## FR-3: Prompt Discovery

### FR-3.1: Browse Prompts Feed

**Description:** Users can browse all public prompts in a paginated grid layout.

**Functional Flow:**
1. User navigates to home page (/)
2. System fetches prompts with related data
3. System displays prompts in responsive grid
4. User scrolls to view more prompts
5. System loads additional prompts as needed

**Input Requirements:**
- None (public access)

**Output/Results:**
Display grid of prompt cards showing:
- Title
- Description (truncated to 2 lines)
- Category badge
- Author username
- Author avatar
- Like count
- Comment count
- Created date (relative format)
- Copy button

**Data Requirements:**
```sql
SELECT
  prompts.id,
  prompts.title,
  prompts.description,
  prompts.prompt_text,
  prompts.category,
  prompts.created_at,
  prompts.user_id,
  profiles.username,
  profiles.display_name,
  profiles.avatar_url,
  COUNT(DISTINCT likes.id) as like_count,
  COUNT(DISTINCT comments.id) as comment_count
FROM prompts
LEFT JOIN profiles ON profiles.id = prompts.user_id
LEFT JOIN likes ON likes.prompt_id = prompts.id
LEFT JOIN comments ON comments.prompt_id = prompts.id
GROUP BY prompts.id, profiles.id
ORDER BY prompts.created_at DESC
```

**Grid Layout:**
- Mobile (< 768px): 1 column
- Tablet (768-1024px): 2 columns
- Desktop (> 1024px): 3 columns
- Gap between cards: 24px

**Loading Behavior:**
- Show skeleton cards while loading (6 cards)
- Display "No prompts yet" message if empty
- Optimistic updates when creating new prompt

**Error Handling:**
- Network error: Display error message with retry button
- Failed query: Display "Failed to load prompts"

**Dependencies:**
- prompts table
- profiles table
- likes table
- comments table

**Success Criteria:**
- All prompts visible to all users
- Grid responsive on all screen sizes
- Loading states provide feedback
- Data updates reflect immediately

---

### FR-3.2: Filter Prompts by Category

**Description:** Users can filter prompts to show only selected category.

**Functional Flow:**
1. User views home page with category sidebar
2. User clicks on category button
3. System filters prompts to selected category
4. URL updates to include category parameter
5. System displays filtered results
6. User can click "All" to clear filter

**Input Requirements:**
- Category selection from predefined list

**Available Categories:**
- All (shows all prompts)
- Code
- Docs
- Project
- Communication
- Learning
- AI & Tools
- Design
- Career
- Fun
- Misc

**Output/Results:**
- Filtered prompt grid showing only selected category
- Active category highlighted in sidebar
- Prompt count displayed next to each category
- URL format: `/?category=Code`

**Category Count Logic:**
```sql
SELECT
  category,
  COUNT(*) as count
FROM prompts
GROUP BY category
```

**UI Behavior:**
- Active category has background color
- Category buttons show icon + label + count
- Mobile: Categories in slide-out sheet
- Desktop: Categories in fixed left sidebar

**Validation Rules:**
- Category must be one of predefined options
- Invalid category defaults to "All"

**Error Handling:**
- Invalid category in URL: Ignore and show all prompts
- No prompts in category: Display "No prompts in this category yet"

**Dependencies:**
- prompts table with category column

**Success Criteria:**
- Filtering works instantly
- URL shareable with category selected
- Counts accurate for each category
- Mobile category menu accessible

---

### FR-3.3: Sort Prompts

**Description:** Users can sort prompts by different criteria.

**Functional Flow:**
1. User views home page
2. User clicks sort button/dropdown
3. User selects sort option
4. System re-orders prompts
5. URL updates with sort parameter
6. System displays sorted results

**Sort Options:**
1. **Recent** (default)
   - Sort by: created_at DESC
   - Shows newest prompts first

2. **Popular**
   - Sort by: like_count DESC, created_at DESC
   - Shows most-liked prompts first
   - Ties broken by recency

**Input Requirements:**
- Sort option selection

**Output/Results:**
- Prompts reordered based on selection
- Active sort option highlighted
- URL format: `/?sort=popular`

**SQL Queries:**

Recent:
```sql
ORDER BY prompts.created_at DESC
```

Popular:
```sql
ORDER BY COUNT(likes.id) DESC, prompts.created_at DESC
```

**UI Requirements:**
- Sort toggle buttons in header
- Active sort has distinct styling
- Sort persists across page navigation

**Validation Rules:**
- Sort must be "recent" or "popular"
- Invalid sort defaults to "recent"

**Error Handling:**
- Invalid sort parameter: Default to recent

**Dependencies:**
- prompts table
- likes table (for popular sort)

**Success Criteria:**
- Sort changes immediately
- Popular sort shows highest-liked first
- Recent sort shows newest first
- Sort preference preserved in URL

---

### FR-3.4: Copy Prompt to Clipboard

**Description:** Users can copy prompt text to clipboard with one click.

**Functional Flow:**
1. User views prompt card or detail page
2. User clicks copy button
3. System copies prompt_text to clipboard
4. System shows visual feedback (checkmark icon)
5. Icon reverts to copy icon after 2 seconds

**Input Requirements:**
- Prompt text available

**Output/Results:**
- Prompt text copied to system clipboard
- Button icon changes: Copy → Check
- Button state: default → success color
- After 2 seconds: Check → Copy

**Technical Implementation:**
```javascript
navigator.clipboard.writeText(promptText)
```

**UI Feedback:**
- Icon transition: Copy icon → Check icon
- Color change: Default → Green/Success
- Duration: 2 seconds

**Error Handling:**
- Clipboard API not available: Fallback to textarea copy method
- Copy fails: Display toast notification "Failed to copy"
- Permission denied: Display toast "Clipboard access denied"

**Accessibility:**
- Button has aria-label: "Copy prompt to clipboard"
- Success state announced to screen readers

**Dependencies:**
- Browser Clipboard API
- Lucide React icons (Copy, Check)

**Success Criteria:**
- One-click copy functionality works
- Visual feedback clear and immediate
- Works on all major browsers
- Fallback works on older browsers

---

### FR-3.5: View Prompt Details

**Description:** Users can view full details of a prompt on dedicated page.

**Functional Flow:**
1. User clicks on prompt card (anywhere except copy button)
2. System navigates to /prompt/:id
3. System fetches complete prompt data
4. System fetches all comments
5. System displays full prompt information

**Input Requirements:**
- Valid prompt ID in URL

**Output/Results:**
Display complete prompt information:
- Full title
- Complete description
- Category badge
- Author information (name, avatar)
- Created date (relative format)
- Target model (if specified)
- Full prompt text in monospace font
- Copy button for prompt text
- Preview image (if available)
- Like button with count
- Comment section with all comments

**Data Requirements:**
```sql
SELECT
  prompts.*,
  profiles.username,
  profiles.display_name,
  profiles.avatar_url,
  COUNT(DISTINCT likes.id) as like_count,
  COUNT(DISTINCT comments.id) as comment_count,
  EXISTS(
    SELECT 1 FROM likes
    WHERE likes.prompt_id = prompts.id
    AND likes.user_id = :currentUserId
  ) as user_has_liked
FROM prompts
LEFT JOIN profiles ON profiles.id = prompts.user_id
LEFT JOIN likes ON likes.prompt_id = prompts.id
LEFT JOIN comments ON comments.prompt_id = prompts.id
WHERE prompts.id = :promptId
GROUP BY prompts.id, profiles.id
```

**UI Layout:**
- Back button (← arrow)
- Header section: title, author, date
- Metadata: category, model
- Prompt text section (highlighted code block)
- Preview image (if available)
- Action buttons: like, copy
- Comment section below

**Loading Behavior:**
- Show skeleton loader during fetch
- Progressive loading (prompt first, then comments)

**Error Handling:**
- Prompt not found: Display "Prompt not found" with back button
- Network error: Display error with retry button
- Invalid ID: Redirect to home page

**Dependencies:**
- prompts table
- profiles table
- likes table
- comments table

**Success Criteria:**
- Full prompt details visible
- All related data loaded correctly
- Navigation works from any entry point
- Loading states provide feedback

---

## FR-4: Prompt Management

### FR-4.1: Create New Prompt

**Description:** Authenticated users can create and publish new prompts.

**Functional Flow:**
1. User navigates to /my-prompts
2. User clicks "Create Prompt" button
3. System opens create prompt dialog
4. User fills in form fields
5. User clicks "Create" button
6. System validates input
7. System saves prompt to database
8. System closes dialog
9. System displays success message
10. New prompt appears in user's prompt list

**Input Requirements:**

Required fields:
- Title: 3-200 characters
- Prompt text: 10-10,000 characters

Optional fields:
- Description: 0-500 characters
- Model: Text field (e.g., "GPT-4", "Claude 3")
- Category: Dropdown selection

**Form Fields:**

```
Title *
[Text input]

Description
[Textarea, 3 rows]

Prompt Text *
[Textarea, 10 rows, monospace font]

Model (Optional)
[Text input, placeholder: "e.g., GPT-4, Claude 3"]

Category
[Dropdown: Code, Docs, Project, Communication, Learning, AI & Tools, Design, Career, Fun, Misc]
```

**Validation Rules:**
- Title: 3-200 characters, required
- Prompt text: 10-10,000 characters, required
- Description: Max 500 characters, optional
- Model: Max 100 characters, optional
- Category: Must be from predefined list, optional

**Database Operation:**
```sql
INSERT INTO prompts (
  user_id,
  title,
  description,
  prompt_text,
  model,
  category
) VALUES (
  :currentUserId,
  :title,
  :description,
  :promptText,
  :model,
  :category
)
RETURNING *
```

**Output/Results:**
- Prompt created in database
- Dialog closes
- Success toast: "Prompt created successfully"
- User's prompt list refreshes
- New prompt visible at top of list

**UI Behavior:**
- Form fields clear after successful creation
- Submit button disabled during submission
- Loading indicator on submit button while saving

**Error Handling:**
- Title too short: "Title must be at least 3 characters"
- Title too long: "Title cannot exceed 200 characters"
- Prompt text too short: "Prompt must be at least 10 characters"
- Prompt text too long: "Prompt cannot exceed 10,000 characters"
- Network error: "Failed to create prompt. Please try again"
- Database error: "An error occurred. Please try again"

**Dependencies:**
- User must be authenticated
- prompts table
- RLS policy: INSERT allowed for authenticated users

**Success Criteria:**
- Form validation prevents invalid submissions
- Prompt created successfully in database
- User feedback immediate and clear
- New prompt appears in feed immediately

---

### FR-4.2: Edit Existing Prompt

**Description:** Prompt owners can edit their own prompts.

**Functional Flow:**
1. User views their prompt (on /my-prompts or detail page)
2. User clicks "Edit" button
3. System opens edit dialog with pre-filled form
4. User modifies fields
5. User clicks "Save" button
6. System validates changes
7. System updates prompt in database
8. System closes dialog
9. System displays success message
10. Updated prompt reflects changes immediately

**Input Requirements:**
- User must be the prompt owner
- Valid prompt ID

**Form Pre-population:**
All existing field values loaded into form

**Editable Fields:**
- Title
- Description
- Prompt text
- Model
- Category

**Non-editable Fields:**
- Author (user_id)
- Created date
- ID

**Validation Rules:**
Same as FR-4.1 (Create Prompt)

**Database Operation:**
```sql
UPDATE prompts
SET
  title = :title,
  description = :description,
  prompt_text = :promptText,
  model = :model,
  category = :category
WHERE id = :promptId
AND user_id = :currentUserId
RETURNING *
```

**Authorization:**
- RLS policy enforces user_id = auth.uid()
- Edit button only visible to owner
- API request rejected if not owner

**Output/Results:**
- Prompt updated in database
- Dialog closes
- Success toast: "Prompt updated successfully"
- UI updates with new values
- Like and comment counts preserved

**Error Handling:**
- Unauthorized edit attempt: "You don't have permission to edit this prompt"
- Validation errors: Same as create
- Network error: "Failed to update prompt. Please try again"
- Concurrent edit conflict: "Prompt was modified. Please refresh and try again"

**Dependencies:**
- User must be authenticated and owner
- prompts table
- RLS policy: UPDATE allowed for owner only

**Success Criteria:**
- Only owner can edit their prompts
- All fields editable except system fields
- Changes save successfully
- UI updates immediately without refresh

---

### FR-4.3: Delete Prompt

**Description:** Prompt owners can delete their own prompts.

**Functional Flow:**
1. User views their prompt
2. User clicks "Delete" button
3. System shows confirmation dialog
4. User confirms deletion
5. System deletes prompt from database
6. System cascades deletion to related records
7. System displays success message
8. Prompt removed from UI
9. User redirected if on detail page

**Input Requirements:**
- User must be the prompt owner
- Valid prompt ID

**Confirmation Dialog:**
```
Delete Prompt?

Are you sure you want to delete "[Prompt Title]"?
This action cannot be undone.

[Cancel]  [Delete]
```

**Database Operations:**
```sql
-- Cascade deletes happen automatically via foreign keys
DELETE FROM prompts
WHERE id = :promptId
AND user_id = :currentUserId
```

**Cascading Deletions:**
- All likes on the prompt (automatic via FK CASCADE)
- All comments on the prompt (automatic via FK CASCADE)

**Authorization:**
- RLS policy enforces user_id = auth.uid()
- Delete button only visible to owner
- API request rejected if not owner

**Output/Results:**
- Prompt deleted from database
- Related likes deleted
- Related comments deleted
- Success toast: "Prompt deleted successfully"
- Prompt removed from all views
- If on detail page: redirect to /my-prompts

**UI Behavior:**
- Confirmation required (no accidental deletion)
- Delete button has warning color (red)
- Loading state during deletion
- Optimistic removal from UI

**Error Handling:**
- Unauthorized deletion: "You don't have permission to delete this prompt"
- Prompt not found: "Prompt no longer exists"
- Network error: "Failed to delete prompt. Please try again"
- Database error: "An error occurred. Please try again"

**Dependencies:**
- User must be authenticated and owner
- prompts table with CASCADE foreign keys
- RLS policy: DELETE allowed for owner only

**Success Criteria:**
- Only owner can delete their prompts
- Confirmation prevents accidental deletion
- Deletion removes all related data
- UI updates immediately
- No orphaned records remain

---

### FR-4.4: View My Prompts

**Description:** Authenticated users can view all prompts they've created.

**Functional Flow:**
1. User clicks "My Prompts" in navbar
2. System navigates to /my-prompts
3. System fetches all user's prompts
4. System displays prompts in grid layout
5. User can edit or delete each prompt
6. User can create new prompt

**Input Requirements:**
- User must be authenticated

**Output/Results:**
Display page with:
- Page title: "My Prompts"
- "Create Prompt" button (top right)
- Grid of prompt cards (user's prompts only)
- Edit button on each card
- Delete button on each card
- Prompt statistics (likes, comments)

**Data Requirements:**
```sql
SELECT
  prompts.*,
  COUNT(DISTINCT likes.id) as like_count,
  COUNT(DISTINCT comments.id) as comment_count
FROM prompts
LEFT JOIN likes ON likes.prompt_id = prompts.id
LEFT JOIN comments ON comments.prompt_id = prompts.id
WHERE prompts.user_id = :currentUserId
GROUP BY prompts.id
ORDER BY prompts.created_at DESC
```

**Grid Layout:**
Same responsive grid as home page:
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 3 columns

**Card Actions:**
Each card shows:
- Edit button (pencil icon)
- Delete button (trash icon)
- Action buttons only visible on hover (desktop)

**Empty State:**
If user has no prompts:
```
No prompts yet

You haven't created any prompts yet.
Share your first prompt with the community!

[Create Prompt]
```

**Loading Behavior:**
- Show skeleton cards while loading
- Loading state on create button during submission

**Error Handling:**
- Network error: Display error message with retry
- No prompts: Display empty state message
- Failed query: Display "Failed to load prompts"

**Dependencies:**
- User must be authenticated
- prompts table
- likes table
- comments table

**Success Criteria:**
- Only user's prompts visible
- Edit/delete actions work correctly
- Create button opens form dialog
- Empty state helpful and actionable
- Statistics accurate and real-time

---

## FR-5: Social Interactions

### FR-5.1: Like Prompt

**Description:** Authenticated users can like prompts to show appreciation.

**Functional Flow:**
1. User views prompt (card or detail page)
2. User clicks like button (heart icon)
3. System checks if user already liked
4. If not liked: System adds like to database
5. If already liked: System removes like (unlike)
6. System updates like count
7. UI updates immediately (optimistic update)

**Input Requirements:**
- User must be authenticated
- Valid prompt ID

**Like Button States:**
1. **Not liked**: Outline heart, default color
2. **Liked**: Filled heart, red color
3. **Loading**: Disabled state during request

**Database Operations:**

Like (add):
```sql
INSERT INTO likes (prompt_id, user_id)
VALUES (:promptId, :currentUserId)
ON CONFLICT (prompt_id, user_id) DO NOTHING
```

Unlike (remove):
```sql
DELETE FROM likes
WHERE prompt_id = :promptId
AND user_id = :currentUserId
```

**Check if liked:**
```sql
SELECT EXISTS(
  SELECT 1 FROM likes
  WHERE prompt_id = :promptId
  AND user_id = :currentUserId
)
```

**Output/Results:**
- Like added/removed from database
- Like count updates (+1 or -1)
- Button state changes (filled/outline)
- Optimistic UI update
- Rollback on error

**UI Behavior:**
- Immediate visual feedback (no delay)
- Heart icon animates on like
- Count updates instantly
- Red color when liked

**Authorization:**
- User must be authenticated to like
- Users cannot like their own prompts (optional rule)
- Unique constraint prevents duplicate likes

**Error Handling:**
- Not authenticated: Display "Please log in to like prompts"
- Duplicate like: Silently handle (constraint prevents)
- Network error: Rollback optimistic update, display toast error
- Database error: Rollback and show error message

**Accessibility:**
- Button has aria-label: "Like this prompt"
- When liked: aria-label: "Unlike this prompt"
- Button keyboard accessible

**Dependencies:**
- User must be authenticated
- likes table
- Unique constraint: (prompt_id, user_id)
- RLS policy: INSERT/DELETE for own user_id

**Success Criteria:**
- Like toggles immediately
- Like count accurate
- No duplicate likes possible
- Optimistic updates with error rollback
- Visual feedback clear

---

### FR-5.2: View Like Count

**Description:** All users can see how many likes a prompt has received.

**Functional Flow:**
1. System loads prompt data
2. System counts likes for prompt
3. System displays count next to heart icon

**Input Requirements:**
- Valid prompt ID

**Count Calculation:**
```sql
SELECT COUNT(*)
FROM likes
WHERE prompt_id = :promptId
```

**Display Format:**
- Format: "[heart icon] 42"
- If zero likes: Show "0" (not hidden)
- Large numbers: Format as "1.2k", "3.4k", etc.

**Output Locations:**
- Prompt cards in feed
- Prompt detail page
- My Prompts page
- User profile page

**UI Requirements:**
- Icon and count on same line
- Count next to heart icon
- Consistent spacing
- Red heart if user liked, outline if not

**Real-time Updates:**
- Count updates when user likes/unlikes
- Count updates when others like (on refresh)

**Success Criteria:**
- Count always accurate
- Visible on all prompt views
- Updates immediately on user action

---

### FR-5.3: Add Comment

**Description:** Authenticated users can add comments to prompts.

**Functional Flow:**
1. User views prompt detail page
2. User scrolls to comment section
3. User types comment in textarea
4. User clicks "Post Comment" button
5. System validates comment text
6. System saves comment to database
7. System clears textarea
8. New comment appears at top of list
9. Comment count increments

**Input Requirements:**
- User must be authenticated
- Valid prompt ID
- Comment text: 1-1,000 characters

**Form Fields:**
```
Add a comment
[Textarea, 3 rows, placeholder: "Share your thoughts..."]

[Cancel]  [Post Comment]
```

**Validation Rules:**
- Comment text required
- Minimum length: 1 character
- Maximum length: 1,000 characters
- No HTML/script tags (sanitized)

**Database Operation:**
```sql
INSERT INTO comments (
  prompt_id,
  user_id,
  comment_text
) VALUES (
  :promptId,
  :currentUserId,
  :commentText
)
RETURNING *,
  (SELECT username, display_name, avatar_url
   FROM profiles WHERE id = :currentUserId) as author
```

**Output/Results:**
- Comment saved to database
- Textarea clears
- New comment appears at top
- Comment count increments
- Success feedback (not always toast)

**Comment Display:**
Each comment shows:
- Author avatar
- Author name (display_name or username)
- Comment text (with line breaks preserved)
- Timestamp (relative format)
- Edit button (if owner)
- Delete button (if owner)

**UI Behavior:**
- Textarea auto-expands with content
- Character count shown (optional)
- Submit button disabled if empty
- Loading state on submit

**Error Handling:**
- Empty comment: "Comment cannot be empty"
- Too long: "Comment cannot exceed 1,000 characters"
- Network error: "Failed to post comment. Please try again"
- Not authenticated: Redirect to login

**Dependencies:**
- User must be authenticated
- comments table
- RLS policy: INSERT for authenticated users

**Success Criteria:**
- Comments post successfully
- New comments visible immediately
- Form clears after posting
- Multi-line comments supported
- Timestamps accurate

---

### FR-5.4: Edit Comment

**Description:** Comment owners can edit their own comments.

**Functional Flow:**
1. User views their comment
2. User clicks "Edit" button
3. System shows inline edit form
4. Textarea pre-filled with comment text
5. User modifies text
6. User clicks "Save" button
7. System validates changes
8. System updates comment in database
9. System displays updated comment

**Input Requirements:**
- User must be comment owner
- Valid comment ID

**Edit Form:**
```
[Textarea with existing comment text]
[Cancel]  [Save]
```

**Validation Rules:**
Same as FR-5.3 (Add Comment)

**Database Operation:**
```sql
UPDATE comments
SET comment_text = :commentText
WHERE id = :commentId
AND user_id = :currentUserId
RETURNING *
```

**Authorization:**
- Edit button only visible to comment owner
- RLS policy enforces user_id = auth.uid()

**Output/Results:**
- Comment updated in database
- Edit form closes
- Updated text displayed
- No "edited" indicator (optional future feature)

**UI Behavior:**
- Edit form replaces comment display
- Cancel button reverts changes
- Inline editing (no dialog)

**Error Handling:**
- Unauthorized: "You don't have permission to edit this comment"
- Validation errors: Same as create
- Network error: "Failed to update comment. Please try again"

**Dependencies:**
- User must be authenticated and owner
- comments table
- RLS policy: UPDATE for owner only

**Success Criteria:**
- Only owner can edit comments
- Changes save successfully
- UI updates immediately
- Cancel restores original text

---

### FR-5.5: Delete Comment

**Description:** Comment owners can delete their own comments.

**Functional Flow:**
1. User views their comment
2. User clicks "Delete" button
3. System shows confirmation dialog
4. User confirms deletion
5. System deletes comment from database
6. Comment removed from display
7. Comment count decrements

**Input Requirements:**
- User must be comment owner
- Valid comment ID

**Confirmation Dialog:**
```
Delete Comment?

Are you sure you want to delete this comment?
This action cannot be undone.

[Cancel]  [Delete]
```

**Database Operation:**
```sql
DELETE FROM comments
WHERE id = :commentId
AND user_id = :currentUserId
```

**Authorization:**
- Delete button only visible to comment owner
- RLS policy enforces user_id = auth.uid()

**Output/Results:**
- Comment deleted from database
- Comment removed from display
- Comment count decrements
- Success toast: "Comment deleted"

**UI Behavior:**
- Confirmation prevents accidental deletion
- Delete button has warning styling (red)
- Optimistic removal from UI

**Error Handling:**
- Unauthorized: "You don't have permission to delete this comment"
- Comment not found: "Comment no longer exists"
- Network error: "Failed to delete comment. Please try again"

**Dependencies:**
- User must be authenticated and owner
- comments table
- RLS policy: DELETE for owner only

**Success Criteria:**
- Only owner can delete comments
- Confirmation required
- Deletion immediate
- Comment count updates correctly

---

### FR-5.6: View Comments

**Description:** All users can view comments on prompts.

**Functional Flow:**
1. User views prompt detail page
2. System fetches all comments for prompt
3. System displays comments in chronological order

**Input Requirements:**
- Valid prompt ID

**Data Requirements:**
```sql
SELECT
  comments.*,
  profiles.username,
  profiles.display_name,
  profiles.avatar_url
FROM comments
JOIN profiles ON profiles.id = comments.user_id
WHERE comments.prompt_id = :promptId
ORDER BY comments.created_at DESC
```

**Output/Results:**
Display comments section with:
- Section title: "Comments (12)"
- List of comments (newest first)
- Add comment form (if authenticated)

**Comment Display Format:**
```
[Avatar] AuthorName · 2 hours ago
Comment text goes here.
Multiple lines supported.
[Edit] [Delete]  (if owner)
```

**Empty State:**
If no comments:
```
No comments yet

Be the first to share your thoughts!
```

**Loading Behavior:**
- Show skeleton loaders while fetching
- Progressive loading (prompt first, comments after)

**Error Handling:**
- Network error: Display error with retry
- No comments: Display empty state

**Dependencies:**
- comments table
- profiles table

**Success Criteria:**
- All comments visible to all users
- Newest comments show first
- Author information displayed
- Timestamps accurate and relative

---

## FR-6: Navigation

### FR-6.1: Navigation Bar

**Description:** Persistent navigation bar provides access to main sections.

**Functional Flow:**
1. Navigation bar visible on all pages
2. Bar sticky at top of viewport
3. Navigation updates based on auth state

**Navigation Elements:**

**For Anonymous Users:**
- Logo/Brand name (links to /)
- "Login" button (links to /auth)
- "Sign Up" button (links to /auth?mode=signup)

**For Authenticated Users:**
- Logo/Brand name (links to /)
- "My Prompts" link (links to /my-prompts)
- User avatar dropdown:
  - Profile (links to /profile/:userId)
  - Logout (triggers logout)

**UI Requirements:**
- Height: 64px
- Background: White with border bottom
- Sticky position (stays visible on scroll)
- Shadow on scroll (optional)

**Responsive Behavior:**
- Desktop: Full navbar layout
- Mobile: Hamburger menu if needed
- Avatar/buttons remain accessible

**Logo/Brand:**
- Text: "PromptShare"
- Icon: Sparkles or similar
- Links to home page (/)

**Error Handling:**
- Auth state sync issues: Show loading state
- Avatar load failure: Show fallback initials

**Dependencies:**
- AuthContext for user state
- React Router for navigation

**Success Criteria:**
- Navbar visible on all pages
- Auth state reflected correctly
- All links functional
- Responsive on all devices

---

### FR-6.2: Page Routing

**Description:** Application uses client-side routing for navigation.

**Route Definitions:**

| Route | Component | Auth Required | Description |
|-------|-----------|---------------|-------------|
| / | HomePage | No | Browse prompts feed |
| /auth | AuthPage | No | Login/signup forms |
| /prompt/:id | PromptDetailPage | No | View prompt details |
| /my-prompts | MyPromptsPage | Yes | Manage user's prompts |
| /profile/:userId | ProfilePage | No | View user profile |
| /confirm-email | ConfirmEmailPage | No | Email confirmation (future) |

**Route Behavior:**

Protected Routes:
- If not authenticated: Redirect to /auth
- After login: Redirect to originally requested page

Public Routes:
- Accessible without authentication
- Auth state affects UI elements only

**URL Parameters:**
- Prompt ID: UUID format
- User ID: UUID format
- Category: Query parameter (?category=Code)
- Sort: Query parameter (?sort=popular)

**Navigation Methods:**
- Link clicks: Standard React Router Link
- Programmatic: useNavigate hook
- Back button: Browser history respected

**Error Handling:**
- 404 Not Found: Invalid prompt/user ID
- Unauthorized access: Redirect to /auth
- Invalid routes: Redirect to home page

**Dependencies:**
- React Router DOM v7
- AuthContext for protection

**Success Criteria:**
- All routes navigate correctly
- Protected routes enforce authentication
- Browser back/forward work
- URLs shareable

---

## FR-7: Data Validation

### FR-7.1: Client-Side Validation

**Description:** Form inputs validated on client before submission.

**Validation Rules by Field:**

**Email:**
- Required: Yes
- Pattern: Valid email format
- Error: "Please enter a valid email address"

**Password:**
- Required: Yes
- Min length: 6 characters
- Error: "Password must be at least 6 characters"

**Username:**
- Required: Yes
- Min length: 3 characters
- Max length: 30 characters
- Pattern: Alphanumeric and underscores only
- Error: "Username must be 3-30 characters (letters, numbers, underscores only)"

**Prompt Title:**
- Required: Yes
- Min length: 3 characters
- Max length: 200 characters
- Error: "Title must be 3-200 characters"

**Prompt Description:**
- Required: No
- Max length: 500 characters
- Error: "Description cannot exceed 500 characters"

**Prompt Text:**
- Required: Yes
- Min length: 10 characters
- Max length: 10,000 characters
- Error: "Prompt must be 10-10,000 characters"

**Model:**
- Required: No
- Max length: 100 characters
- Error: "Model name cannot exceed 100 characters"

**Comment Text:**
- Required: Yes
- Min length: 1 character
- Max length: 1,000 characters
- Error: "Comment cannot exceed 1,000 characters"

**Validation Timing:**
- On blur (field loses focus)
- On submit (all fields)
- Real-time for character limits

**UI Feedback:**
- Error messages below fields
- Red border on invalid fields
- Green checkmark on valid fields
- Submit button disabled if form invalid

**Success Criteria:**
- All fields validated before submission
- Clear error messages
- No invalid data submitted
- User feedback immediate

---

### FR-7.2: Server-Side Validation

**Description:** Database enforces data integrity and constraints.

**Database Constraints:**

**profiles table:**
- id: PRIMARY KEY, UUID
- username: UNIQUE, NOT NULL
- display_name: nullable
- avatar_url: nullable

**prompts table:**
- id: PRIMARY KEY, UUID
- user_id: NOT NULL, FOREIGN KEY
- title: NOT NULL
- prompt_text: NOT NULL
- category: nullable, CHECK constraint (if implemented)

**likes table:**
- id: PRIMARY KEY, UUID
- prompt_id: NOT NULL, FOREIGN KEY
- user_id: NOT NULL, FOREIGN KEY
- UNIQUE(prompt_id, user_id)

**comments table:**
- id: PRIMARY KEY, UUID
- prompt_id: NOT NULL, FOREIGN KEY
- user_id: NOT NULL, FOREIGN KEY
- comment_text: NOT NULL

**Row-Level Security:**
- All tables have RLS enabled
- Policies enforce ownership rules
- Read access public where appropriate
- Write access restricted to owners

**Referential Integrity:**
- Foreign keys with CASCADE delete
- Orphaned records prevented

**Success Criteria:**
- Invalid data rejected at database level
- Constraints enforce business rules
- RLS prevents unauthorized access
- Data integrity maintained

---

## FR-8: Error Handling

### FR-8.1: Network Errors

**Description:** Application handles network failures gracefully.

**Error Scenarios:**
1. Connection timeout
2. Server unavailable
3. Request failed
4. Slow connection

**User Feedback:**
- Error message displayed
- Retry button provided
- Loading states indicate progress

**Error Messages:**
- "Connection failed. Please check your internet connection."
- "Server temporarily unavailable. Please try again."
- "Request timed out. Please try again."

**Retry Logic:**
- Manual retry via button
- Automatic retry for critical requests (auth)
- Exponential backoff for repeated failures

**UI Behavior:**
- Don't remove existing content on error
- Show error overlay or toast
- Maintain application state

**Success Criteria:**
- Users informed of network issues
- Retry mechanism available
- Application doesn't crash

---

### FR-8.2: Authentication Errors

**Description:** Authentication failures handled with clear feedback.

**Error Scenarios:**
1. Invalid credentials
2. Account doesn't exist
3. Email already registered
4. Username already taken
5. Session expired
6. Token invalid

**Error Messages:**
- "Invalid email or password"
- "This email is already registered"
- "This username is already taken"
- "Your session has expired. Please log in again."

**Handling:**
- Clear, actionable error messages
- No security information leaked
- Redirect to login if session expired

**Success Criteria:**
- Users understand what went wrong
- Security maintained (no user enumeration)
- Clear path to resolution

---

### FR-8.3: Data Not Found Errors

**Description:** Handle missing data scenarios gracefully.

**Error Scenarios:**
1. Prompt not found (invalid ID)
2. User not found (invalid ID)
3. Comment deleted
4. No prompts exist

**User Feedback:**
- "Prompt not found" message
- Back button to return
- Suggestions for next action

**UI Display:**
```
Prompt Not Found

The prompt you're looking for doesn't exist or has been deleted.

[← Back to Home]
```

**Success Criteria:**
- Clear feedback when data missing
- Navigation path provided
- No broken UI states

---

## FR-9: Performance Requirements

### FR-9.1: Page Load Performance

**Description:** Pages load quickly with optimized data fetching.

**Performance Targets:**
- Initial page load: < 2 seconds
- Subsequent navigation: < 500ms
- API response time: < 200ms average

**Optimization Techniques:**
- React Query caching
- Lazy loading images
- Code splitting (future)
- Optimistic UI updates

**Success Criteria:**
- Fast perceived performance
- Smooth navigation
- Minimal loading states

---

### FR-9.2: Data Loading States

**Description:** Loading states provide feedback during data fetches.

**Loading Indicators:**
- Skeleton loaders for content
- Spinner for buttons
- Progress bars for uploads

**Implementation:**
- Prompt cards: Skeleton grid
- Detail page: Skeleton layout
- Forms: Disabled state with spinner

**Success Criteria:**
- Users always know when loading
- No blank screens
- Loading states match content layout

---

## FR-10: Accessibility

### FR-10.1: Keyboard Navigation

**Description:** All interactive elements accessible via keyboard.

**Requirements:**
- Tab order logical and sequential
- Focus indicators visible
- Enter/Space activate buttons
- Escape closes dialogs/modals

**Focus Management:**
- Focus trapped in modals
- Focus returned after modal close
- Skip links for navigation (optional)

**Success Criteria:**
- Entire app navigable without mouse
- Focus indicators clear
- No keyboard traps

---

### FR-10.2: Screen Reader Support

**Description:** Content accessible to screen reader users.

**Requirements:**
- Semantic HTML elements
- ARIA labels where needed
- Alt text for images
- Form labels associated

**ARIA Labels:**
- Buttons: aria-label for icon-only buttons
- Links: aria-label for context
- Modals: aria-modal, aria-labelledby
- Live regions: aria-live for dynamic content

**Success Criteria:**
- Screen readers announce all content
- Interactive elements identified
- Context clear without visual cues

---

## FR-11: Responsive Design

### FR-11.1: Mobile Layout

**Description:** Application optimized for mobile devices.

**Breakpoint:** < 768px

**Layout Changes:**
- 1 column grid for prompts
- Category menu in slide-out sheet
- Simplified navbar
- Touch-friendly targets (44x44px minimum)

**Mobile Optimizations:**
- Larger tap targets
- Simplified forms
- Reduced animations
- Optimized images

**Success Criteria:**
- Fully functional on mobile
- Comfortable touch targets
- No horizontal scrolling

---

### FR-11.2: Tablet Layout

**Description:** Application optimized for tablet devices.

**Breakpoint:** 768px - 1024px

**Layout Changes:**
- 2 column grid for prompts
- Sidebar visible (may be collapsible)
- Full navbar

**Success Criteria:**
- Optimal use of screen space
- Touch and mouse input supported

---

### FR-11.3: Desktop Layout

**Description:** Application optimized for desktop devices.

**Breakpoint:** > 1024px

**Layout Changes:**
- 3 column grid for prompts
- Persistent sidebar
- Full navbar with all options
- Hover states active

**Success Criteria:**
- Maximum information density
- Efficient navigation
- Hover interactions smooth

---

## 12. Appendix

### 12.1 Database Entity Relationships

```
auth.users (managed by Supabase)
    ↓ (1:1)
profiles
    ↓ (1:N)
prompts
    ↓ (1:N)
likes
    ↓ (1:N)
comments
```

### 12.2 State Management

**React Query Cache:**
- Prompt list queries
- Individual prompt queries
- User profile queries
- Comment queries

**Auth Context:**
- Current user session
- User profile data
- Authentication methods

### 12.3 API Endpoints (Supabase Auto-generated)

**GET /rest/v1/prompts**
- List all prompts
- Supports filtering, sorting, pagination

**GET /rest/v1/prompts?id=eq.{id}**
- Get single prompt

**POST /rest/v1/prompts**
- Create new prompt

**PATCH /rest/v1/prompts?id=eq.{id}**
- Update prompt

**DELETE /rest/v1/prompts?id=eq.{id}**
- Delete prompt

Similar endpoints for profiles, likes, comments.

---

## Document Control

**Version History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Oct 21, 2025 | Dev Team | Initial FRD creation |

**Approvals:**

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | | | |
| Technical Lead | | | |
| QA Lead | | | |

**Related Documents:**
- Product Requirements Document (PRD) v1.0
- Technical Architecture Document
- Database Schema Documentation
- API Documentation
- User Interface Design Specifications

---

**End of Document**
