import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { Toaster } from './components/ui/toaster';
import { HomePage } from './pages/HomePage';
import { PromptDetailPage } from './pages/PromptDetailPage';
import { AuthPage } from './pages/AuthPage';
import { MyPromptsPage } from './pages/MyPromptsPage';
import { ConfirmEmailPage } from './pages/ConfirmEmailPage';
import { ProfilePage } from './pages/ProfilePage';
import "./App.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <div className="min-h-screen bg-background">
            <Navbar />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/prompt/:id" element={<PromptDetailPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/my-prompts" element={<MyPromptsPage />} />
              <Route path="/confirm-email" element={<ConfirmEmailPage />} />
              <Route path="/profile/:userId" element={<ProfilePage />} />
            </Routes>
            <Toaster />
          </div>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
