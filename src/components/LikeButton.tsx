import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface LikeButtonProps {
  promptId: string;
  initialLikeCount: number;
  initialIsLiked: boolean;
}

export function LikeButton({ promptId, initialLikeCount, initialIsLiked }: LikeButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);

  useEffect(() => {
    console.log('LikeButton initial state:', { promptId, initialIsLiked, initialLikeCount });
  }, []);

  useEffect(() => {
    console.log('Setting isLiked to:', initialIsLiked);
    setIsLiked(initialIsLiked);
  }, [initialIsLiked]);

  useEffect(() => {
    setLikeCount(initialLikeCount);
  }, [initialLikeCount]);

  const likeMutation = useMutation({
    mutationFn: async (shouldLike: boolean) => {
      if (!user) throw new Error('Must be logged in');

      if (shouldLike) {
        console.log('Liking prompt:', promptId, 'user:', user.id);
        const { error, data } = await supabase
          .from('likes')
          .insert({
            prompt_id: promptId,
            user_id: user.id,
          });

        console.log('Like result:', { error, data });
        if (error) throw error;
        return 'liked';
      } else {
        console.log('Unliking prompt:', promptId, 'user:', user.id);
        const { error, data } = await supabase
          .from('likes')
          .delete()
          .eq('prompt_id', promptId)
          .eq('user_id', user.id);

        console.log('Unlike result:', { error, data });
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
      queryClient.invalidateQueries({ queryKey: ['prompt', promptId] });
      queryClient.invalidateQueries({ queryKey: ['userLike', promptId] });
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
    },
  });

  const handleClick = () => {
    if (!user) {
      toast({
        title: 'Login required',
        description: 'You must be logged in to like prompts',
      });
      return;
    }
    likeMutation.mutate(!isLiked);
  };

  return (
    <Button
      variant={isLiked ? 'default' : 'outline'}
      size="sm"
      onClick={handleClick}
      disabled={likeMutation.isPending}
      className="space-x-2"
    >
      <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
      <span>{likeCount}</span>
    </Button>
  );
}
