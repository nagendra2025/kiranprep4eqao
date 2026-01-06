/**
 * Validation utilities for form inputs and API requests
 */

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters long' };
  }
  return { valid: true };
}

export function validateTestInput(
  sourceQuestion: string,
  sourceAnswer: string
): { valid: boolean; message?: string } {
  if (!sourceQuestion || sourceQuestion.trim().length < 10) {
    return {
      valid: false,
      message: 'Source question must be at least 10 characters long',
    };
  }

  if (!sourceAnswer || sourceAnswer.trim().length === 0) {
    return {
      valid: false,
      message: 'Source answer is required',
    };
  }

  if (sourceQuestion.length > 5000) {
    return {
      valid: false,
      message: 'Source question is too long (max 5000 characters)',
    };
  }

  if (sourceAnswer.length > 500) {
    return {
      valid: false,
      message: 'Source answer is too long (max 500 characters)',
    };
  }

  return { valid: true };
}

export function validateAnswer(answer: string): { valid: boolean; message?: string } {
  if (!answer || answer.trim().length === 0) {
    return { valid: false, message: 'Answer cannot be empty' };
  }

  if (answer.length > 500) {
    return { valid: false, message: 'Answer is too long (max 500 characters)' };
  }

  return { valid: true };
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/\s+/g, ' ');
}



