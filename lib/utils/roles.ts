import { createServerClient } from '@/lib/supabase/server';
import type { UserRole } from '@/types/database';

export async function getUserRole(): Promise<UserRole | null> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      return null;
    }

    return profile.role as UserRole;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

export async function isAdmin(): Promise<boolean> {
  const role = await getUserRole();
  return role === 'ADMIN';
}

export async function isCandidate(): Promise<boolean> {
  const role = await getUserRole();
  return role === 'CANDIDATE';
}



