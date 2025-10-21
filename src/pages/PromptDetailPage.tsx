import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Copy, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { LikeButton } from '@/components/LikeButton';
import { CommentSection } from '@/components/CommentSection';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface PromptDetails {
  id: string;
  title: string;
  description: string | null;
  prompt_text: string;
  model: string | null;
  preview_output_url: string | null;
  category: string | null;
  created_at: string;
  user_id: string;
  profiles: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
  likes: { count: number }[];
}

export function PromptDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: prompt, isLoading } = useQuery({
    queryKey: ['prompt', id],
    queryFn: async () => {
      if (!id) throw new Error('No prompt ID provided');

      const { data, error } = await supabase
        .from('prompts')
        .select(`
          id,
          title,
          description,
          prompt_text,
          model,
          preview_output_url,
          category,
          created_at,
          user_id,
          profiles!prompts_user_id_fkey (
            username,
            display_name,
            avatar_url
          ),
          likes (count)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Prompt not found');

      return data as any as PromptDetails;
    },
    enabled: !!id,
  });

  const { data: userLike } = useQuery({
    queryKey: ['userLike', id, user?.id],
    queryFn: async () => {
      if (!id || !user) return null;

      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('prompt_id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  const copyToClipboard = async () => {
    if (!prompt) return;

    try {
      await navigator.clipboard.writeText(prompt.prompt_text);
      toast({
        title: 'Copied!',
        description: 'Prompt text copied to clipboard',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to copy to clipboard',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Prompt not found</h1>
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
          Back to prompts
        </Link>
      </Button>

      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-4xl font-bold mb-2">{prompt.title}</h1>
              {prompt.description && (
                <p className="text-base md:text-lg text-muted-foreground">{prompt.description}</p>
              )}
            </div>
            {prompt.category && (
              <Badge variant="secondary" className="shrink-0 w-fit">
                {prompt.category}
              </Badge>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6">
            <Link to={`/profile/${prompt.user_id}`} className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <Avatar className="h-10 w-10">
                <AvatarImage src={prompt.profiles.avatar_url || undefined} alt={prompt.profiles.display_name || prompt.profiles.username || 'User'} />
                <AvatarFallback>
                  {(prompt.profiles.display_name || prompt.profiles.username)?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{prompt.profiles.display_name || prompt.profiles.username || 'Anonymous'}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(prompt.created_at), { addSuffix: true })}
                </p>
              </div>
            </Link>
            {prompt.model && (
              <Badge variant="outline">{prompt.model}</Badge>
            )}
          </div>
        </div>

        <Card>
          <CardContent className="pt-4 md:pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg md:text-xl font-semibold">Prompt</h2>
              <Button onClick={copyToClipboard} size="sm">
                <Copy className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Copy</span>
              </Button>
            </div>
            <div className="bg-muted p-3 md:p-4 rounded-lg overflow-x-auto">
              <pre className="whitespace-pre-wrap font-mono text-xs md:text-sm">{prompt.prompt_text}</pre>
            </div>
          </CardContent>
        </Card>

        {prompt.preview_output_url && (
          <Card>
            <CardContent className="pt-4 md:pt-6">
              <h2 className="text-lg md:text-xl font-semibold mb-4">Preview Output</h2>
              <img
                src={prompt.preview_output_url}
                alt="Preview output"
                className="w-full rounded-lg"
              />
            </CardContent>
          </Card>
        )}

        <div className="flex items-center space-x-4">
          <LikeButton
            promptId={prompt.id}
            initialLikeCount={prompt.likes[0]?.count || 0}
            initialIsLiked={!!userLike}
          />
        </div>

        <CommentSection promptId={prompt.id} />
      </div>
    </div>
  );
}
