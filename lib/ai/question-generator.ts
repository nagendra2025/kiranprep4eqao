import { openai } from '@/lib/openai/client';
import type { GeneratedQuestion, TestGenerationRequest } from '@/types/ai';
import { detectQuestionType, type QuestionTypeAnalysis } from './question-type-detector';
import { getSystemPromptForType } from './prompt-templates';
import { generateQuestionDiagram, downloadImageAsDataUrl } from './image-generator';

// System prompt is now generated dynamically based on question type
// See getSystemPromptForType() in prompt-templates.ts

export async function generateQuestions(
  request: TestGenerationRequest
): Promise<GeneratedQuestion[]> {
  // Step 1: Detect question type
  const typeAnalysis: QuestionTypeAnalysis = detectQuestionType(
    request.source_question,
    !!request.source_image_url
  );

  console.log('Detected question type:', typeAnalysis.type, 'Concept:', typeAnalysis.concept);

  // Step 2: Get appropriate system prompt for this question type
  const systemPrompt = getSystemPromptForType(typeAnalysis.type, typeAnalysis.hasVisual);

  // Step 3: Extract answer from question if it's embedded
  let extractedAnswer = request.source_answer;
  if (!extractedAnswer || extractedAnswer === 'Extracted from question') {
    const answerMatch = request.source_question.match(/(?:answer|correct answer|solution)[:\s]+([A-Z0-9]+(?:\.[0-9]+)?)/i);
    if (answerMatch) {
      extractedAnswer = answerMatch[1].trim();
    } else {
      // Try to find answer in format like "A) ... B) ... C) ... D) ... Answer: B"
      const mcAnswerMatch = request.source_question.match(/(?:answer|correct|solution)[:\s]+([A-D])/i);
      if (mcAnswerMatch) {
        extractedAnswer = mcAnswerMatch[1].trim();
      }
    }
  }

  // Step 4: Build enhanced user prompt with type-specific instructions
  const imageContext = request.source_image_url 
    ? `\n\nCRITICAL: The source question includes an IMAGE/DIAGRAM. 
- Analyze the visual elements in the image VERY CAREFULLY
- Identify ALL shapes, angles, measurements, labels, and relationships shown
- Understand the EXACT geometric principle or concept demonstrated
- Extract all numerical values and relationships from the diagram
- This visual information is ESSENTIAL for generating appropriate questions`
    : '';

  const varietyInstruction = typeAnalysis.type === 'geometry_with_diagram'
    ? `\n\nCRITICAL - QUESTION VARIETY REQUIREMENT:
You MUST generate questions that ask for DIFFERENT things, not just the same answer with different numbers!

For geometry questions, vary what is being asked:
- Question 1-2: Ask about DIFFERENT angles, lengths, or simple properties (NOT always the same angle!)
- Question 3-4: Ask about areas, perimeters, or other derived quantities
- Question 5-7: Real-world applications asking for different measurements or calculations
- Question 8-10: Complex problems combining multiple concepts

EXAMPLE - If source asks about angle in semicircle:
- Q1: Find the OTHER base angle (not the 90-degree one)
- Q2: Find the arc length or chord length
- Q3: Calculate the area of the triangle
- Q4: Find the radius given certain measurements
- Q5-7: Different real-world scenarios
- Q8-10: Complex multi-step problems

DO NOT make all questions ask for the same thing! Each question should have a UNIQUE answer.`
    : '';

  const userPrompt = `Generate 10 EQAO-style math questions based on the following source question.

THIS IS THE CORE VALUE PROPOSITION: You must deeply understand the source question's concept and generate 10 questions that all use that SAME concept with progressive difficulty AND VARIED ANSWERS.

DETECTED QUESTION TYPE: ${typeAnalysis.type.toUpperCase()}
CORE CONCEPT: ${typeAnalysis.concept}
${typeAnalysis.keywords.length > 0 ? `KEYWORDS: ${typeAnalysis.keywords.join(', ')}` : ''}

STEP 1: ANALYZE THE SOURCE QUESTION CAREFULLY
SOURCE QUESTION (may include multiple choice answers):
${request.source_question}
${imageContext}
${varietyInstruction}

THIS IS THE CORE VALUE PROPOSITION: You must deeply understand the source question's concept and generate 10 questions that all use that SAME concept with progressive difficulty.

STEP 1: ANALYZE THE SOURCE QUESTION CAREFULLY
SOURCE QUESTION (may include multiple choice answers):
${request.source_question}
${imageContext}

${extractedAnswer && extractedAnswer !== 'Extracted from question' ? `SOURCE ANSWER:\n${extractedAnswer}` : 'Note: The correct answer should be extracted from the source question above.'}

${request.explanation ? `SOURCE EXPLANATION:\n${request.explanation}` : ''}

CRITICAL ANALYSIS REQUIRED:
1. What is the CORE mathematical concept in this source question? (e.g., squaring fractions, solving equations, calculating areas, working with angles in triangles, etc.)
2. What formula or method is being used? (Identify the exact mathematical operation/formula)
3. What is the mathematical topic? (e.g., fractions, algebra, geometry, number operations, etc.)
4. What is the calculation pattern? (How is the answer derived?)
5. ${request.source_image_url ? 'What visual elements are present? (diagrams, graphs, tables, shapes, angles, measurements, etc.)' : ''}

STEP 2: GENERATE 10 QUESTIONS USING THE SAME CONCEPT
ALL 10 questions MUST use the EXACT same concept, formula, and method you identified in Step 1.
${request.source_image_url ? 'For geometry/visual questions: Each question should describe a DIFFERENT diagram/scenario but use the SAME core concept (e.g., different triangles with different angles, but all involving the same geometric principle).' : ''}

CRITICAL REQUIREMENTS - THIS IS THE UNIQUE SELLING POINT - READ CAREFULLY:

BEFORE GENERATING QUESTIONS, YOU MUST:

1. DEEPLY ANALYZE THE SOURCE QUESTION:
   - Read the source question multiple times to understand it completely
   - Identify the CORE mathematical concept (e.g., squaring fractions, solving linear equations, calculating areas, working with percentages, ratios, exponents, etc.)
   - Identify the EXACT formula or method being used
   - Identify the mathematical topic/domain
   - Understand the calculation pattern
   - This analysis is CRITICAL - it determines the consistency of all 10 questions

2. CONCEPT EXTRACTION (MOST IMPORTANT):
   - The source question could be ANY type of math problem
   - You must extract and understand the fundamental concept/formula
   - Examples:
     * Source: "What is (-7/4)^2?" → Concept: Squaring fractions → ALL 10 questions must involve squaring fractions
     * Source: "Solve 2x + 5 = 13" → Concept: Solving linear equations → ALL 10 questions must involve solving linear equations
     * Source: "Area of rectangle with length 5 and width 3" → Concept: Area = length × width → ALL 10 questions must use this formula
     * Source: "What is 25% of 80?" → Concept: Percentage calculations → ALL 10 questions must involve percentages
   - The concept you identify MUST be used consistently across ALL 10 questions

3. Generate exactly 10 questions, numbered 1 through 10
4. ALL questions MUST use the EXACT same mathematical concept, formula, and calculation method you identified in step 1
5. Difficulty progression MUST follow this EXACT structure (MANDATORY):
   
   QUESTIONS 1-2: VERY EASY
   - Direct, straightforward application of the source concept
   - Simple numbers, easy substitution
   - NO word problems - just direct calculation
   - Example format: "What is the value of (2/3)^2?" or "Calculate (-1/4)^2"
   
   QUESTIONS 3-4: MEDIUM
   - Same concept with slightly more complex numbers
   - May require one additional computational step
   - NO word problems - still direct application
   - Example format: "Find the value of ((-5/7)^2)" or "What is (-3/8)^2?"
   
   QUESTIONS 5-7: TOUGH (MUST BE WORD PROBLEMS)
   - MUST be application-oriented word problems with real-world scenarios
   - MUST use the same concept from the source question
   - Real-world contexts: areas, volumes, scaling, measurements, etc.
   - Multi-step reasoning required
   - Example format: "A square tile has a side length of (-2/5) meters. What is the area of the tile?"
   
   QUESTIONS 8-10: MORE TOUGH (MUST BE COMPLEX WORD PROBLEMS)
   - MUST be highly complex application-oriented word problems
   - MUST use the same concept from the source question
   - Complex real-world scenarios with multiple steps
   - Maximum complexity while staying true to source concept
   - Example format: "A photograph is enlarged so that its new dimensions are (-3/4) times the original. If the original area was 64 square centimeters, what is the area of the enlarged photograph?"

4. MANDATORY: Questions 5-10 MUST be word problems - NO exceptions
5. Complexity increases through: harder numbers, multi-step reasoning, real-world application - NOT by changing the core concept
6. Each question must have a clear, correct answer in plain text format
7. Include explanations for questions 5-10 (application-oriented questions need explanations)
8. If the source question includes multiple choice answers, extract the correct answer from it
9. CRITICAL: Write all mathematical expressions in plain text - use (a/b) for fractions, x^2 for exponents, sqrt(x) for square roots
10. DO NOT use any LaTeX syntax, escape sequences, or special formatting commands
11. All text must be readable as plain English with standard mathematical notation
12. Analyze the source question carefully to identify the core mathematical concept/formula, then ensure ALL 10 questions use that same concept
13. IMPORTANT: Set difficulty_level in JSON as: 1-2 for questions 1-2, 3-4 for questions 3-4, 5-7 for questions 5-7, 8-10 for questions 8-10

Return the response as a JSON object with a "questions" array with this exact structure:
{
  "questions": [
    {
      "question_number": 1,
      "question_text": "Full question text here...",
      "correct_answer": "The correct answer",
      "difficulty_level": 1,
      "explanation": "Optional explanation"
    },
    {
      "question_number": 2,
      "question_text": "Full question text here...",
      "correct_answer": "The correct answer",
      "difficulty_level": 2,
      "explanation": "Optional explanation"
    },
    {
      "question_number": 3,
      "question_text": "Full question text here...",
      "correct_answer": "The correct answer",
      "difficulty_level": 3,
      "explanation": "Optional explanation"
    },
    {
      "question_number": 4,
      "question_text": "Full question text here...",
      "correct_answer": "The correct answer",
      "difficulty_level": 4,
      "explanation": "Optional explanation"
    },
    {
      "question_number": 5,
      "question_text": "Application-oriented word problem here...",
      "correct_answer": "The correct answer",
      "difficulty_level": 5,
      "explanation": "Explanation required"
    },
    {
      "question_number": 6,
      "question_text": "Application-oriented word problem here...",
      "correct_answer": "The correct answer",
      "difficulty_level": 6,
      "explanation": "Explanation required"
    },
    {
      "question_number": 7,
      "question_text": "Application-oriented word problem here...",
      "correct_answer": "The correct answer",
      "difficulty_level": 7,
      "explanation": "Explanation required"
    },
    {
      "question_number": 8,
      "question_text": "Highly complex application-oriented word problem here...",
      "correct_answer": "The correct answer",
      "difficulty_level": 8,
      "explanation": "Explanation required"
    },
    {
      "question_number": 9,
      "question_text": "Highly complex application-oriented word problem here...",
      "correct_answer": "The correct answer",
      "difficulty_level": 9,
      "explanation": "Explanation required"
    },
    {
      "question_number": 10,
      "question_text": "Highly complex application-oriented word problem here...",
      "correct_answer": "The correct answer",
      "difficulty_level": 10,
      "explanation": "Explanation required"
    }
  ]
}

CRITICAL REQUIREMENTS:
1. Set difficulty_level exactly as shown above (1-2 for questions 1-2, 3-4 for questions 3-4, 5-7 for questions 5-7, 8-10 for questions 8-10).
2. Questions 5-10 MUST be word problems with real-world application scenarios.
3. **MOST IMPORTANT**: Each question must have a DIFFERENT answer! Do NOT make all questions have the same answer (like all being 90 degrees). Vary what is being asked:
   - For geometry: Ask for different angles, lengths, areas, perimeters, etc.
   - For algebra: Different variable values
   - For other topics: Different numerical results
4. Ensure the JSON is valid and parseable. Include exactly 10 questions in the array.
5. For geometry questions: Each question should describe a UNIQUE diagram with different measurements and ask for different quantities.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // Using latest GPT-4 model
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8, // Slightly higher for more variety
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    const parsed = JSON.parse(content);
    
    // Handle both { questions: [...] } and direct array formats
    // OpenAI with json_object format typically returns { questions: [...] }
    const questions = parsed.questions || (Array.isArray(parsed) ? parsed : []);
    
    if (!Array.isArray(questions) || questions.length !== 10) {
      throw new Error(`Expected 10 questions, got ${questions.length}`);
    }

    // Clean LaTeX sequences from questions
    const cleanLaTeX = (text: string): string => {
      if (!text) return text;
      return text
        // Remove LaTeX delimiters
        .replace(/\\\(/g, '')
        .replace(/\\\)/g, '')
        .replace(/\\\[/g, '')
        .replace(/\\\]/g, '')
        // Convert LaTeX fractions to plain text
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
        // Remove LaTeX commands
        .replace(/\\left\(/g, '(')
        .replace(/\\right\)/g, ')')
        .replace(/\\left\[/g, '[')
        .replace(/\\right\]/g, ']')
        .replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)')
        .replace(/\\sqrt\[([^\]]+)\]\{([^}]+)\}/g, 'sqrt[$1]($2)')
        // Remove text commands
        .replace(/\\text\{([^}]+)\}/g, '$1')
        // Clean up extra backslashes
        .replace(/\\{/g, '{')
        .replace(/\\}/g, '}')
        .replace(/\\\\/g, '')
        // Remove remaining backslashes before special chars
        .replace(/\\([()\[\]])/g, '$1')
        // Clean up multiple spaces
        .replace(/\s+/g, ' ')
        .trim();
    };

    // Map difficulty levels based on new structure:
    // Questions 1-2: Very Easy (level 1-2)
    // Questions 3-4: Medium (level 3-4)
    // Questions 5-7: Tough (level 5-7)
    // Questions 8-10: More Tough (level 8-10)
    const getDifficultyLevel = (questionNumber: number): 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 => {
      if (questionNumber <= 2) return questionNumber as 1 | 2;
      if (questionNumber <= 4) return questionNumber as 3 | 4;
      if (questionNumber <= 7) return questionNumber as 5 | 6 | 7;
      return questionNumber as 8 | 9 | 10;
    };

    // Validate and format questions - FORCE correct difficulty levels based on question number
    // Generate images for geometry questions (with timeout to prevent blocking)
    const formattedQuestions: GeneratedQuestion[] = await Promise.all(
      questions.map(async (q: any, index: number) => {
        const questionNumber = q.question_number || index + 1;
        // ALWAYS use the correct difficulty level based on question number, ignore AI's difficulty_level
        const correctDifficultyLevel = getDifficultyLevel(questionNumber);
        
        const questionText = cleanLaTeX(q.question_text || q.question || '');
        
        // Generate simple 2D diagrams for ALL geometry questions that need visuals
        let questionImageUrl: string | undefined;
        // Generate images for geometry questions - check if question mentions geometric shapes
        const hasGeometryKeywords = questionText.toLowerCase().match(/(semicircle|triangle|circle|angle|diameter|radius|inscribed)/);
        const needsImage = typeAnalysis.type === 'geometry_with_diagram' || 
                          (typeAnalysis.hasVisual) ||
                          (hasGeometryKeywords && questionNumber <= 7); // Generate for first 7 questions to avoid too many API calls
        
        if (needsImage) {
          try {
            console.log(`Generating image for question ${questionNumber}...`);
            // Generate image with reasonable timeout
            const imageUrl = await Promise.race([
              generateQuestionDiagram(
                questionNumber,
                questionText,
                typeAnalysis.concept,
                typeAnalysis.type
              ),
              new Promise<string | undefined>((resolve) => 
                setTimeout(() => {
                  console.warn(`Image generation timeout for question ${questionNumber} - skipping`);
                  resolve(undefined);
                }, 25000) // 25 second timeout - DALL-E can take 15-20 seconds
              )
            ]) as string | undefined;
            
            if (imageUrl) {
              console.log(`Image generated for question ${questionNumber}, downloading...`);
              // Download and convert to data URL (with timeout)
              try {
                questionImageUrl = await Promise.race([
                  downloadImageAsDataUrl(imageUrl),
                  new Promise<string>((_, reject) => 
                    setTimeout(() => reject(new Error('Download timeout')), 15000) // 15 second timeout
                  )
                ]) as string;
                console.log(`Image downloaded and saved for question ${questionNumber}`);
              } catch (err) {
                console.warn(`Failed to download image for question ${questionNumber}:`, err);
                questionImageUrl = imageUrl; // Fallback to URL (will expire but better than nothing)
              }
            } else {
              console.warn(`No image URL returned for question ${questionNumber}`);
            }
          } catch (err) {
            console.error(`Error generating image for question ${questionNumber}:`, err);
            // Continue without image - don't block question generation
          }
        } else {
          console.log(`Skipping image generation for question ${questionNumber} - type: ${typeAnalysis.type}, hasVisual: ${typeAnalysis.hasVisual}`);
        }
        
        return {
          question_number: questionNumber,
          question_text: questionText,
          correct_answer: cleanLaTeX(q.correct_answer || q.answer || ''),
          difficulty_level: correctDifficultyLevel, // Force correct difficulty level
          explanation: q.explanation ? cleanLaTeX(q.explanation) : undefined,
          question_image_url: questionImageUrl,
        };
      })
    );

    // Validate all required fields
    for (const q of formattedQuestions) {
      if (!q.question_text || !q.correct_answer) {
        throw new Error('Invalid question format: missing required fields');
      }
    }

    // Check for answer variety - warn if too many answers are the same
    const answers = formattedQuestions.map(q => q.correct_answer.trim().toLowerCase());
    const uniqueAnswers = new Set(answers);
    if (uniqueAnswers.size < 5) {
      console.warn(`Warning: Only ${uniqueAnswers.size} unique answers out of 10 questions. Answers may be too similar.`);
      console.warn('Answers:', Array.from(uniqueAnswers));
    }

    return formattedQuestions;
  } catch (error) {
    console.error('Error generating questions:', error);
    throw new Error(
      `Failed to generate questions: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

