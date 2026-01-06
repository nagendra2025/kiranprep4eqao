export type UserRole = 'ADMIN' | 'CANDIDATE';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Test {
  id: string;
  source_question: string;
  source_answer: string;
  source_explanation?: string;
  source_image_url?: string;
  created_by: string;
  created_at: string;
}

export type DifficultyLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface Question {
  id: string;
  test_id: string;
  question_text: string;
  correct_answer: string;
  difficulty_level: DifficultyLevel;
  question_number: number;
  explanation?: string;
  question_image_url?: string;
}

export interface Attempt {
  id: string;
  test_id: string;
  user_id: string;
  submitted_at: string;
  score: number;
}

export interface Response {
  id: string;
  attempt_id: string;
  question_id: string;
  student_answer: string;
  is_correct: boolean;
}

export interface AdminFeedback {
  id: string;
  attempt_id: string;
  feedback_text: string;
  created_at: string;
}



