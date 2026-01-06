'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Test, Question } from '@/types/database';

export default function TestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.testId as string;

  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (testId) {
      fetchTestDetails();
    }
  }, [testId]);

  const fetchTestDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch test
      const testResponse = await fetch(`/api/tests?id=${testId}`);
      const testData = await testResponse.json();

      if (!testResponse.ok) {
        throw new Error(testData.error || 'Failed to fetch test');
      }

      setTest(testData.test);

      // Fetch questions
      const questionsResponse = await fetch(`/api/tests/${testId}/questions`);
      const questionsData = await questionsResponse.json();

      if (!questionsResponse.ok) {
        throw new Error(questionsData.error || 'Failed to fetch questions');
      }

      setQuestions(questionsData.questions || []);
    } catch (err: any) {
      console.error('Error fetching test details:', err);
      setError(err?.message || 'Failed to load test details');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyBadge = (level: number) => {
    if (level <= 2) return { text: 'Very Easy', color: 'bg-green-100 text-green-800' };
    if (level <= 4) return { text: 'Medium', color: 'bg-blue-100 text-blue-800' };
    if (level <= 7) return { text: 'Tough', color: 'bg-orange-100 text-orange-800' };
    return { text: 'More Tough', color: 'bg-red-100 text-red-800' };
  };

  // Clean up LaTeX escape sequences for better readability
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
      // Convert degree symbols
      .replace(/\\circ/g, '°')
      .replace(/\^\\circ/g, '°')
      .replace(/\^\{\\circ\}/g, '°')
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-gray-600">Loading test details...</p>
        </div>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <p className="font-semibold">Error</p>
          <p className="text-sm mt-1">{error || 'Test not found'}</p>
          <Link
            href="/admin/tests"
            className="mt-2 text-sm underline hover:no-underline inline-block"
          >
            Back to Tests
          </Link>
        </div>
      </div>
    );
  }

  // Format test display name
  const formatTestDisplayName = () => {
    const testDate = new Date(test.created_at);
    const dateStr = testDate.toISOString().split('T')[0];
    return `Test ${dateStr} #1`; // Simplified for single test view
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Navigation Breadcrumb */}
      <div className="mb-6">
        <nav className="flex items-center space-x-2 text-sm text-gray-600">
          <Link
            href="/admin/dashboard"
            className="hover:text-indigo-600 transition-colors"
          >
            Dashboard
          </Link>
          <span>/</span>
          <Link
            href="/admin/tests"
            className="hover:text-indigo-600 transition-colors"
          >
            All Tests
          </Link>
          <span>/</span>
          <span className="text-gray-900">Test Details</span>
        </nav>
      </div>

      {/* Quick Navigation Cards */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/generate-test"
          className="flex items-center p-4 bg-white rounded-lg shadow border border-gray-200 hover:shadow-lg transition-shadow"
        >
          <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
            <svg
              className="w-6 h-6 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-semibold text-gray-900">Generate Test</h3>
            <p className="text-xs text-gray-600">Create a new test</p>
          </div>
        </Link>

        <Link
          href="/admin/tests"
          className="flex items-center p-4 bg-indigo-50 rounded-lg shadow border-2 border-indigo-300"
        >
          <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-semibold text-gray-900">View Tests</h3>
            <p className="text-xs text-gray-600">Browse all tests</p>
          </div>
        </Link>

        <Link
          href="/admin/attempts"
          className="flex items-center p-4 bg-white rounded-lg shadow border border-gray-200 hover:shadow-lg transition-shadow"
        >
          <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-semibold text-gray-900">Review Attempts</h3>
            <p className="text-xs text-gray-600">View student attempts</p>
          </div>
        </Link>
      </div>

      <div className="mb-8">
        <Link
          href="/admin/tests"
          className="text-indigo-600 hover:text-indigo-700 mb-4 inline-block"
        >
          ← Back to Tests
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">Test Details</h1>
        <div className="mt-2 space-y-1">
          <p className="text-gray-600">Test: {formatTestDisplayName()}</p>
          <p className="text-sm text-gray-500">Created: {formatDateTime(test.created_at)}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 border border-gray-200 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Source Question</h2>
        
        {/* Display source image if available */}
        {test.source_image_url && (
          <div className="mb-4">
            <img
              src={test.source_image_url}
              alt="Source question diagram"
              className="max-w-full h-auto rounded-lg border border-gray-300 shadow-sm"
            />
          </div>
        )}
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-x-auto">
          <pre className="text-gray-900 whitespace-pre-wrap font-sans text-sm leading-relaxed m-0">
            {cleanLaTeX(test.source_question)}
          </pre>
        </div>
        
        {test.source_answer && test.source_answer !== 'See question text' && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <span className="text-sm font-medium text-gray-600">Extracted Correct Answer:</span>
            <span className="ml-2 text-gray-900 font-semibold">{cleanLaTeX(test.source_answer)}</span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Generated Questions ({questions.length}/10)
          </h2>
        </div>

        {questions.length === 0 ? (
          <p className="text-gray-600">No questions found for this test.</p>
        ) : (
          <div className="space-y-6">
            {questions
              .sort((a, b) => a.question_number - b.question_number)
              .map((question) => {
                const badge = getDifficultyBadge(question.difficulty_level);
                return (
                  <div
                    key={question.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg font-semibold text-gray-900">
                          Question {question.question_number}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${badge.color}`}
                        >
                          {badge.text}
                        </span>
                      </div>
                    </div>
                    {/* Display question and image together - inline layout */}
                    <div className="mb-3">
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
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-600">
                        Correct Answer:
                      </span>
                      <span className="ml-2 text-gray-900 font-semibold">
                        {cleanLaTeX(question.correct_answer)}
                      </span>
                    </div>
                    {question.explanation && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-600">
                          Explanation:
                        </span>
                        <p className="mt-1 text-sm text-gray-700">
                          {question.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}

