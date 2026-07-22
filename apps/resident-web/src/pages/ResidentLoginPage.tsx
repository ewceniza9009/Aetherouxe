import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '@elite-realty/shared-ui/hooks';
import { Button } from '@elite-realty/shared-ui/components/ui';
import { Input } from '@elite-realty/shared-ui/components/ui';
import { Label } from '@elite-realty/shared-ui/components/ui';
import { Building2, Loader2 } from 'lucide-react';

interface ResidentLoginPageProps {
  portalName?: string;
  placeholderEmail?: string;
}

export function ResidentLoginPage({
  portalName = 'Resident',
  placeholderEmail = 'resident1@elite-realty.com',
}: ResidentLoginPageProps) {
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
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="flex flex-col items-center space-y-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg">
            <Building2 className="h-6 w-6 text-primary-foreground" />
          </div>

          <div className="space-y-1 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Aetherouxe</h1>
            <p className="text-sm text-muted-foreground">Sign in to the {portalName} Portal</p>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-5">
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
                  className="h-11 px-4 bg-background border-input focus-visible:ring-primary"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-foreground font-medium">
                    Password
                  </Label>
                  <a href="#" className="text-sm font-medium text-primary hover:underline">
                    Forgot password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 px-4 bg-background border-input focus-visible:ring-primary"
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
              />
              <Label
                htmlFor="remember-me"
                className="text-sm font-normal text-muted-foreground cursor-pointer select-none"
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
              className="w-full h-11 text-base font-medium shadow-sm"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in
            </Button>
          </form>

          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Aetherouxe. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
