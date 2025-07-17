'use client';

import React, { useState } from 'react';
import { X, ThumbsUp, ThumbsDown, Star, MessageCircle } from 'lucide-react';

export default function ImageFeedbackModal({
  isOpen,
  onClose,
  imageId,
  imageUrl,
  imageTitle,
  prompt,
  onFeedbackSubmitted
}) {
  const [feedback, setFeedback] = useState(null);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleFeedback = async (feedbackType) => {
    if (!imageId || !imageUrl || !prompt) {
      console.error('Missing required data for feedback');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/image-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageId,
          imageUrl,
          prompt,
          feedback: feedbackType,
          reason: reason.trim() || null
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      setSubmitted(true);
      setFeedback(feedbackType);
      
      // Call the callback if provided
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted(feedbackType, reason);
      }

      // Auto-close after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFeedback(null);
    setReason('');
    setSubmitted(false);
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {submitted ? 'Thank you!' : 'How relevant is this image?'}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {!submitted ? (
          <>
            {/* Image Preview */}
            <div className="mb-4">
              <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={imageUrl}
                  alt={imageTitle || 'Selected image'}
                  className="w-full h-full object-cover"
                />
              </div>
              {imageTitle && (
                <p className="text-sm text-gray-600 mt-2 truncate">{imageTitle}</p>
              )}
            </div>

            {/* Prompt Context */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Your request:</strong> "{prompt}"
              </p>
            </div>

            {/* Feedback Options */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                Rate how well this image matches your request:
              </p>
              
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleFeedback('perfect')}
                  disabled={isSubmitting}
                  className="flex flex-col items-center p-3 border-2 border-green-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors disabled:opacity-50"
                >
                  <Star className="text-green-600 mb-1" size={20} />
                  <span className="text-xs font-medium text-green-700">Perfect</span>
                </button>
                
                <button
                  onClick={() => handleFeedback('relevant')}
                  disabled={isSubmitting}
                  className="flex flex-col items-center p-3 border-2 border-blue-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors disabled:opacity-50"
                >
                  <ThumbsUp className="text-blue-600 mb-1" size={20} />
                  <span className="text-xs font-medium text-blue-700">Relevant</span>
                </button>
                
                <button
                  onClick={() => handleFeedback('irrelevant')}
                  disabled={isSubmitting}
                  className="flex flex-col items-center p-3 border-2 border-red-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <ThumbsDown className="text-red-600 mb-1" size={20} />
                  <span className="text-xs font-medium text-red-700">Irrelevant</span>
                </button>
              </div>
            </div>

            {/* Optional Reason */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MessageCircle size={16} className="inline mr-1" />
                Optional: Why did you choose this rating?
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., 'Shows sheep instead of knights' or 'Perfect knight imagery'"
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1">
                {reason.length}/200 characters
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                disabled={isSubmitting}
              >
                Skip
              </button>
            </div>
          </>
        ) : (
          /* Success Message */
          <div className="text-center py-4">
            <div className="mb-4">
              {feedback === 'perfect' && (
                <Star className="text-green-600 mx-auto mb-2" size={32} />
              )}
              {feedback === 'relevant' && (
                <ThumbsUp className="text-blue-600 mx-auto mb-2" size={32} />
              )}
              {feedback === 'irrelevant' && (
                <ThumbsDown className="text-red-600 mx-auto mb-2" size={32} />
              )}
            </div>
            <p className="text-green-600 font-medium">
              Feedback submitted successfully!
            </p>
            <p className="text-sm text-gray-600 mt-1">
              This helps us improve future image selections.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 