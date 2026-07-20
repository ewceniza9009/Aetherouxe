import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '../hooks/use-auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Building2, Loader2, Check } from 'lucide-react';

interface LoginPageProps {
  portalName?: string;
  placeholderEmail?: string;
}

export function LoginPage({
  portalName = 'Admin',
  placeholderEmail = 'admin@aetherouxe.com',
}: LoginPageProps) {
  const redirectTo = '/dashboard';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = localStorage.getItem('aetherouxe_remember_email');
    const savedPassword = localStorage.getItem('aetherouxe_remember_password');
    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);

      if (rememberMe) {
        localStorage.setItem('aetherouxe_remember_email', email);
        localStorage.setItem('aetherouxe_remember_password', password);
      } else {
        localStorage.removeItem('aetherouxe_remember_email');
        localStorage.removeItem('aetherouxe_remember_password');
      }

      navigate({ to: redirectTo });
    } catch {
      setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left Panel - Image */}
      <div className="hidden lg:flex w-1/2 relative bg-zinc-900 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        {/* Branding on Image */}
        <div className="relative z-10 mt-auto p-12 text-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Aetherouxe</h1>
          </div>
          <p className="text-lg font-light text-white/80 max-w-md">
            Premium property management platform. Streamlining operations for real estate
            professionals.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 xl:px-32 bg-card">
        <div className="w-full max-w-[420px] mx-auto space-y-8">
          {/* Mobile Header (Hidden on Desktop) */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary shadow-sm">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Aetherouxe</h1>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">Welcome back</h2>
            <p className="text-muted-foreground text-sm">
              Sign in to the {portalName} Portal to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={placeholderEmail}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 px-4 bg-background border-input focus-visible:ring-primary shadow-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-foreground font-medium">
                    Password
                  </Label>
                  <a
                    href="#"
                    className="text-sm font-medium text-primary hover:underline transition-all"
                  >
                    Forgot password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 px-4 bg-background border-input focus-visible:ring-primary shadow-sm"
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                id="remember-me"
                onClick={() => setRememberMe(!rememberMe)}
                className={`flex h-5 w-5 items-center justify-center rounded border transition-all ${
                  rememberMe
                    ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                    : 'border-input bg-background hover:bg-muted'
                }`}
              >
                {rememberMe && <Check className="h-3.5 w-3.5" />}
              </button>
              <Label
                htmlFor="remember-me"
                className="text-sm font-normal text-muted-foreground cursor-pointer select-none"
                onClick={() => setRememberMe(!rememberMe)}
              >
                Remember me for 30 days
              </Label>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 border border-destructive/20">
                <p className="text-sm font-medium text-destructive">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 text-base font-medium shadow-sm transition-transform active:scale-[0.98]"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in
            </Button>
          </form>

          <div className="pt-6 border-t border-border mt-8 text-center">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Aetherouxe. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
