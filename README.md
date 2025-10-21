# PromptShare

A community-driven platform for sharing and discovering AI prompt templates. Built with React, TypeScript, Supabase, and Tailwind CSS.

## Features

- Browse and discover AI prompts from the community
- Filter prompts by category (Code, Writing, Communication)
- Sort prompts by recent or popular
- Like and comment on prompts
- Copy prompt text to clipboard
- User authentication with email/password
- Responsive design for all screen sizes

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Library**: Shadcn/ui, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **State Management**: React Query (@tanstack/react-query)
- **Routing**: React Router DOM

## Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- A Supabase account ([sign up here](https://supabase.com))
- npm or yarn package manager

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd promptshare
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

#### Create a Supabase Project

1. Go to [Supabase](https://supabase.com) and create a new project
2. Wait for your project to be fully provisioned
3. Navigate to **Settings** > **API** in your Supabase dashboard
4. Copy your **Project URL** and **anon/public key**

#### Configure Environment Variables

Create a `.env` file in the project root:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace `your_supabase_project_url` and `your_supabase_anon_key` with the values from your Supabase dashboard.

### 4. Run Database Migrations

You need to apply the database schema to your Supabase project. There are two ways to do this:

#### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the migration file at `supabase/migrations/20250101000000_init_promptshare.sql`
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** to execute the migration

#### Option B: Using Supabase CLI (Advanced)

If you have the Supabase CLI installed:

```bash
supabase db push
```

### 5. Verify Database Setup

After running the migration, verify that the following tables were created:

- `profiles`
- `prompts`
- `likes`
- `comments`

Also verify that the `prompt-previews` storage bucket was created under **Storage**.

### 6. Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` directory.

To preview the production build locally:

```bash
npm run preview
```

## Database Schema

### Tables

#### `profiles`
- User profile information linked to auth.users
- Automatically created when a user signs up

#### `prompts`
- AI prompt templates shared by users
- Includes title, description, prompt text, target model, and category
- Supports preview output images via Storage

#### `likes`
- User likes on prompts
- Prevents duplicate likes with unique constraint

#### `comments`
- User comments on prompts
- Includes comment text and timestamps

### Row Level Security (RLS)

All tables have RLS enabled with the following policies:

- **Public read access**: Anyone can view prompts, profiles, likes, and comments
- **Authenticated write access**: Logged-in users can create content
- **Owner-only modifications**: Users can only edit/delete their own content

## Project Structure

```
promptshare/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ui/           # Shadcn/ui components
│   │   ├── Navbar.tsx    # Navigation bar
│   │   ├── PromptCard.tsx # Prompt preview card
│   │   ├── LikeButton.tsx # Like functionality
│   │   └── CommentSection.tsx # Comments display and form
│   ├── contexts/         # React contexts
│   │   └── AuthContext.tsx # Authentication state
│   ├── pages/            # Page components
│   │   ├── HomePage.tsx  # Main prompt feed
│   │   ├── PromptDetailPage.tsx # Individual prompt view
│   │   └── AuthPage.tsx  # Login/signup
│   ├── lib/              # Utilities and configuration
│   │   ├── supabase.ts   # Supabase client
│   │   ├── database.types.ts # TypeScript types
│   │   └── utils.ts      # Helper functions
│   ├── App.tsx           # Main app component
│   └── main.tsx          # Application entry point
├── supabase/
│   └── migrations/       # Database migrations
└── public/               # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## Authentication

The application uses Supabase Auth with email/password authentication:

- **Sign Up**: Create a new account with email, password, and username
- **Login**: Sign in with email and password
- **Logout**: Sign out from the current session

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add your environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The application can be deployed to any platform that supports Node.js and static site hosting:

- Netlify
- Cloudflare Pages
- AWS Amplify
- Railway
- Render

Make sure to configure the environment variables on your chosen platform.

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
