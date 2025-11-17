import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { GalleryVerticalEnd, Eye, EyeOff } from 'lucide-react';
import { useNavigate, useSearch } from '@tanstack/react-router';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api-client';
import { authStore } from '@/lib/auth-store';
import type { LoginRequest, LoginResponse, User } from '@/types/api';

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const search = useSearch({ from: '/' });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginRequest): Promise<LoginResponse> => {
      // Call login API endpoint
      return api.post<LoginResponse>('/session/authenticate', credentials, {
        skipAuth: true // Skip auth header for login
      });
    },
    onSuccess: (data) => {
      // Extract user data from response
      const userData = data.result;
      const user: User = {
        id: userData.user_id,
        email: email, // Use email from form
        name: userData.user_name,
        user_id: userData.user_id,
        user_name: userData.user_name,
        department: userData.department,
        is_auditor: userData.is_auditor
      };

      // Save token to auth store
      authStore.setAccessToken(userData.access_token, user);
      setError(null);
      // Redirect after successful login
      // Check if there's a redirect parameter, otherwise go to dashboard
      const redirectTo = search?.redirect || '/dashboard';
      navigate({ to: redirectTo });
    },
    onError: (err: Error) => {
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    // Format request according to API specification
    loginMutation.mutate({
      params: {
        db: import.meta.env.VITE_ODOO_DB_NAME,
        login: email,
        password: password
      }
    });
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <a
              href="https://erp.tsicertification.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="flex size-8 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="size-6" />
              </div>
              <span className="sr-only">TSI Certification</span>
            </a>
            <h1 className="text-xl font-bold">
              Welcome to TSI Budget Submission
            </h1>
            <FieldDescription>
              Don&apos;t have an account?{' '}
              <a
                href="https://erp.tsicertification.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Sign up
              </a>
            </FieldDescription>
          </div>
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loginMutation.isPending}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pr-10"
                disabled={loginMutation.isPending}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                disabled={loginMutation.isPending}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </Field>
          <Field>
            <Button type="submit" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? 'Logging in...' : 'Login'}
            </Button>
          </Field>
        </FieldGroup>
      </form>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{' '}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  );
}
