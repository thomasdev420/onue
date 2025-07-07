import { useState } from 'react';
import { X, HelpCircle, Send } from 'lucide-react';

/**
 * Modal component for handling AI clarification requests
 * Displays clarification questions and allows users to provide additional details
 */
export default function ClarificationModal({ 
  isOpen, 
  clarificationText, 
  originalPrompt, 
  onSubmit, 
  onCancel, 
  onClose 
}) {
  const [clarificationResponse, setClarificationResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!clarificationResponse.trim()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit(clarificationResponse.trim());
      setClarificationResponse('');
    } catch (error) {
      console.error('Error submitting clarification:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setClarificationResponse('');
    onCancel?.();
  };

  const handleClose = () => {
    setClarificationResponse('');
    onClose?.();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-xl max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <HelpCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">I need a bit more information</h2>
              <p className="text-sm text-gray-500">To give you the best response</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X size={24} />
          </button>
        </div>

        {/* Original Prompt */}
        {originalPrompt && (
          <div className="mb-4 p-3 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-600 mb-1">Your original request:</p>
            <p className="text-gray-800 font-medium">"{originalPrompt}"</p>
          </div>
        )}

        {/* Clarification Text */}
        <div className="mb-6">
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
              {clarificationText}
            </p>
          </div>
        </div>

        {/* Response Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="clarification-response" className="block text-sm font-medium text-gray-700 mb-2">
              Please provide more details:
            </label>
            <textarea
              id="clarification-response"
              value={clarificationResponse}
              onChange={(e) => setClarificationResponse(e.target.value)}
              placeholder="Share more context about what you're looking for..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
              rows={4}
              autoFocus
              disabled={isSubmitting}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!clarificationResponse.trim() || isSubmitting}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Submit
                </>
              )}
            </button>
          </div>
        </form>

        {/* Help Text */}
        <div className="mt-4 p-3 bg-gray-50 rounded-xl">
          <p className="text-sm text-gray-600">
            💡 <strong>Tip:</strong> Be as specific as possible. Include details about your target audience, 
            goals, preferred style, or any other context that will help me create exactly what you need.
          </p>
        </div>
      </div>
    </div>
  );
} 