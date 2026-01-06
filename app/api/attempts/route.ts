import { NextRequest, NextResponse } from 'next/server';
import { createAttempt, getUserAttempts } from '@/lib/utils/db-helpers';
import { createServerClient } from '@/lib/supabase/server';
import type { Attempt } from '@/types/database';

// POST /api/attempts - Create a new attempt
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { test_id } = body;

    if (!test_id) {
      return NextResponse.json(
        { error: 'Missing required field: test_id' },
        { status: 400 }
      );
    }

    const attempt = await createAttempt(test_id);
    if (!attempt) {
      return NextResponse.json(
        { error: 'Failed to create attempt' },
        { status: 500 }
      );
    }

    return NextResponse.json({ attempt });
  } catch (error) {
    console.error('Error creating attempt:', error);
    return NextResponse.json(
      { error: 'Failed to create attempt' },
      { status: 500 }
    );
  }
}

// GET /api/attempts - Get user's attempts (or all attempts if admin)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'ADMIN';

    let attempts: Attempt[];
    if (isAdmin) {
      // Admin can see all attempts
      const { data, error } = await supabase
        .from('attempts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all attempts:', error);
        return NextResponse.json(
          { error: 'Failed to fetch attempts' },
          { status: 500 }
        );
      }

      attempts = (data || []) as Attempt[];
    } else {
      // Regular users see only their attempts
      attempts = await getUserAttempts();
    }

    return NextResponse.json({ attempts });
  } catch (error) {
    console.error('Error fetching attempts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attempts' },
      { status: 500 }
    );
  }
}

