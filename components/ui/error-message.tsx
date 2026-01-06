interface ErrorMessageProps {
  error: string | null;
  onDismiss?: () => void;
}

export function ErrorMessage({ error, onDismiss }: ErrorMessageProps) {
  if (!error) return null;

  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex justify-between items-start">
      <div className="flex-1">
        <p className="font-medium">Error</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-4 text-red-700 hover:text-red-900"
          aria-label="Dismiss error"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}



