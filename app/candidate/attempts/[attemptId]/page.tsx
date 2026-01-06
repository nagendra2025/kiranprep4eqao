'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Attempt {
  id: string;
  test_id: string;
  submitted_at: string;
  score: number;
}

interface Response {
  id: string;
  question_id: string;
  student_answer: string;
  is_correct: boolean;
  question_text?: string;
  correct_answer?: string;
  question_number?: number;
  question_image_url?: string;
}

interface AdminFeedback {
  id: string;
  feedback_text: string;
  created_at: string;
}

export default function AttemptResultsPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.attemptId as string;

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [feedback, setFeedback] = useState<AdminFeedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (attemptId) {
      fetchAttemptDetails();
    }
  }, [attemptId]);

  const fetchAttemptDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/attempts/${attemptId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch attempt details');
      }

      setAttempt(data.attempt);
      setResponses(data.responses || []);
      setFeedback(data.feedback);
    } catch (err: any) {
      console.error('Error fetching attempt details:', err);
      setError(err?.message || 'Failed to load attempt details');
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

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-100';
    if (score >= 5) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreMessage = (score: number) => {
    if (score >= 8) return 'Excellent work! You have a strong understanding of the concepts.';
    if (score >= 5) return 'Good effort! Keep practicing to improve your skills.';
    return 'Keep practicing! Review the concepts and try again.';
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <p className="font-semibold">Error</p>
          <p className="text-sm mt-1">{error || 'Attempt not found'}</p>
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
        <Link
          href="/candidate/dashboard"
          className="text-indigo-600 hover:text-indigo-700 mb-4 inline-block"
        >
          ← Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">Test Results</h1>
      </div>

      {/* Score Card */}
      <div className="bg-white rounded-lg shadow p-8 border border-gray-200 mb-6 text-center">
        <div className="mb-4">
          <p className="text-lg text-gray-600 mb-2">Your Score</p>
          <div className="inline-block">
            <span
              className={`inline-block px-6 py-3 text-4xl font-bold rounded-lg ${getScoreColor(
                attempt.score
              )}`}
            >
              {attempt.score}/10
            </span>
          </div>
        </div>
        <p className={`text-lg font-medium ${getScoreColor(attempt.score).split(' ')[0]}`}>
          {getScoreMessage(attempt.score)}
        </p>
        {attempt.submitted_at && (
          <p className="text-sm text-gray-500 mt-4">
            Submitted: {formatDate(attempt.submitted_at)}
          </p>
        )}
      </div>

      {/* Questions Review */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Question Review</h2>
        {responses.length === 0 ? (
          <p className="text-gray-600">No responses found for this attempt.</p>
        ) : (
          <div className="space-y-6">
            {responses
              .sort((a, b) => (a.question_number || 0) - (b.question_number || 0))
              .map((response) => (
                <div
                  key={response.id}
                  className={`border rounded-lg p-4 ${
                    response.is_correct
                      ? 'border-green-300 bg-green-50'
                      : 'border-red-300 bg-red-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-lg font-semibold text-gray-900">
                      Question {response.question_number || 'N/A'}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded ${
                        response.is_correct
                          ? 'bg-green-200 text-green-800'
                          : 'bg-red-200 text-red-800'
                      }`}
                    >
                      {response.is_correct ? '✓ Correct' : '✗ Incorrect'}
                    </span>
                  </div>
                  {/* Display question and image together - inline layout */}
                  {response.question_text && (
                    <div className="mb-3">
                      {response.question_image_url ? (
                        <div className="flex flex-col sm:flex-row gap-4 items-start">
                          <div className="flex-1">
                            <p className="text-gray-700 whitespace-pre-wrap">
                              {response.question_text}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            <img
                              src={response.question_image_url}
                              alt={`Question ${response.question_number} diagram`}
                              className="max-w-[250px] max-h-[250px] w-auto h-auto rounded border border-gray-300 shadow-sm object-contain"
                            />
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {response.question_text}
                        </p>
                      )}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Your Answer:</p>
                      <p
                        className={`p-2 rounded ${
                          response.is_correct
                            ? 'bg-green-100 text-green-900'
                            : 'bg-red-100 text-red-900'
                        }`}
                      >
                        {response.student_answer || 'No answer provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Correct Answer:</p>
                      <p className="p-2 rounded bg-gray-100 text-gray-900">
                        {response.correct_answer || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Admin Feedback */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Admin Feedback</h2>
        {feedback ? (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-medium text-gray-600">Feedback from Admin</p>
              <p className="text-sm text-gray-500">{formatDate(feedback.created_at)}</p>
            </div>
            <p className="text-gray-900 whitespace-pre-wrap">{feedback.feedback_text}</p>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
            <p className="text-gray-600">No feedback available yet.</p>
            <p className="text-sm text-gray-500 mt-1">
              Your teacher will review your attempt and provide feedback soon.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

