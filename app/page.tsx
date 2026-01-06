import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';

export default async function Home() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      redirect('/login');
      return;
    }

    // Get user role from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      // If profile doesn't exist, default to candidate
      redirect('/candidate/dashboard');
      return;
    }

    // Redirect based on role
    if (profile.role === 'ADMIN') {
      redirect('/admin/dashboard');
    } else {
      redirect('/candidate/dashboard');
    }
  } catch (err) {
    // On any error, redirect to login
    redirect('/login');
  }
}
