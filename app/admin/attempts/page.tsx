'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Attempt, Test } from '@/types/database';

interface AttemptWithUser extends Attempt {
  user_email?: string;
}

export default function AttemptsPage() {
  const [attempts, setAttempts] = useState<AttemptWithUser[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAttempts();
  }, []);

  const fetchAttempts = async () => {
    try {
      setLoading(true);
      
      // Fetch attempts
      const attemptsResponse = await fetch('/api/attempts');
      const attemptsData = await attemptsResponse.json();

      if (!attemptsResponse.ok) {
        throw new Error(attemptsData.error || 'Failed to fetch attempts');
      }

      setAttempts(attemptsData.attempts || []);

      // Fetch tests for test ID formatting
      const testsResponse = await fetch('/api/tests');
      const testsData = await testsResponse.json();

      if (testsResponse.ok) {
        setTests(testsData.tests || []);
      }
    } catch (err: any) {
      console.error('Error fetching attempts:', err);
      setError(err?.message || 'Failed to load attempts');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format test display name as "Test {date} #{number}"
  const formatTestDisplayName = (testId: string) => {
    const test = tests.find(t => t.id === testId);
    if (!test) return testId.substring(0, 8) + '...';
    
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

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-100';
    if (score >= 5) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-gray-600">Loading attempts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <p className="font-semibold">Error</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={fetchAttempts}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

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
          <span className="text-gray-900">Review Attempts</span>
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
          className="flex items-center p-4 bg-white rounded-lg shadow border border-gray-200 hover:shadow-lg transition-shadow"
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
          className="flex items-center p-4 bg-blue-50 rounded-lg shadow border-2 border-blue-300"
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
        <h1 className="text-3xl font-bold text-gray-900">Review Attempts</h1>
        <p className="text-gray-600 mt-2">View and provide feedback on student attempts</p>
      </div>

      {attempts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 border border-gray-200 text-center">
          <p className="text-gray-600">No attempts found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attempt ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Test ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attempts.map((attempt) => (
                  <tr key={attempt.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {attempt.id.substring(0, 8)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {formatTestDisplayName(attempt.test_id)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getScoreColor(
                          attempt.score
                        )}`}
                      >
                        {attempt.score}/10
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {attempt.submitted_at
                          ? formatDate(attempt.submitted_at)
                          : 'Not submitted'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/admin/attempts/${attempt.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Review →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

