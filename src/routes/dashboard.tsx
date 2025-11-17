import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { authStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/dashboard')({
  beforeLoad: () => {
    // Check if user is authenticated
    if (!authStore.isAuthenticated()) {
      // Redirect to login if not authenticated
      throw redirect({
        to: '/',
        search: {
          redirect: '/dashboard'
        }
      });
    }
  },
  component: Dashboard
});

function Dashboard() {
  const navigate = useNavigate();
  const user = authStore.getUser();

  const handleLogout = async () => {
    await authStore.clearAccessToken();
    navigate({ to: '/', search: { redirect: '/dashboard' } });
  };

  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>

        <div className="mb-6 space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Name</p>
            <p className="text-lg font-semibold">
              {user?.name || user?.user_name || 'N/A'}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Email</p>
            <p className="text-lg font-semibold">{user?.email || 'N/A'}</p>
          </div>

          {user?.department && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Department
              </p>
              <p className="text-lg font-semibold">{user.department.name}</p>
            </div>
          )}

          {user?.is_auditor !== undefined && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Role</p>
              <p className="text-lg font-semibold">
                {user.is_auditor ? 'Auditor' : 'User'}
              </p>
            </div>
          )}
        </div>

        <Button onClick={handleLogout} variant="destructive" className="w-full">
          Logout
        </Button>
      </div>
    </div>
  );
}
