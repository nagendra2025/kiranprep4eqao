export interface GeneratedQuestion {
  question_number: number;
  question_text: string;
  correct_answer: string;
  difficulty_level: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  explanation?: string;
  question_image_url?: string; // For generated diagrams/images
}

export interface TestGenerationRequest {
  source_question: string;
  source_answer: string;
  explanation?: string;
  source_image_url?: string; // Source question image
}

export interface TestGenerationResponse {
  questions: GeneratedQuestion[];
}



