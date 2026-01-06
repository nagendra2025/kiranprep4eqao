import { createServerClient } from '@/lib/supabase/server';
import type {
  Test,
  Question,
  Attempt,
  Response,
  AdminFeedback,
} from '@/types/database';

// Test helpers
export async function createTest(
  sourceQuestion: string,
  sourceAnswer: string,
  sourceExplanation?: string,
  sourceImageUrl?: string
): Promise<Test | null> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('tests')
      .insert({
        source_question: sourceQuestion,
        source_answer: sourceAnswer,
        source_explanation: sourceExplanation,
        source_image_url: sourceImageUrl,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating test:', error);
      return null;
    }

    return data as Test;
  } catch (error) {
    console.error('Error creating test:', error);
    return null;
  }
}

export async function getTest(testId: string): Promise<Test | null> {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('tests')
      .select('*')
      .eq('id', testId)
      .single();

    if (error) {
      console.error('Error fetching test:', error);
      return null;
    }

    return data as Test;
  } catch (error) {
    console.error('Error fetching test:', error);
    return null;
  }
}

export async function getAllTests(): Promise<Test[]> {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('tests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tests:', error);
      return [];
    }

    return (data || []) as Test[];
  } catch (error) {
    console.error('Error fetching tests:', error);
    return [];
  }
}

// Question helpers
export async function createQuestions(
  testId: string,
  questions: Array<{
    question_number: number;
    question_text: string;
    correct_answer: string;
    difficulty_level: number;
    explanation?: string;
    question_image_url?: string;
  }>
): Promise<Question[]> {
  try {
    const supabase = await createServerClient();
    const questionsToInsert = questions.map((q) => ({
      test_id: testId,
      ...q,
    }));

    const { data, error } = await supabase
      .from('questions')
      .insert(questionsToInsert)
      .select();

    if (error) {
      console.error('Error creating questions:', error);
      return [];
    }

    return (data || []) as Question[];
  } catch (error) {
    console.error('Error creating questions:', error);
    return [];
  }
}

export async function getQuestionsByTestId(testId: string): Promise<Question[]> {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('test_id', testId)
      .order('question_number', { ascending: true });

    if (error) {
      console.error('Error fetching questions:', error);
      return [];
    }

    return (data || []) as Question[];
  } catch (error) {
    console.error('Error fetching questions:', error);
    return [];
  }
}

// Attempt helpers
export async function createAttempt(testId: string): Promise<Attempt | null> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('attempts')
      .insert({
        test_id: testId,
        user_id: user.id,
        score: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating attempt:', error);
      return null;
    }

    return data as Attempt;
  } catch (error) {
    console.error('Error creating attempt:', error);
    return null;
  }
}

export async function submitAttempt(
  attemptId: string,
  score: number
): Promise<Attempt | null> {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('attempts')
      .update({
        submitted_at: new Date().toISOString(),
        score,
      })
      .eq('id', attemptId)
      .select()
      .single();

    if (error) {
      console.error('Error submitting attempt:', error);
      return null;
    }

    return data as Attempt;
  } catch (error) {
    console.error('Error submitting attempt:', error);
    return null;
  }
}

export async function getUserAttempts(userId?: string): Promise<Attempt[]> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const targetUserId = userId || user?.id;
    if (!targetUserId) {
      return [];
    }

    const { data, error } = await supabase
      .from('attempts')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching attempts:', error);
      return [];
    }

    return (data || []) as Attempt[];
  } catch (error) {
    console.error('Error fetching attempts:', error);
    return [];
  }
}

// Response helpers
export async function saveResponse(
  attemptId: string,
  questionId: string,
  studentAnswer: string,
  isCorrect: boolean
): Promise<Response | null> {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('responses')
      .upsert({
        attempt_id: attemptId,
        question_id: questionId,
        student_answer: studentAnswer,
        is_correct: isCorrect,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving response:', error);
      return null;
    }

    return data as Response;
  } catch (error) {
    console.error('Error saving response:', error);
    return null;
  }
}

export async function getResponsesByAttemptId(
  attemptId: string
): Promise<Response[]> {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('responses')
      .select('*')
      .eq('attempt_id', attemptId);

    if (error) {
      console.error('Error fetching responses:', error);
      return [];
    }

    return (data || []) as Response[];
  } catch (error) {
    console.error('Error fetching responses:', error);
    return [];
  }
}

// Admin feedback helpers
export async function createAdminFeedback(
  attemptId: string,
  feedbackText: string
): Promise<AdminFeedback | null> {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('admin_feedback')
      .insert({
        attempt_id: attemptId,
        feedback_text: feedbackText,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating admin feedback:', error);
      return null;
    }

    return data as AdminFeedback;
  } catch (error) {
    console.error('Error creating admin feedback:', error);
    return null;
  }
}

export async function getAdminFeedbackByAttemptId(
  attemptId: string
): Promise<AdminFeedback | null> {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('admin_feedback')
      .select('*')
      .eq('attempt_id', attemptId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No feedback found
        return null;
      }
      console.error('Error fetching admin feedback:', error);
      return null;
    }

    return data as AdminFeedback;
  } catch (error) {
    console.error('Error fetching admin feedback:', error);
    return null;
  }
}



