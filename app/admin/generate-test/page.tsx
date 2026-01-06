'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ErrorMessage } from '@/components/ui/error-message';

export default function GenerateTestPage() {
  const router = useRouter();
  const [inputType, setInputType] = useState<'text' | 'image'>('text');
  const [sourceQuestion, setSourceQuestion] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pasteHint, setPasteHint] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageFile(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageFile = (file: File) => {
    // Validate image file
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }
    setSelectedImage(file);
    setError(null);
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle paste event for images
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      // Only handle paste if image input type is selected
      if (inputType !== 'image') return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        // Check if pasted item is an image
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const blob = item.getAsFile();
          if (blob) {
            // Convert blob to File
            const file = new File([blob], `pasted-image-${Date.now()}.png`, {
              type: blob.type || 'image/png',
            });
            handleImageFile(file);
            setPasteHint(false);
          }
          break;
        }
      }
    };

    // Add paste event listener to the document
    document.addEventListener('paste', handlePaste);
    
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [inputType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      // Validate input based on type
      if (inputType === 'text') {
        if (!sourceQuestion.trim() || sourceQuestion.trim().length < 10) {
          setError('Source question must be at least 10 characters long');
          setLoading(false);
          return;
        }
        if (sourceQuestion.length > 10000) {
          setError('Source question is too long (max 10000 characters)');
          setLoading(false);
          return;
        }
      } else {
        if (!selectedImage) {
          setError('Please select an image');
          setLoading(false);
          return;
        }
      }

      // Prepare form data
      const formData = new FormData();
      if (inputType === 'text') {
        formData.append('source_question', sourceQuestion.trim());
        formData.append('input_type', 'text');
      } else {
        if (!selectedImage) {
          throw new Error('No image selected');
        }
        // TypeScript now knows selectedImage is not null after the check
        formData.append('image', selectedImage as File);
        formData.append('input_type', 'image');
      }
      if (explanation.trim()) {
        formData.append('explanation', explanation.trim());
      }

      const response = await fetch('/api/tests/generate', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to generate test');
        setLoading(false);
        return;
      }

      setSuccess(true);
      // Redirect to tests page after 2 seconds
      setTimeout(() => {
        router.push('/admin/tests');
      }, 2000);
    } catch (err: any) {
      console.error('Error generating test:', err);
      setError(err?.message || 'An unexpected error occurred. Please try again.');
      setLoading(false);
    }
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
          <span className="text-gray-900">Generate Test</span>
        </nav>
      </div>

      {/* Quick Navigation Cards */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/generate-test"
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
        <h1 className="text-3xl font-bold text-gray-900">Generate Test</h1>
        <p className="text-gray-600 mt-2">Create a new test from an EQAO question</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <form onSubmit={handleSubmit} className="space-y-6">
          <ErrorMessage error={error} onDismiss={() => setError(null)} />

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
              <p className="font-semibold">Test generated successfully!</p>
              <p className="text-sm mt-1">Redirecting to tests page...</p>
            </div>
          )}

          {/* Input Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Input Type <span className="text-red-500">*</span>
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="inputType"
                  value="text"
                  checked={inputType === 'text'}
                  onChange={(e) => {
                    setInputType('text');
                    setSelectedImage(null);
                    setImagePreview(null);
                    setError(null);
                  }}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Text (Paste question with multiple choice answers)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="inputType"
                  value="image"
                  checked={inputType === 'image'}
                  onChange={(e) => {
                    setInputType('image');
                    setSourceQuestion('');
                    setError(null);
                  }}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Image (Upload question image)</span>
              </label>
            </div>
          </div>

          {/* Text Input */}
          {inputType === 'text' && (
            <div>
              <label htmlFor="source_question" className="block text-sm font-medium text-gray-700 mb-2">
                Source Question with Multiple Choice Answers <span className="text-red-500">*</span>
              </label>
              <textarea
                id="source_question"
                value={sourceQuestion}
                onChange={(e) => setSourceQuestion(e.target.value)}
                rows={10}
                required={inputType === 'text'}
                minLength={10}
                maxLength={10000}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-400 bg-white"
                placeholder="Paste the EQAO question here with all multiple choice answers included. For example:&#10;&#10;What is 2 + 2?&#10;A) 3&#10;B) 4&#10;C) 5&#10;D) 6&#10;&#10;Answer: B"
              />
              <p className="mt-1 text-sm text-gray-500">
                {sourceQuestion.length}/10000 characters
              </p>
              <p className="mt-1 text-sm text-gray-500 italic">
                Tip: Include the question text and all answer choices (A, B, C, D, etc.) in your paste. The correct answer will be extracted automatically.
              </p>
            </div>
          )}

          {/* Image Input */}
          {inputType === 'image' && (
            <div ref={containerRef}>
              <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
                Upload or Paste Question Image <span className="text-red-500">*</span>
              </label>
              <div className="space-y-4">
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="image-upload"
                    className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                    onFocus={() => setPasteHint(true)}
                    onBlur={() => setPasteHint(false)}
                    tabIndex={0}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg
                        className="w-10 h-10 mb-3 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span>, drag and drop, or <span className="font-semibold">paste image</span>
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                      {pasteHint && (
                        <p className="mt-2 text-xs text-blue-600 font-medium">
                          💡 Tip: Press Ctrl+V (Cmd+V on Mac) to paste a screenshot
                        </p>
                      )}
                    </div>
                    <input
                      id="image-upload"
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
                {imagePreview && (
                  <div className="relative">
                    <div className="mb-2 text-sm text-green-600 font-medium">
                      ✓ Image ready (click Generate Test to process)
                    </div>
                    <img
                      src={imagePreview}
                      alt="Question preview"
                      className="max-w-full h-auto rounded-lg border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                      title="Remove image"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                )}
                {!imagePreview && (
                  <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Quick Tip:</strong> Take a screenshot of the question, then press <kbd className="px-2 py-1 bg-white border border-blue-300 rounded text-xs">Ctrl+V</kbd> (or <kbd className="px-2 py-1 bg-white border border-blue-300 rounded text-xs">Cmd+V</kbd> on Mac) to paste it here!
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <label htmlFor="explanation" className="block text-sm font-medium text-gray-700 mb-2">
              Explanation (Optional)
            </label>
            <textarea
              id="explanation"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-400 bg-white"
              placeholder="Optional explanation or context..."
            />
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading || success}
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Generating Test...' : success ? 'Test Generated!' : 'Generate Test'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

