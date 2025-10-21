import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PromptCard } from '@/components/PromptCard';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface Prompt {
  id: string;
  title: string;
  description: string | null;
  prompt_text: string;
  category: string | null;
  created_at: string;
  profiles: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
  likes: { count: number }[];
  comments: { count: number }[];
}

export function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) throw new Error('No user ID provided');

      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, created_at')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Profile not found');

      return data as Profile;
    },
    enabled: !!userId,
  });

  const { data: prompts = [], isLoading: promptsLoading } = useQuery({
    queryKey: ['user-prompts', userId],
    queryFn: async () => {
      if (!userId) throw new Error('No user ID provided');

      const { data, error } = await supabase
        .from('prompts')
        .select(`
          id,
          title,
          description,
          prompt_text,
          category,
          created_at,
          profiles!prompts_user_id_fkey (
            username,
            display_name,
            avatar_url
          ),
          likes (count),
          comments (count)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((prompt: any) => ({
        ...prompt,
        profiles: prompt.profiles[0] || { username: null, display_name: null, avatar_url: null },
      })) as Prompt[];
    },
    enabled: !!userId,
  });

  if (profileLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        <Skeleton className="h-64 w-full mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Profile not found</h1>
        <Button asChild>
          <Link to="/">Return to Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
      <Button asChild variant="ghost" className="mb-4 md:mb-6" size="sm">
        <Link to="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to home
        </Link>
      </Button>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <Avatar className="h-24 w-24 md:h-32 md:w-32">
              <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name || profile.username || 'User'} />
              <AvatarFallback className="text-3xl md:text-4xl">
                {(profile.display_name || profile.username)?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {profile.display_name || profile.username || 'Anonymous'}
              </h1>
              <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground mb-4">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">
                  Joined {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <div>
                  <span className="text-2xl font-bold">{prompts.length}</span>
                  <span className="text-muted-foreground ml-2">Prompts</span>
                </div>
                <div>
                  <span className="text-2xl font-bold">
                    {prompts.reduce((acc, p) => acc + (p.likes[0]?.count || 0), 0)}
                  </span>
                  <span className="text-muted-foreground ml-2">Likes</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold mb-1">
          Contributed Prompts
        </h2>
        <p className="text-muted-foreground text-sm md:text-base">
          All prompts shared by {profile.display_name || profile.username || 'this user'}
        </p>
      </div>

      {promptsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      ) : prompts.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground text-lg">
              No prompts shared yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {prompts.map((prompt) => (
            <PromptCard
              key={prompt.id}
              id={prompt.id}
              title={prompt.title}
              description={prompt.description}
              promptText={prompt.prompt_text}
              category={prompt.category}
              userId={userId!}
              username={prompt.profiles.display_name || prompt.profiles.username || 'Anonymous'}
              avatarUrl={prompt.profiles.avatar_url}
              likeCount={prompt.likes[0]?.count || 0}
              commentCount={prompt.comments[0]?.count || 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
