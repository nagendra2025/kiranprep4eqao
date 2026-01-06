import { NextRequest, NextResponse } from 'next/server';
import { generateQuestions } from '@/lib/ai/question-generator';
import { createTest, createQuestions } from '@/lib/utils/db-helpers';
import { isAdmin } from '@/lib/utils/roles';
import { openai } from '@/lib/openai/client';

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

    // Parse request body (could be JSON or FormData)
    const contentType = request.headers.get('content-type') || '';
    let source_question: string;
    let source_answer: string | undefined;
    let explanation: string | undefined;
    let source_image_url: string | undefined;
    let input_type: 'text' | 'image' = 'text';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      input_type = (formData.get('input_type') as 'text' | 'image') || 'text';
      
      if (input_type === 'image') {
        const imageFile = formData.get('image') as File;
        if (!imageFile) {
          return NextResponse.json(
            { error: 'Missing image file' },
            { status: 400 }
          );
        }

        // Convert image to base64 for OpenAI Vision API and storage
        const arrayBuffer = await imageFile.arrayBuffer();
        const base64Image = Buffer.from(arrayBuffer).toString('base64');
        const mimeType = imageFile.type;
        
        // Store image as data URL for later display
        source_image_url = `data:${mimeType};base64,${base64Image}`;

        // Use OpenAI Vision API to extract text from image with enhanced prompt
        const visionResponse = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Extract the COMPLETE question text and all multiple choice answers from this image. 
                  
IMPORTANT:
1. Extract ALL text visible in the image, including the question statement, all answer choices (A, B, C, D, etc.), and any diagrams/figures descriptions
2. If there is a diagram, graph, table, or visual element, describe it in detail in your response
3. Include the question exactly as it appears, preserving all mathematical notation
4. If the correct answer is indicated, include that as well
5. Describe any geometric shapes, angles, measurements, or visual elements that are part of the question

Format your response as:
Question: [full question text]
A) [answer choice A]
B) [answer choice B]
C) [answer choice C]
D) [answer choice D]
Answer: [correct answer if visible]

If there are diagrams or visual elements, describe them clearly in the question text.`,
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: source_image_url,
                  },
                },
              ],
            },
          ],
          max_tokens: 2000,
        });

        source_question = visionResponse.choices[0]?.message?.content || '';
        if (!source_question || source_question.trim().length < 10) {
          return NextResponse.json(
            { error: 'Could not extract sufficient text from image. Please try a clearer image or use text input.' },
            { status: 400 }
          );
        }
      } else {
        source_question = (formData.get('source_question') as string) || '';
      }
      
      explanation = (formData.get('explanation') as string) || undefined;
    } else {
      // JSON request (backward compatibility)
      const body = await request.json();
      source_question = body.source_question;
      source_answer = body.source_answer;
      explanation = body.explanation;
    }

    // Validate input
    if (!source_question || source_question.trim().length < 10) {
      return NextResponse.json(
        { error: 'Source question must be at least 10 characters long' },
        { status: 400 }
      );
    }

    if (source_question.length > 10000) {
      return NextResponse.json(
        { error: 'Source question is too long (max 10000 characters)' },
        { status: 400 }
      );
    }

    // Extract answer from question text if not provided
    // The question text should contain the answer (e.g., "Answer: B" or "Correct answer: 42")
    if (!source_answer) {
      // Try multiple patterns to extract answer
      let answerMatch = source_question.match(/(?:answer|correct answer|solution)[:\s]+([A-Z0-9]+(?:\.[0-9]+)?)/i);
      if (!answerMatch) {
        // Try format like "A) ... B) ... Answer: B"
        answerMatch = source_question.match(/(?:answer|correct|solution)[:\s]+([A-D])/i);
      }
      if (!answerMatch) {
        // Try to find answer at the end like "The answer is 42"
        answerMatch = source_question.match(/(?:answer|correct|solution)\s+(?:is|are)[:\s]+([A-Z0-9]+(?:\.[0-9]+)?)/i);
      }
      source_answer = answerMatch ? answerMatch[1].trim() : 'See question text';
    }

    // Ensure we have a valid answer (database requires NOT NULL)
    if (!source_answer || source_answer.trim().length === 0) {
      source_answer = 'See question text';
    }

    if (source_answer.length > 500) {
      return NextResponse.json(
        { error: 'Source answer is too long (max 500 characters)' },
        { status: 400 }
      );
    }

    // Generate questions using AI - pass image URL if available
    const generatedQuestions = await generateQuestions({
      source_question,
      source_answer: source_answer || 'Extracted from question',
      explanation,
      source_image_url, // Pass image URL to AI for context
    });

    // Create test in database with image URL
    const test = await createTest(
      source_question, 
      source_answer || 'Extracted from question', 
      explanation,
      source_image_url
    );
    if (!test) {
      return NextResponse.json(
        { error: 'Failed to create test in database' },
        { status: 500 }
      );
    }

    // Save generated questions to database (including image URLs if generated)
    const questions = await createQuestions(
      test.id,
      generatedQuestions.map((q) => ({
        question_number: q.question_number,
        question_text: q.question_text,
        correct_answer: q.correct_answer,
        difficulty_level: q.difficulty_level,
        explanation: q.explanation,
        question_image_url: q.question_image_url, // Include image URL if AI generated diagrams
      }))
    );

    if (questions.length !== 10) {
      return NextResponse.json(
        { error: 'Failed to save all questions to database' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      test: {
        id: test.id,
        created_at: test.created_at,
      },
      questions: questions.map((q) => ({
        id: q.id,
        question_number: q.question_number,
        difficulty_level: q.difficulty_level,
      })),
    });
  } catch (error) {
    console.error('Error generating test:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to generate test';
    if (error instanceof Error) {
      if (error.message.includes('OpenAI') || error.message.includes('API')) {
        errorMessage = 'AI service error. Please check your API configuration and try again.';
      } else if (error.message.includes('database') || error.message.includes('Supabase')) {
        errorMessage = 'Database error. Please try again later.';
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

