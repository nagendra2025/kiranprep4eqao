import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// This route forces the middleware to run and sync cookies
export async function GET() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get user role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // If profile query fails, log error but don't crash - default to CANDIDATE
    if (profileError) {
      console.error('Profile lookup error in sync route:', profileError);
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      role: profile?.role || 'CANDIDATE',
    });
  } catch (error) {
    console.error('Error in auth sync route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



