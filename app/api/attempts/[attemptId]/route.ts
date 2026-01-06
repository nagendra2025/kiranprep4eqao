import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getResponsesByAttemptId } from '@/lib/utils/db-helpers';
import { getAdminFeedbackByAttemptId } from '@/lib/utils/db-helpers';

// GET /api/attempts/[attemptId] - Get attempt details with responses
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { attemptId } = await params;

    // Get attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('attempts')
      .select('*')
      .eq('id', attemptId)
      .single();

    if (attemptError || !attempt) {
      return NextResponse.json(
        { error: 'Attempt not found' },
        { status: 404 }
      );
    }

    // Check if user has access (own attempt or admin)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'ADMIN';
    const isOwner = attempt.user_id === user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Unauthorized: Access denied' },
        { status: 403 }
      );
    }

    // Get responses with question details (including images)
    const { data: responsesData, error: responsesError } = await supabase
      .from('responses')
      .select(`
        *,
        questions:question_id (
          question_text,
          correct_answer,
          question_number,
          question_image_url
        )
      `)
      .eq('attempt_id', attemptId);

    if (responsesError) {
      console.error('Error fetching responses:', responsesError);
    }

    // Format responses to include question details
    const responses = (responsesData || []).map((r: any) => ({
      id: r.id,
      question_id: r.question_id,
      student_answer: r.student_answer,
      is_correct: r.is_correct,
      question_text: r.questions?.question_text,
      correct_answer: r.questions?.correct_answer,
      question_number: r.questions?.question_number,
      question_image_url: r.questions?.question_image_url,
    }));

    // Get admin feedback if exists
    const feedback = await getAdminFeedbackByAttemptId(attemptId);

    return NextResponse.json({
      attempt,
      responses,
      feedback: feedback || null,
    });
  } catch (error) {
    console.error('Error fetching attempt:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attempt' },
      { status: 500 }
    );
  }
}

// DELETE /api/attempts/[attemptId] - Delete an attempt (students can delete their own, admins can delete any)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { attemptId } = await params;

    // Get attempt to check ownership
    const { data: attempt, error: attemptError } = await supabase
      .from('attempts')
      .select('*')
      .eq('id', attemptId)
      .single();

    if (attemptError || !attempt) {
      return NextResponse.json(
        { error: 'Attempt not found' },
        { status: 404 }
      );
    }

    // Check if user has permission (own attempt or admin)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'ADMIN';
    const isOwner = attempt.user_id === user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only delete your own attempts' },
        { status: 403 }
      );
    }

    // Delete related responses first
    const { error: responsesError } = await supabase
      .from('responses')
      .delete()
      .eq('attempt_id', attemptId);

    if (responsesError) {
      console.error('Error deleting responses:', responsesError);
      // Continue even if responses deletion fails
    }

    // Delete admin feedback if exists
    const { error: feedbackError } = await supabase
      .from('admin_feedback')
      .delete()
      .eq('attempt_id', attemptId);

    if (feedbackError) {
      console.error('Error deleting feedback:', feedbackError);
      // Continue even if feedback deletion fails
    }

    // Delete the attempt
    const { error: deleteError } = await supabase
      .from('attempts')
      .delete()
      .eq('id', attemptId);

    if (deleteError) {
      console.error('Error deleting attempt:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete attempt' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Attempt deleted successfully' });
  } catch (error) {
    console.error('Error deleting attempt:', error);
    return NextResponse.json(
      { error: 'Failed to delete attempt' },
      { status: 500 }
    );
  }
}

