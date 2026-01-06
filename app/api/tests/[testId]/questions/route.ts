import { NextRequest, NextResponse } from 'next/server';
import { getQuestionsByTestId } from '@/lib/utils/db-helpers';
import { createServerClient } from '@/lib/supabase/server';

// GET /api/tests/[testId]/questions - Get questions for a test
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { testId } = await params;
    const questions = await getQuestionsByTestId(testId);

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}



