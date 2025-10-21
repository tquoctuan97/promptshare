import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, CreditCard as Edit, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface Prompt {
  id: string;
  title: string;
  description: string | null;
  prompt_text: string;
  model: string | null;
  category: string | null;
  created_at: string;
}

interface PromptFormData {
  title: string;
  description: string;
  prompt_text: string;
  model: string;
  category: string;
}

export function MyPromptsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [deletingPrompt, setDeletingPrompt] = useState<Prompt | null>(null);
  const [formData, setFormData] = useState<PromptFormData>({
    title: '',
    description: '',
    prompt_text: '',
    model: '',
    category: 'Code',
  });

  const { data: prompts = [], isLoading } = useQuery({
    queryKey: ['my-prompts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Prompt[];
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (data: PromptFormData) => {
      if (!user) throw new Error('Must be logged in');
      const { error } = await supabase.from('prompts').insert({
        ...data,
        user_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-prompts'] });
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      queryClient.invalidateQueries({ queryKey: ['category-counts'] });
      setIsCreateOpen(false);
      resetForm();
      toast({
        title: 'Prompt created',
        description: 'Your prompt has been created successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create prompt. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PromptFormData }) => {
      const { error } = await supabase
        .from('prompts')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-prompts'] });
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      setEditingPrompt(null);
      resetForm();
      toast({
        title: 'Prompt updated',
        description: 'Your prompt has been updated successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update prompt. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('prompts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-prompts'] });
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      queryClient.invalidateQueries({ queryKey: ['category-counts'] });
      setDeletingPrompt(null);
      toast({
        title: 'Prompt deleted',
        description: 'Your prompt has been deleted successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete prompt. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      prompt_text: '',
      model: '',
      category: 'Code',
    });
  };

  const handleCreate = () => {
    setIsCreateOpen(true);
    resetForm();
  };

  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setFormData({
      title: prompt.title,
      description: prompt.description || '',
      prompt_text: prompt.prompt_text,
      model: prompt.model || '',
      category: prompt.category || 'Code',
    });
  };

  const handleSubmit = () => {
    if (editingPrompt) {
      updateMutation.mutate({ id: editingPrompt.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Please Login</h1>
        <p className="text-muted-foreground mb-6">
          You need to be logged in to manage your prompts.
        </p>
        <Button onClick={() => navigate('/auth')}>Go to Login</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">My Prompts</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Create, edit, and manage your AI prompt templates
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreate} size="lg" className="w-full md:w-auto">
              <Plus className="mr-2 h-5 w-5" />
              New Prompt
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[calc(100vw-2rem)] sm:w-full">
            <DialogHeader>
              <DialogTitle>Create New Prompt</DialogTitle>
              <DialogDescription>
                Add a new prompt template to your collection
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter prompt title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of your prompt"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prompt_text">Prompt Text</Label>
                <Textarea
                  id="prompt_text"
                  placeholder="Enter your prompt template here..."
                  value={formData.prompt_text}
                  onChange={(e) => setFormData({ ...formData, prompt_text: e.target.value })}
                  rows={8}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    placeholder="e.g., GPT-4, Claude"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Code">Code 🧑‍💻</SelectItem>
                      <SelectItem value="Docs">Docs 📄</SelectItem>
                      <SelectItem value="Project">Project 📊</SelectItem>
                      <SelectItem value="Communication">Communication ✉️</SelectItem>
                      <SelectItem value="Learning">Learning 📚</SelectItem>
                      <SelectItem value="AI & Tools">AI & Tools ⚡</SelectItem>
                      <SelectItem value="Design">Design 🎨</SelectItem>
                      <SelectItem value="Career">Career 🚀</SelectItem>
                      <SelectItem value="Fun">Fun 🎉</SelectItem>
                      <SelectItem value="Misc">Misc 🗂️</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.title || !formData.prompt_text || createMutation.isPending}
              >
                {createMutation.isPending ? 'Creating...' : 'Create Prompt'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={!!editingPrompt} onOpenChange={(open) => !open && setEditingPrompt(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[calc(100vw-2rem)] sm:w-full">
          <DialogHeader>
            <DialogTitle>Edit Prompt</DialogTitle>
            <DialogDescription>
              Make changes to your prompt template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                placeholder="Enter prompt title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Brief description of your prompt"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-prompt_text">Prompt Text</Label>
              <Textarea
                id="edit-prompt_text"
                placeholder="Enter your prompt template here..."
                value={formData.prompt_text}
                onChange={(e) => setFormData({ ...formData, prompt_text: e.target.value })}
                rows={8}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-model">Model</Label>
                <Input
                  id="edit-model"
                  placeholder="e.g., GPT-4, Claude"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger id="edit-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Code">Code 🧑‍💻</SelectItem>
                    <SelectItem value="Docs">Docs 📄</SelectItem>
                    <SelectItem value="Project">Project 📊</SelectItem>
                    <SelectItem value="Communication">Communication ✉️</SelectItem>
                    <SelectItem value="Learning">Learning 📚</SelectItem>
                    <SelectItem value="AI & Tools">AI & Tools ⚡</SelectItem>
                    <SelectItem value="Design">Design 🎨</SelectItem>
                    <SelectItem value="Career">Career 🚀</SelectItem>
                    <SelectItem value="Fun">Fun 🎉</SelectItem>
                    <SelectItem value="Misc">Misc 🗂️</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPrompt(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.title || !formData.prompt_text || updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Updating...' : 'Update Prompt'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingPrompt} onOpenChange={(open) => !open && setDeletingPrompt(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deletingPrompt?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingPrompt && deleteMutation.mutate(deletingPrompt.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading your prompts...</p>
        </div>
      ) : prompts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg mb-4">
            You haven't created any prompts yet.
          </p>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Prompt
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {prompts.map((prompt) => (
            <Card key={prompt.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="truncate">{prompt.title}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {prompt.description || 'No description'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-2 text-sm">
                  {prompt.category && (
                    <div className="flex items-center">
                      <span className="font-medium mr-2">Category:</span>
                      <span className="text-muted-foreground">{prompt.category}</span>
                    </div>
                  )}
                  {prompt.model && (
                    <div className="flex items-center">
                      <span className="font-medium mr-2">Model:</span>
                      <span className="text-muted-foreground">{prompt.model}</span>
                    </div>
                  )}
                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground line-clamp-3 bg-muted p-2 rounded">
                      {prompt.prompt_text}
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/prompt/${prompt.id}`)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Button>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(prompt)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeletingPrompt(prompt)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
