-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends Supabase auth.users)
-- Note: We'll use Supabase auth.users and create a profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'CANDIDATE')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create tests table
CREATE TABLE IF NOT EXISTS tests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  source_question TEXT NOT NULL,
  source_answer TEXT NOT NULL,
  source_explanation TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  test_id UUID REFERENCES tests(id) ON DELETE CASCADE NOT NULL,
  question_number INTEGER NOT NULL CHECK (question_number >= 1 AND question_number <= 10),
  question_text TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  difficulty_level INTEGER NOT NULL CHECK (difficulty_level >= 1 AND difficulty_level <= 10),
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(test_id, question_number)
);

-- Create attempts table
CREATE TABLE IF NOT EXISTS attempts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  test_id UUID REFERENCES tests(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE,
  score INTEGER DEFAULT 0 CHECK (score >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(test_id, user_id, created_at)
);

-- Create responses table
CREATE TABLE IF NOT EXISTS responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  attempt_id UUID REFERENCES attempts(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  student_answer TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(attempt_id, question_id)
);

-- Create admin_feedback table
CREATE TABLE IF NOT EXISTS admin_feedback (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  attempt_id UUID REFERENCES attempts(id) ON DELETE CASCADE NOT NULL,
  feedback_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tests_created_by ON tests(created_by);
CREATE INDEX IF NOT EXISTS idx_questions_test_id ON questions(test_id);
CREATE INDEX IF NOT EXISTS idx_attempts_test_id ON attempts(test_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user_id ON attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_responses_attempt_id ON responses(attempt_id);
CREATE INDEX IF NOT EXISTS idx_responses_question_id ON responses(question_id);
CREATE INDEX IF NOT EXISTS idx_admin_feedback_attempt_id ON admin_feedback(attempt_id);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for tests
-- Admins can do everything, candidates can only view
CREATE POLICY "Admins can manage all tests"
  ON tests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
    )
  );

CREATE POLICY "Candidates can view tests"
  ON tests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'CANDIDATE'
    )
  );

-- RLS Policies for questions
-- Everyone can view questions for tests they have access to
CREATE POLICY "Users can view questions for accessible tests"
  ON questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tests
      WHERE tests.id = questions.test_id
      AND (
        tests.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Admins can manage questions"
  ON questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
    )
  );

-- RLS Policies for attempts
-- Users can view their own attempts, admins can view all
CREATE POLICY "Users can view their own attempts"
  ON attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all attempts"
  ON attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
    )
  );

CREATE POLICY "Candidates can create attempts"
  ON attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Candidates can update their own attempts"
  ON attempts FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for responses
-- Users can view responses for their own attempts
CREATE POLICY "Users can view responses for their own attempts"
  ON responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM attempts
      WHERE attempts.id = responses.attempt_id
      AND attempts.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all responses"
  ON responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
    )
  );

CREATE POLICY "Candidates can create responses"
  ON responses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM attempts
      WHERE attempts.id = responses.attempt_id
      AND attempts.user_id = auth.uid()
    )
  );

CREATE POLICY "Candidates can update responses for their own attempts"
  ON responses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM attempts
      WHERE attempts.id = responses.attempt_id
      AND attempts.user_id = auth.uid()
    )
  );

-- RLS Policies for admin_feedback
-- Users can view feedback for their own attempts
CREATE POLICY "Users can view feedback for their own attempts"
  ON admin_feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM attempts
      WHERE attempts.id = admin_feedback.attempt_id
      AND attempts.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage feedback"
  ON admin_feedback FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
    )
  );

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    'CANDIDATE' -- Default role, can be changed by admin
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tests_updated_at
  BEFORE UPDATE ON tests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_feedback_updated_at
  BEFORE UPDATE ON admin_feedback
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();



