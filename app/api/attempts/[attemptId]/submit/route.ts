import { NextRequest, NextResponse } from 'next/server';
import { submitAttempt, getResponsesByAttemptId } from '@/lib/utils/db-helpers';
import { getQuestionsByTestId } from '@/lib/utils/db-helpers';
import { getTest } from '@/lib/utils/db-helpers';
import { evaluateAnswer, calculateScore } from '@/lib/utils/evaluation';
import { createServerClient } from '@/lib/supabase/server';

// POST /api/attempts/[attemptId]/submit - Submit an attempt with answers
export async function POST(
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
    const body = await request.json();
    const { answers } = body; // { questionId: answer }

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json(
        { error: 'Missing or invalid answers object' },
        { status: 400 }
      );
    }

    // Get the attempt to find the test_id
    const { data: attemptData, error: attemptError } = await supabase
      .from('attempts')
      .select('test_id, user_id')
      .eq('id', attemptId)
      .single();

    if (attemptError || !attemptData) {
      return NextResponse.json(
        { error: 'Attempt not found' },
        { status: 404 }
      );
    }

    if (attemptData.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: This is not your attempt' },
        { status: 403 }
      );
    }

    // Get all questions for this test
    const questions = await getQuestionsByTestId(attemptData.test_id);

    // Evaluate each answer and save responses
    const responses = [];
    for (const question of questions) {
      const studentAnswer = answers[question.id] || '';
      const isCorrect = evaluateAnswer(
        studentAnswer,
        question.correct_answer
      );

      const { data: response, error: responseError } = await supabase
        .from('responses')
        .upsert({
          attempt_id: attemptId,
          question_id: question.id,
          student_answer: studentAnswer,
          is_correct: isCorrect,
        })
        .select()
        .single();

      if (!responseError && response) {
        responses.push(response);
      }
    }

    // Calculate score
    const score = calculateScore(responses);

    // Submit the attempt
    const submittedAttempt = await submitAttempt(attemptId, score);

    if (!submittedAttempt) {
      return NextResponse.json(
        { error: 'Failed to submit attempt' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      attempt: submittedAttempt,
      score,
      totalQuestions: questions.length,
      responses: responses.map((r) => ({
        question_id: r.question_id,
        is_correct: r.is_correct,
      })),
    });
  } catch (error) {
    console.error('Error submitting attempt:', error);
    return NextResponse.json(
      { error: 'Failed to submit attempt' },
      { status: 500 }
    );
  }
}



