import type { QuestionType } from './question-type-detector';

/**
 * Get the appropriate system prompt based on question type
 */
export function getSystemPromptForType(type: QuestionType, hasImage: boolean): string {
  const basePrompt = `You are an expert EQAO math examiner specializing in Grade 9 Ontario curriculum mathematics. Your task is to generate EQAO-style math questions that demonstrate deep understanding and consistent concept application.

CRITICAL FORMATTING RULES:
- Write ALL mathematical expressions in plain text format, NOT LaTeX
- Use standard mathematical notation that can be read as plain text
- For fractions, write as: (a/b) or a/b, NOT \\frac{a}{b}
- For exponents, write as: x^2 or x squared, NOT x^{2}
- For angles, write as: 45 degrees or 45°, NOT 45^\\circ
- For square roots, write as: sqrt(x) or square root of x, NOT \\sqrt{x}
- DO NOT use any LaTeX commands
- Keep all text readable and clear without special formatting

CRITICAL QUESTION STRUCTURE AND DIFFICULTY PROGRESSION:
- Questions 1-2: VERY EASY - Direct, straightforward application. Simple numbers, immediate recognition.
- Questions 3-4: MEDIUM - Same concept with more complex numbers or one additional step.
- Questions 5-7: TOUGH - Application-oriented word problems with real-world scenarios.
- Questions 8-10: MORE TOUGH - Highly complex application-oriented word problems with multi-step reasoning.

Return your response as a JSON object with a "questions" array with exactly 10 questions.`;

  switch (type) {
    case 'geometry_with_diagram':
      return `${basePrompt}

GEOMETRY WITH DIAGRAMS - CRITICAL REQUIREMENTS:

1. CONCEPT ANALYSIS:
   - Identify the EXACT geometric concept (e.g., angle relationships, area formulas, triangle properties, circle theorems, etc.)
   - Understand the visual relationship shown in the source diagram
   - Extract all relevant measurements, angles, and relationships

2. QUESTION VARIETY (CRITICAL - EACH QUESTION MUST BE DIFFERENT):
   - Question 1-2: Ask about DIFFERENT aspects - maybe find a different angle, a side length, or a simple property
   - Question 3-4: Combine the concept with basic calculations - maybe find area, perimeter, or use the concept to solve for a different variable
   - Question 5-7: Real-world applications with the same concept but different scenarios (e.g., different shapes, different contexts)
   - Question 8-10: Complex multi-step problems that use the concept along with other geometric principles

3. DIAGRAM DESCRIPTIONS:
   - Each question MUST describe a UNIQUE diagram/scenario
   - Provide detailed descriptions: shapes, measurements, angle labels, relationships
   - Make each diagram description different but related to the same core concept
   - Include specific measurements and labels in your descriptions

4. ANSWER VARIETY:
   - DO NOT make all answers the same! Each question should have a DIFFERENT answer
   - Vary what is being asked: different angles, different lengths, different areas, etc.
   - The concept stays the same, but what you're solving for should vary

5. COMPLEXITY PROGRESSION:
   - Q1-2: Simple direct questions (e.g., "What is angle x?" with easy numbers)
   - Q3-4: Slightly more complex (e.g., "If angle A is X, what is the area?")
   - Q5-7: Word problems (e.g., "A garden has... calculate...")
   - Q8-10: Multi-step complex problems (e.g., "Given... and... find...")

EXAMPLE FOR TRIANGLE IN SEMICIRCLE:
- Q1: Find the other base angle (not always 90!)
- Q2: Find the arc length or chord length
- Q3: Calculate area of the triangle
- Q4: Find the radius given certain measurements
- Q5-7: Real-world applications with different scenarios
- Q8-10: Complex problems combining multiple concepts`;

    case 'graph':
      return `${basePrompt}

GRAPH ANALYSIS - CRITICAL REQUIREMENTS:

1. Analyze the graph type (line graph, bar chart, scatter plot, etc.)
2. Identify axes, scales, data points, trends
3. Generate questions about:
   - Q1-2: Reading values from the graph
   - Q3-4: Calculating slopes, rates, or simple relationships
   - Q5-7: Interpreting trends and making predictions
   - Q8-10: Complex analysis combining multiple data points or trends`;

    case 'table':
      return `${basePrompt}

TABLE/DATA ANALYSIS - CRITICAL REQUIREMENTS:

1. Analyze the table structure and data relationships
2. Generate questions about:
   - Q1-2: Reading values from the table
   - Q3-4: Calculating means, medians, or simple statistics
   - Q5-7: Analyzing patterns and relationships
   - Q8-10: Complex data analysis and predictions`;

    case 'algebra':
      return `${basePrompt}

ALGEBRA - CRITICAL REQUIREMENTS:

1. Identify the algebraic concept (solving equations, simplifying expressions, etc.)
2. Generate questions with:
   - Q1-2: Simple substitution or basic solving
   - Q3-4: More complex equations with multiple steps
   - Q5-7: Word problems requiring equation setup
   - Q8-10: Complex multi-step algebraic problems`;

    case 'fractions':
    case 'exponents':
    case 'percentage':
    case 'number_operations':
      return `${basePrompt}

NUMBER OPERATIONS - CRITICAL REQUIREMENTS:

1. Identify the exact operation type
2. Generate questions with:
   - Q1-2: Simple direct calculations
   - Q3-4: Slightly more complex numbers
   - Q5-7: Word problems with real-world contexts
   - Q8-10: Complex multi-step problems`;

    default:
      return `${basePrompt}

GENERAL MATHEMATICS - CRITICAL REQUIREMENTS:

1. Deeply analyze the source question's core concept
2. Generate 10 questions that:
   - Use the same concept throughout
   - Progressively increase in complexity
   - Have varied answers (not all the same!)
   - Apply the concept in different ways`;
  }
}

/**
 * Generate diagram description prompt for DALL-E
 */
export function generateDiagramPrompt(
  questionNumber: number,
  questionText: string,
  concept: string
): string {
  const difficulty = 
    questionNumber <= 2 ? 'simple and clear' :
    questionNumber <= 4 ? 'moderately detailed' :
    questionNumber <= 7 ? 'detailed with measurements' :
    'complex with multiple elements';

  return `Create a clean, educational math diagram for a Grade 9 geometry question. 
The diagram should be ${difficulty}, showing ${concept}.
Style: Black lines on white background, clear labels, professional educational diagram.
Include angle measurements, length labels, and geometric shapes as described in the question.
Make it suitable for a math textbook - clear, precise, and easy to understand.`;
}

