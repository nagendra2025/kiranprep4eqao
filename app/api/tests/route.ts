import { NextRequest, NextResponse } from 'next/server';
import { getAllTests, getTest } from '@/lib/utils/db-helpers';
import { createServerClient } from '@/lib/supabase/server';

// GET /api/tests - Get all tests
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const testId = searchParams.get('id');

    if (testId) {
      // Get single test
      const test = await getTest(testId);
      if (!test) {
        return NextResponse.json({ error: 'Test not found' }, { status: 404 });
      }
      return NextResponse.json({ test });
    }

    // Get all tests
    const tests = await getAllTests();
    return NextResponse.json({ tests });
  } catch (error) {
    console.error('Error fetching tests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tests' },
      { status: 500 }
    );
  }
}



