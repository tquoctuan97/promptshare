import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Copy, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface PromptCardProps {
  id: string;
  title: string;
  description: string | null;
  promptText: string;
  category: string | null;
  userId: string;
  username: string;
  avatarUrl: string | null;
  likeCount: number;
  commentCount: number;
}

export function PromptCard({
  id,
  title,
  description,
  promptText,
  category,
  userId,
  username,
  avatarUrl,
  likeCount: initialLikeCount,
  commentCount,
}: PromptCardProps) {
  const [copied, setCopied] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userLike } = useQuery({
    queryKey: ['userLike', id, user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('prompt_id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    setIsLiked(!!userLike);
  }, [userLike]);

  useEffect(() => {
    setLikeCount(initialLikeCount);
  }, [initialLikeCount]);

  const likeMutation = useMutation({
    mutationFn: async (shouldLike: boolean) => {
      if (!user) throw new Error('Must be logged in');

      if (shouldLike) {
        const { error } = await supabase
          .from('likes')
          .insert({
            prompt_id: id,
            user_id: user.id,
          });

        if (error) throw error;
        return 'liked';
      } else {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('prompt_id', id)
          .eq('user_id', user.id);

        if (error) throw error;
        return 'unliked';
      }
    },
    onMutate: async (shouldLike: boolean) => {
      setIsLiked(shouldLike);
      setLikeCount(shouldLike ? likeCount + 1 : likeCount - 1);
    },
    onError: (error, shouldLike) => {
      setIsLiked(!shouldLike);
      setLikeCount(shouldLike ? likeCount - 1 : likeCount + 1);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update like',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompt', id] });
      queryClient.invalidateQueries({ queryKey: ['userLike', id] });
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      queryClient.invalidateQueries({ queryKey: ['user-prompts'] });
    },
  });

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast({
        title: 'Login required',
        description: 'You must be logged in to like prompts',
      });
      return;
    }
    likeMutation.mutate(!isLiked);
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <Card className="h-full hover:shadow-lg transition-shadow flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <Link to={`/prompt/${id}`} className="flex-1">
            <CardTitle className="text-lg line-clamp-2 hover:underline">{title}</CardTitle>
          </Link>
          {category && (
            <Badge variant="secondary" className="ml-2 shrink-0">
              {category}
            </Badge>
          )}
        </div>
        <CardDescription className="line-clamp-2">
          {description || 'No description provided'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col space-y-4">
        <div className="bg-muted rounded-lg p-3 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">PROMPT</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-7 px-2"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 mr-1 text-green-600" />
                  <span className="text-xs text-green-600">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 mr-1" />
                  <span className="text-xs">Copy</span>
                </>
              )}
            </Button>
          </div>
          <div className="overflow-y-auto max-h-32 pr-2 custom-scrollbar">
            <pre className="whitespace-pre-wrap font-mono text-xs text-foreground">{promptText}</pre>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2">
          <Link to={`/profile/${userId}`} className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <Avatar className="h-6 w-6">
              <AvatarImage src={avatarUrl || undefined} alt={username} />
              <AvatarFallback>{username[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground hover:underline">{username}</span>
          </Link>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <button
              onClick={handleLike}
              className="flex items-center space-x-1 hover:text-foreground transition-colors"
            >
              <Heart
                className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`}
              />
              <span>{likeCount}</span>
            </button>
            <div className="flex items-center space-x-1">
              <MessageCircle className="h-4 w-4" />
              <span>{commentCount}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
