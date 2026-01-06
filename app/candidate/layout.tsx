import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { LogoutButton } from '@/components/auth/logout-button';

export default async function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user: { id: string; email: string | undefined } | null = null;

  try {
    const supabase = await createServerClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      redirect('/login');
      return;
    }

    user = authUser;

    // Check if user is candidate (or default to candidate if admin check fails)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // If profile query fails, log error but allow access (default to candidate)
    if (profileError) {
      console.error('Profile lookup error in candidate layout:', profileError);
    }

    // If user is admin, redirect to admin dashboard
    if (profile && profile.role === 'ADMIN') {
      redirect('/admin/dashboard');
      return;
    }
  } catch (error) {
    console.error('Error in candidate layout:', error);
    // On any error, redirect to login for safety
    redirect('/login');
    return;
  }

  // If we reach here, user is guaranteed to be set
  if (!user) {
    redirect('/login');
    return;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">kiranprep4EQAO</h1>
              <span className="ml-4 px-3 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">
                Student
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}

