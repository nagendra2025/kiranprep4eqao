/**
 * Evaluates a student's answer against the correct answer
 * Supports numeric answers with tolerance for decimals
 */
export function evaluateAnswer(
  studentAnswer: string,
  correctAnswer: string
): boolean {
  // Trim whitespace
  const student = studentAnswer.trim();
  const correct = correctAnswer.trim();

  // Exact match (case-insensitive)
  if (student.toLowerCase() === correct.toLowerCase()) {
    return true;
  }

  // Try numeric comparison with tolerance
  const studentNum = parseFloat(student);
  const correctNum = parseFloat(correct);

  // If both are valid numbers, compare with tolerance
  if (!isNaN(studentNum) && !isNaN(correctNum)) {
    const tolerance = 0.001; // Small tolerance for floating point
    return Math.abs(studentNum - correctNum) < tolerance;
  }

  // Try removing common formatting differences
  const normalizedStudent = normalizeAnswer(student);
  const normalizedCorrect = normalizeAnswer(correct);

  if (normalizedStudent === normalizedCorrect) {
    return true;
  }

  // Try numeric comparison on normalized versions
  const normalizedStudentNum = parseFloat(normalizedStudent);
  const normalizedCorrectNum = parseFloat(normalizedCorrect);

  if (!isNaN(normalizedStudentNum) && !isNaN(normalizedCorrectNum)) {
    const tolerance = 0.001;
    return Math.abs(normalizedStudentNum - normalizedCorrectNum) < tolerance;
  }

  return false;
}

/**
 * Normalizes answer strings for comparison
 * Removes common formatting, spaces, and converts to lowercase
 */
function normalizeAnswer(answer: string): string {
  return answer
    .toLowerCase()
    .replace(/\s+/g, '') // Remove all whitespace
    .replace(/[^\d.-]/g, '') // Remove non-numeric characters except decimal point and minus
    .trim();
}

/**
 * Calculates the score for a test attempt
 */
export function calculateScore(
  responses: Array<{ is_correct: boolean }>
): number {
  return responses.filter((r) => r.is_correct).length;
}



