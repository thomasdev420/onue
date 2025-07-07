import { useState, useCallback } from 'react';

/**
 * Hook to manage AI clarification flow
 * Handles state for clarification requests and follow-up responses
 */
export function useClarification() {
  const [clarificationState, setClarificationState] = useState({
    isWaitingForClarification: false,
    originalPrompt: null,
    originalAnalysis: null,
    clarificationResponse: null
  });

  /**
   * Check if a response indicates clarification is needed
   * @param {Object} response - API response object
   * @returns {boolean} True if clarification is needed
   */
  const needsClarification = useCallback((response) => {
    return response?.needsClarification === true;
  }, []);

  /**
   * Handle initial API response that requires clarification
   * @param {Object} response - API response with clarification data
   * @param {string} originalPrompt - The original user prompt
   */
  const handleClarificationRequest = useCallback((response, originalPrompt) => {
    setClarificationState({
      isWaitingForClarification: true,
      originalPrompt,
      originalAnalysis: response.analysis,
      clarificationResponse: response.response
    });
  }, []);

  /**
   * Submit clarification follow-up
   * @param {string} clarifiedResponse - User's response to clarification
   * @param {Function} apiCall - Function to make the API call
   * @param {Object} additionalParams - Additional parameters for the API call
   * @returns {Promise} API response
   */
  const submitClarification = useCallback(async (clarifiedResponse, apiCall, additionalParams = {}) => {
    if (!clarificationState.isWaitingForClarification) {
      throw new Error('No clarification request in progress');
    }

    const params = {
      ...additionalParams,
      prompt: clarifiedResponse,
      isClarificationFollowup: true,
      originalAnalysis: clarificationState.originalAnalysis
    };

    const response = await apiCall(params);

    // Clear clarification state after successful response
    setClarificationState({
      isWaitingForClarification: false,
      originalPrompt: null,
      originalAnalysis: null,
      clarificationResponse: null
    });

    return response;
  }, [clarificationState]);

  /**
   * Cancel clarification and reset state
   */
  const cancelClarification = useCallback(() => {
    setClarificationState({
      isWaitingForClarification: false,
      originalPrompt: null,
      originalAnalysis: null,
      clarificationResponse: null
    });
  }, []);

  /**
   * Get the current clarification response text
   * @returns {string|null} The clarification question text
   */
  const getClarificationText = useCallback(() => {
    return clarificationState.clarificationResponse;
  }, [clarificationState.clarificationResponse]);

  /**
   * Check if currently waiting for clarification
   * @returns {boolean} True if waiting for clarification
   */
  const isWaitingForClarification = useCallback(() => {
    return clarificationState.isWaitingForClarification;
  }, [clarificationState.isWaitingForClarification]);

  /**
   * Get the original prompt that triggered clarification
   * @returns {string|null} The original prompt
   */
  const getOriginalPrompt = useCallback(() => {
    return clarificationState.originalPrompt;
  }, [clarificationState.originalPrompt]);

  return {
    // State
    clarificationState,
    
    // Actions
    needsClarification,
    handleClarificationRequest,
    submitClarification,
    cancelClarification,
    
    // Getters
    getClarificationText,
    isWaitingForClarification,
    getOriginalPrompt
  };
}

export default useClarification; 