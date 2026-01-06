'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Question } from '@/types/database';

interface Attempt {
  id: string;
  test_id: string;
}

export default function TakeTestPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.testId as string;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (testId) {
      initializeTest();
    }
  }, [testId]);

  const initializeTest = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create attempt
      const attemptResponse = await fetch('/api/attempts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test_id: testId }),
      });

      const attemptData = await attemptResponse.json();

      if (!attemptResponse.ok) {
        throw new Error(attemptData.error || 'Failed to start test');
      }

      setAttempt(attemptData.attempt);

      // Fetch questions
      const questionsResponse = await fetch(`/api/tests/${testId}/questions`);
      const questionsData = await questionsResponse.json();

      if (!questionsResponse.ok) {
        throw new Error(questionsData.error || 'Failed to load questions');
      }

      setQuestions(questionsData.questions || []);
    } catch (err: any) {
      console.error('Error initializing test:', err);
      setError(err?.message || 'Failed to load test');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmit = async () => {
    if (!attempt) {
      setError('Attempt not found');
      return;
    }

    const answeredCount = Object.keys(answers).filter(
      (key) => answers[key] && answers[key].trim()
    ).length;

    if (answeredCount < questions.length) {
      const confirmSubmit = window.confirm(
        `You have answered ${answeredCount} out of ${questions.length} questions. Do you want to submit anyway?`
      );
      if (!confirmSubmit) {
        return;
      }
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`/api/attempts/${attempt.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit test');
      }

      // Redirect to results page
      router.push(`/candidate/attempts/${attempt.id}`);
    } catch (err: any) {
      console.error('Error submitting test:', err);
      setError(err?.message || 'Failed to submit test');
      setSubmitting(false);
    }
  };

  // Clean LaTeX sequences from question text for display
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

  const answeredCount = Object.keys(answers).filter(
    (key) => answers[key] && answers[key].trim()
  ).length;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-gray-600">Loading test...</p>
        </div>
      </div>
    );
  }

  if (error && !attempt) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <p className="font-semibold">Error</p>
          <p className="text-sm mt-1">{error}</p>
          <Link
            href="/candidate/dashboard"
            className="mt-2 text-sm underline hover:no-underline inline-block"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="mb-4">
          <Link
            href="/candidate/dashboard"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium transition-colors mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">EQAO Practice Test</h1>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-gray-600">
            Progress: {answeredCount}/{questions.length} questions answered
          </p>
          <div className="flex items-center space-x-4">
            <div className="w-64 bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(answeredCount / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <p className="font-semibold">Error</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      <div className="space-y-6 mb-8">
        {questions
          .sort((a, b) => a.question_number - b.question_number)
          .map((question) => (
            <div
              key={question.id}
              className="bg-white rounded-lg shadow p-6 border border-gray-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-lg font-semibold text-gray-900">
                    Question {question.question_number}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded ${
                      question.difficulty_level <= 2
                        ? 'bg-green-100 text-green-800'
                        : question.difficulty_level <= 4
                        ? 'bg-blue-100 text-blue-800'
                        : question.difficulty_level <= 7
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {question.difficulty_level <= 2
                      ? 'Very Easy'
                      : question.difficulty_level <= 4
                      ? 'Medium'
                      : question.difficulty_level <= 7
                      ? 'Tough'
                      : 'More Tough'}
                  </span>
                </div>
                {answers[question.id] && (
                  <span className="text-sm text-green-600 font-medium">✓ Answered</span>
                )}
              </div>

              {/* Display question and image together - inline layout */}
              <div className="mb-4">
                {question.question_image_url ? (
                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    <div className="flex-1">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {cleanLaTeX(question.question_text)}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <img
                        src={question.question_image_url}
                        alt={`Question ${question.question_number} diagram`}
                        className="max-w-[250px] max-h-[250px] w-auto h-auto rounded border border-gray-300 shadow-sm object-contain"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {cleanLaTeX(question.question_text)}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor={`answer-${question.id}`}
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Your Answer:
                </label>
                <input
                  id={`answer-${question.id}`}
                  type="text"
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-400 bg-white"
                  placeholder="Enter your answer..."
                />
              </div>
            </div>
          ))}
      </div>

      <div className="bg-white rounded-lg shadow p-6 border border-gray-200 sticky bottom-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">
              {answeredCount} of {questions.length} questions answered
            </p>
            {answeredCount < questions.length && (
              <p className="text-xs text-yellow-600 mt-1">
                You can submit with unanswered questions
              </p>
            )}
          </div>
          <div className="flex space-x-4">
            <Link
              href="/candidate/dashboard"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Cancel
            </Link>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Test'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

