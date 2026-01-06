-- Add image support to tests table
ALTER TABLE tests 
ADD COLUMN IF NOT EXISTS source_image_url TEXT;

-- Add image support to questions table  
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS question_image_url TEXT;

