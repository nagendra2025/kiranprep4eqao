'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Attempt {
  id: string;
  test_id: string;
  user_id: string;
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
}

interface AdminFeedback {
  id: string;
  feedback_text: string;
  created_at: string;
}

export default function AttemptReviewPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.attemptId as string;

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [feedback, setFeedback] = useState<AdminFeedback | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
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
      if (data.feedback) {
        setFeedbackText(data.feedback.feedback_text);
      }
    } catch (err: any) {
      console.error('Error fetching attempt details:', err);
      setError(err?.message || 'Failed to load attempt details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    try {
      setSubmittingFeedback(true);
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attempt_id: attemptId,
          feedback_text: feedbackText.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit feedback');
      }

      // Refresh to get updated feedback
      await fetchAttemptDetails();
    } catch (err: any) {
      console.error('Error submitting feedback:', err);
      setError(err?.message || 'Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-gray-600">Loading attempt details...</p>
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
            href="/admin/attempts"
            className="mt-2 text-sm underline hover:no-underline inline-block"
          >
            Back to Attempts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link
          href="/admin/attempts"
          className="text-indigo-600 hover:text-indigo-700 mb-4 inline-block"
        >
          ← Back to Attempts
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">Review Attempt</h1>
      </div>

      {/* Attempt Summary */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Attempt ID</p>
            <p className="text-lg font-semibold text-gray-900">
              {attempt.id.substring(0, 8)}...
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Test ID</p>
            <p className="text-lg font-semibold text-gray-900">
              {attempt.test_id.substring(0, 8)}...
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Score</p>
            <span
              className={`inline-block px-3 py-1 text-lg font-semibold rounded ${getScoreColor(
                attempt.score
              )}`}
            >
              {attempt.score}/10
            </span>
          </div>
        </div>
        {attempt.submitted_at && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">Submitted</p>
            <p className="text-gray-900">{formatDate(attempt.submitted_at)}</p>
          </div>
        )}
      </div>

      {/* Questions and Responses */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Question Review
        </h2>
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
                      {response.is_correct ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>
                  {response.question_text && (
                    <p className="text-gray-700 mb-3 whitespace-pre-wrap">
                      {response.question_text}
                    </p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        Student Answer:
                      </p>
                      <p
                        className={`p-2 rounded ${
                          response.is_correct
                            ? 'bg-green-100 text-green-900'
                            : 'bg-red-100 text-red-900'
                        }`}
                      >
                        {response.student_answer || 'No answer'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        Correct Answer:
                      </p>
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

      {/* Admin Feedback Section */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Admin Feedback</h2>

        {feedback && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-medium text-gray-600">Previous Feedback</p>
              <p className="text-sm text-gray-500">
                {formatDate(feedback.created_at)}
              </p>
            </div>
            <p className="text-gray-900 whitespace-pre-wrap">{feedback.feedback_text}</p>
          </div>
        )}

        <form onSubmit={handleSubmitFeedback} className="space-y-4">
          <div>
            <label
              htmlFor="feedback_text"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {feedback ? 'Update Feedback' : 'Add Feedback'}
            </label>
            <textarea
              id="feedback_text"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-400 bg-white"
              placeholder="Enter feedback for the student..."
            />
          </div>
          <button
            type="submit"
            disabled={submittingFeedback || !feedbackText.trim()}
            className="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submittingFeedback
              ? 'Submitting...'
              : feedback
              ? 'Update Feedback'
              : 'Submit Feedback'}
          </button>
        </form>
      </div>
    </div>
  );
}

