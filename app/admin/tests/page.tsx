'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Test } from '@/types/database';

export default function TestsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

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

  useEffect(() => {
    fetchTests();
  }, []);

  const handleDelete = async (testId: string, testName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${testName}"? This will also delete all related questions and attempts. This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleting(testId);
      const response = await fetch(`/api/tests/${testId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete test');
      }

      // Remove test from state
      setTests(tests.filter(t => t.id !== testId));
    } catch (err: any) {
      setError(err?.message || 'Failed to delete test');
    } finally {
      setDeleting(null);
    }
  };

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tests');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tests');
      }

      setTests(data.tests || []);
    } catch (err: any) {
      console.error('Error fetching tests:', err);
      setError(err?.message || 'Failed to load tests');
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
          <p className="text-gray-600">Loading tests...</p>
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
            onClick={fetchTests}
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
          <span className="text-gray-900">All Tests</span>
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

      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Tests</h1>
          <p className="text-gray-600 mt-2">View and manage all generated tests</p>
        </div>
        <Link
          href="/admin/generate-test"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
        >
          Generate New Test
        </Link>
      </div>

      {tests.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 border border-gray-200 text-center">
          <p className="text-gray-600 mb-4">No tests found.</p>
          <Link
            href="/admin/generate-test"
            className="text-indigo-600 hover:text-indigo-700 underline"
          >
            Generate your first test
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((test) => (
            <div
              key={test.id}
              className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {formatTestDisplayName(test, tests.indexOf(test))}
                </h3>
                <p className="text-sm text-gray-500">
                  Created: {formatDate(test.created_at)}
                </p>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 line-clamp-3 whitespace-pre-wrap">
                  {cleanLaTeX(test.source_question)}
                </p>
              </div>

              {test.source_answer && test.source_answer !== 'See question text' && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm">
                    <span className="text-gray-600">Correct Answer:</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      {cleanLaTeX(test.source_answer)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                <Link
                  href={`/admin/tests/${test.id}`}
                  className="flex-1 text-center bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                >
                  View Details
                </Link>
                <button
                  onClick={() => handleDelete(test.id, formatTestDisplayName(test, tests.indexOf(test)))}
                  disabled={deleting === test.id}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Delete test"
                >
                  {deleting === test.id ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

