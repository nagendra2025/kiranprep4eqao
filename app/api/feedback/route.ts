import { NextRequest, NextResponse } from 'next/server';
import { createAdminFeedback } from '@/lib/utils/db-helpers';
import { isAdmin } from '@/lib/utils/roles';

// POST /api/feedback - Create admin feedback for an attempt
export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { attempt_id, feedback_text } = body;

    if (!attempt_id || !feedback_text) {
      return NextResponse.json(
        { error: 'Missing required fields: attempt_id and feedback_text' },
        { status: 400 }
      );
    }

    if (feedback_text.trim().length < 5) {
      return NextResponse.json(
        { error: 'Feedback must be at least 5 characters long' },
        { status: 400 }
      );
    }

    if (feedback_text.length > 2000) {
      return NextResponse.json(
        { error: 'Feedback is too long (max 2000 characters)' },
        { status: 400 }
      );
    }

    const feedback = await createAdminFeedback(attempt_id, feedback_text);

    if (!feedback) {
      return NextResponse.json(
        { error: 'Failed to create feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Error creating feedback:', error);
    return NextResponse.json(
      { error: 'Failed to create feedback' },
      { status: 500 }
    );
  }
}

