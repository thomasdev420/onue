'use client';

import { useState, useEffect } from 'react';
import { Bug, X } from 'lucide-react';

export default function FeedbackButton() {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackType, setFeedbackType] = useState("bug");
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Add blur effect to sidebar when modal is open
  useEffect(() => {
    const sidebar = document.querySelector('[data-sidebar]');
    if (sidebar) {
      if (showFeedbackModal) {
        sidebar.style.filter = 'blur(6px)';
        sidebar.style.pointerEvents = 'none';
      } else {
        sidebar.style.filter = 'none';
        sidebar.style.pointerEvents = 'auto';
      }
    }
  }, [showFeedbackModal]);

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    if (feedbackText.trim()) {
      // Here you would typically send the feedback to your backend
      console.log('Feedback submitted:', { type: feedbackType, text: feedbackText });
      setFeedbackSubmitted(true);
      setTimeout(() => {
        setShowFeedbackModal(false);
        setFeedbackText("");
        setFeedbackType("bug");
        setFeedbackSubmitted(false);
      }, 2000);
    }
  };

  const handleCloseFeedbackModal = () => {
    setShowFeedbackModal(false);
    setFeedbackText("");
    setFeedbackType("bug");
    setFeedbackSubmitted(false);
  };

  return (
    <>
      <button 
        onClick={() => setShowFeedbackModal(true)}
        className="fixed bottom-6 right-6 z-40 px-4 py-3 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors flex items-center gap-2 shadow-lg hover:shadow-xl"
        style={{
          boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)',
        }}
      >
        <Bug size={18} className="text-blue-600" />
        <span className="text-blue-700 font-semibold text-sm">Feedback</span>
      </button>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Send Feedback</h2>
              <button
                onClick={handleCloseFeedbackModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            {!feedbackSubmitted ? (
              <form onSubmit={handleFeedbackSubmit}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Feedback Type
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setFeedbackType("bug")}
                      className={`flex-1 px-4 py-2 rounded-xl border transition-colors ${
                        feedbackType === "bug" 
                          ? "bg-red-50 border-red-300 text-red-700" 
                          : "bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      🐛 Bug Report
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeedbackType("feature")}
                      className={`flex-1 px-4 py-2 rounded-xl border transition-colors ${
                        feedbackType === "feature" 
                          ? "bg-green-50 border-green-300 text-green-700" 
                          : "bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      💡 Feature Request
                    </button>
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {feedbackType === "bug" ? "Describe the bug" : "Describe the feature"}
                  </label>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                    placeholder={feedbackType === "bug" ? "What went wrong? How can we reproduce it?" : "What feature would you like to see? How would it help you?"}
                    rows={4}
                    autoFocus
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCloseFeedbackModal}
                    className="flex-1 px-4 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!feedbackText.trim()}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center">
                <div className="text-green-500 text-6xl mb-4">✓</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Thank you!</h3>
                <p className="text-gray-600">Your feedback has been submitted and will be considered for the next version.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
} 