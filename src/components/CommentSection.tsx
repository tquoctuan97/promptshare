import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Comment {
  id: string;
  comment_text: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface CommentSectionProps {
  promptId: string;
}

export function CommentSection({ promptId }: CommentSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', promptId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          comment_text,
          created_at,
          user_id,
          profiles!comments_user_id_fkey (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('prompt_id', promptId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as any as Comment[];
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('comments')
        .insert({
          prompt_id: promptId,
          user_id: user.id,
          comment_text: text,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', promptId] });
      queryClient.invalidateQueries({ queryKey: ['prompt', promptId] });
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      setCommentText('');
      toast({
        title: 'Comment posted',
        description: 'Your comment has been added successfully',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to post comment',
      });
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, text }: { commentId: string; text: string }) => {
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('comments')
        .update({ comment_text: text })
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', promptId] });
      setEditingCommentId(null);
      setEditText('');
      toast({
        title: 'Comment updated',
        description: 'Your comment has been updated successfully',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update comment',
      });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', promptId] });
      queryClient.invalidateQueries({ queryKey: ['prompt', promptId] });
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      setDeleteCommentId(null);
      toast({
        title: 'Comment deleted',
        description: 'Your comment has been deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete comment',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    if (!user) {
      toast({
        title: 'Login required',
        description: 'You must be logged in to comment',
      });
      return;
    }

    createCommentMutation.mutate(commentText);
  };

  const handleEdit = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditText(comment.comment_text);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditText('');
  };

  const handleSaveEdit = (commentId: string) => {
    if (!editText.trim()) return;
    updateCommentMutation.mutate({ commentId, text: editText });
  };

  const handleDelete = (commentId: string) => {
    deleteCommentMutation.mutate(commentId);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Comments</h3>

      {user && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={3}
          />
          <Button
            type="submit"
            disabled={!commentText.trim() || createCommentMutation.isPending}
          >
            Post Comment
          </Button>
        </form>
      )}

      <div className="space-y-4">
        {isLoading ? (
          <p className="text-muted-foreground">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => {
            const isOwner = user?.id === comment.user_id;
            const isEditing = editingCommentId === comment.id;

            return (
              <Card key={comment.id}>
                <CardContent className="pt-6">
                  <div className="flex space-x-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={comment.profiles.avatar_url || undefined}
                        alt={comment.profiles.display_name || comment.profiles.username || 'User'}
                      />
                      <AvatarFallback>
                        {(comment.profiles.display_name || comment.profiles.username)?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">
                            {comment.profiles.display_name || comment.profiles.username || 'Anonymous'}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        {isOwner && !isEditing && (
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(comment)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteCommentId(comment.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </div>
                      {isEditing ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={3}
                          />
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handleSaveEdit(comment.id)}
                              disabled={!editText.trim() || updateCommentMutation.isPending}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEdit}
                              disabled={updateCommentMutation.isPending}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{comment.comment_text}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <AlertDialog open={!!deleteCommentId} onOpenChange={(open) => !open && setDeleteCommentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCommentId && handleDelete(deleteCommentId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
