'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Test {
  id: string;
  source_question: string;
  created_at: string;
}

interface Attempt {
  id: string;
  test_id: string;
  score: number;
  submitted_at: string | null;
  created_at: string;
}

export default function CandidateDashboard() {
  const [tests, setTests] = useState<Test[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteAttempt = async (attemptId: string) => {
    if (!window.confirm('Are you sure you want to delete this attempt? This will allow you to retake the test. This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(attemptId);
      const response = await fetch(`/api/attempts/${attemptId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete attempt');
      }

      // Remove attempt from state
      setAttempts(attempts.filter(a => a.id !== attemptId));
      
      // Refresh the data to update the Available Tests cards
      // This will show "Start Test" button instead of "View Results" for the deleted attempt
      await fetchData();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete attempt');
    } finally {
      setDeleting(null);
    }
  };

  const fetchData = async () => {
    try {
      // Fetch tests
      const testsResponse = await fetch('/api/tests');
      const testsData = await testsResponse.json();

      if (!testsResponse.ok) {
        throw new Error(testsData.error || 'Failed to fetch tests');
      }

      setTests(testsData.tests || []);

      // Fetch attempts
      const attemptsResponse = await fetch('/api/attempts');
      const attemptsData = await attemptsResponse.json();

      if (!attemptsResponse.ok) {
        throw new Error(attemptsData.error || 'Failed to fetch attempts');
      }

      setAttempts(attemptsData.attempts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getAttemptForTest = (testId: string): Attempt | undefined => {
    return attempts.find((a) => a.test_id === testId && a.submitted_at);
  };

  // Clean LaTeX sequences from text for display
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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

  // Format test display name as "Test {date} #{number}"
  const formatTestDisplayName = (test: Test, index: number) => {
    const testDate = new Date(test.created_at);
    const dateStr = testDate.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Get all tests created on the same date, sorted by creation time
    const sameDateTests = tests
      .filter(t => {
        const tDate = new Date(t.created_at).toISOString().split('T')[0];
        return tDate === dateStr;
      })
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    // Find the position of this test in the sorted list
    const testNumber = sameDateTests.findIndex(t => t.id === test.id) + 1;
    return `Test ${dateStr} #${testNumber}`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
        <p className="text-gray-600 mt-2">Practice EQAO-style math questions</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Tests</h2>
        {tests.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">No tests available yet. Please check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((test) => {
              const attempt = getAttemptForTest(test.id);
              const hasAttempt = !!attempt;

              return (
                <div
                  key={test.id}
                  className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {formatTestDisplayName(test, tests.indexOf(test))}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Created: {formatDateTime(test.created_at)}
                      </p>
                    </div>
                    {hasAttempt && (
                      <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded">
                        Completed
                      </span>
                    )}
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600 line-clamp-2 whitespace-pre-wrap">
                      {cleanLaTeX(test.source_question).substring(0, 100)}...
                    </p>
                  </div>

                  {hasAttempt && attempt && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Your Score:</span>
                        <span className="text-lg font-bold text-indigo-600">
                          {attempt.score}/10
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    {hasAttempt ? (
                      <>
                        <Link
                          href={`/candidate/attempts/${attempt!.id}`}
                          className="flex-1 text-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          View Results
                        </Link>
                        <button
                          onClick={() => handleDeleteAttempt(attempt!.id)}
                          disabled={deleting === attempt!.id}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Delete attempt to retake test"
                        >
                          {deleting === attempt!.id ? (
                            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </>
                    ) : (
                      <Link
                        href={`/candidate/tests/${test.id}`}
                        className="flex-1 text-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Start Test
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {attempts.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Test History</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Test
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attempts
                  .filter((a) => a.submitted_at)
                  .map((attempt) => {
                    const test = tests.find(t => t.id === attempt.test_id);
                    const testIndex = test ? tests.indexOf(test) : -1;
                    return (
                      <tr key={attempt.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {test ? formatTestDisplayName(test, testIndex) : attempt.test_id.substring(0, 8) + '...'}
                        </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${
                            attempt.score >= 7
                              ? 'bg-green-100 text-green-800'
                              : attempt.score >= 5
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {attempt.score}/10
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {attempt.submitted_at
                          ? formatDateTime(attempt.submitted_at)
                          : 'Not submitted'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-3">
                          <Link
                            href={`/candidate/attempts/${attempt.id}`}
                            className="text-indigo-600 hover:text-indigo-800 font-medium"
                          >
                            View →
                          </Link>
                          <button
                            onClick={() => handleDeleteAttempt(attempt.id)}
                            disabled={deleting === attempt.id}
                            className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete attempt"
                          >
                            {deleting === attempt.id ? (
                              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}



