import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { PromptCard } from '@/components/PromptCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Code, FileText, FolderKanban, Mail, BookOpen, Zap, Palette, Rocket, PartyPopper, FolderOpen, Menu } from 'lucide-react';

type SortOption = 'recent' | 'popular';
type CategoryFilter = 'all' | 'Code' | 'Docs' | 'Project' | 'Communication' | 'Learning' | 'AI & Tools' | 'Design' | 'Career' | 'Fun' | 'Misc';

interface PromptWithDetails {
  id: string;
  title: string;
  description: string | null;
  prompt_text: string;
  category: string | null;
  created_at: string;
  user_id: string;
  profiles: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
  likes: { count: number }[];
  comments: { count: number }[];
}

interface CategoryConfig {
  value: CategoryFilter;
  label: string;
  icon: React.ReactNode;
}

export function HomePage() {
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: prompts = [], isLoading } = useQuery({
    queryKey: ['prompts', sortBy, category],
    queryFn: async () => {
      let query = supabase
        .from('prompts')
        .select(`
          id,
          title,
          description,
          prompt_text,
          category,
          created_at,
          user_id,
          profiles!prompts_user_id_fkey (
            username,
            display_name,
            avatar_url
          ),
          likes (count),
          comments (count)
        `);

      if (category !== 'all') {
        query = query.eq('category', category);
      }

      if (sortBy === 'recent') {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      let results = data as any as PromptWithDetails[];

      if (sortBy === 'popular') {
        results = results.sort((a, b) => {
          const aLikes = a.likes[0]?.count || 0;
          const bLikes = b.likes[0]?.count || 0;
          return bLikes - aLikes;
        });
      }

      return results;
    },
  });

  const { data: categoryCounts = {} } = useQuery({
    queryKey: ['category-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prompts')
        .select('category');

      if (error) throw error;

      const counts: Record<string, number> = {};
      data.forEach((item) => {
        const cat = item.category || 'Misc';
        counts[cat] = (counts[cat] || 0) + 1;
      });
      return counts;
    },
  });

  const categories: CategoryConfig[] = [
    { value: 'Code', label: 'Code', icon: <Code className="h-4 w-4" /> },
    { value: 'Docs', label: 'Docs', icon: <FileText className="h-4 w-4" /> },
    { value: 'Project', label: 'Project', icon: <FolderKanban className="h-4 w-4" /> },
    { value: 'Communication', label: 'Communication', icon: <Mail className="h-4 w-4" /> },
    { value: 'Learning', label: 'Learning', icon: <BookOpen className="h-4 w-4" /> },
    { value: 'AI & Tools', label: 'AI & Tools', icon: <Zap className="h-4 w-4" /> },
    { value: 'Design', label: 'Design', icon: <Palette className="h-4 w-4" /> },
    { value: 'Career', label: 'Career', icon: <Rocket className="h-4 w-4" /> },
    { value: 'Fun', label: 'Fun', icon: <PartyPopper className="h-4 w-4" /> },
    { value: 'Misc', label: 'Misc', icon: <FolderOpen className="h-4 w-4" /> },
  ];

  const CategoryList = () => (
    <div className="space-y-1">
      <button
        onClick={() => {
          setCategory('all');
          setIsMobileMenuOpen(false);
        }}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
          category === 'all'
            ? 'bg-primary text-primary-foreground'
            : 'hover:bg-muted text-foreground'
        }`}
      >
        <span>All</span>
        <Badge variant="secondary" className="ml-2">
          {Object.values(categoryCounts).reduce((a, b) => a + b, 0)}
        </Badge>
      </button>
      {categories.map((cat) => (
        <button
          key={cat.value}
          onClick={() => {
            setCategory(cat.value);
            setIsMobileMenuOpen(false);
          }}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
            category === cat.value
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted text-foreground'
          }`}
        >
          <span className="flex items-center gap-2">
            {cat.icon}
            {cat.label}
          </span>
          <Badge variant="secondary" className="ml-2">
            {categoryCounts[cat.value] || 0}
          </Badge>
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex">
      <aside className="hidden lg:block w-64 border-r bg-muted/30 p-6 fixed h-[calc(100vh-64px)] overflow-y-auto">
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-4">Categories</h2>
          <CategoryList />
        </div>
      </aside>

      <main className="flex-1 lg:ml-64 w-full">
        <div className="px-4 md:px-8 py-6 md:py-8">
          <div className="mb-6 md:mb-8">
            <div className="flex items-center justify-between mb-4 lg:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Menu className="h-4 w-4 mr-2" />
                    Categories
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px]">
                  <SheetHeader>
                    <SheetTitle>Categories</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <CategoryList />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-1 flex items-center gap-2">
                  {category === 'all' ? (
                    'All Prompts'
                  ) : (
                    <>
                      {categories.find((c) => c.value === category)?.icon}
                      {category}
                    </>
                  )}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {category === 'all'
                    ? 'Browse all AI prompt templates from the community'
                    : `Explore ${category.toLowerCase()} prompts`}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground hidden md:inline">Sort:</span>
                <Button
                  variant={sortBy === 'recent' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('recent')}
                >
                  Recent
                </Button>
                <Button
                  variant={sortBy === 'popular' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('popular')}
                >
                  Popular
                </Button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-72" />
              ))}
            </div>
          ) : prompts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">
                No prompts found in this category.
              </p>
            </div>
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
                  userId={prompt.user_id}
                  username={prompt.profiles.display_name || prompt.profiles.username || 'Anonymous'}
                  avatarUrl={prompt.profiles.avatar_url}
                  likeCount={prompt.likes[0]?.count || 0}
                  commentCount={prompt.comments[0]?.count || 0}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
