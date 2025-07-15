'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, Send } from 'lucide-react';

export default function PromptModal({
  isOpen,
  onClose,
  onSubmit,
  businessContext = null,
  existingSlides = [],
  mode = 'slides',
  initialPrompt = ''
}) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [slideCount, setSlideCount] = useState(5);
  const [error, setError] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setPrompt(initialPrompt || '');
      setError('');
      setIsGenerating(false);
    }
  }, [isOpen, initialPrompt]);

  // Auto-expand textarea
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };
  useEffect(() => { adjustTextareaHeight(); }, [prompt]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }
    setError('');
    setIsGenerating(true);
    const userMessage = prompt.trim();
    setPrompt('');
    
    console.log('Starting AI generation with prompt:', userMessage);
    console.log('Business context:', businessContext);
    console.log('Existing slides count:', existingSlides?.length || 0);

    // Let the AI figure out the intent from the user's prompt
    let finalSlideCount = slideCount;
    const slideCountMatch = userMessage.match(/(\d+)\s*(?:slides?|slide)/i);
    if (slideCountMatch) {
      const requestedCount = parseInt(slideCountMatch[1]);
      if (requestedCount >= 1 && requestedCount <= 10) {
        finalSlideCount = requestedCount;
      }
    }
    
    try {
      console.log('Sending request to unified content engine with:', {
        prompt: userMessage,
        slideCount: finalSlideCount,
        businessContext: businessContext,
        existingSlides: existingSlides?.length || 0
      });
      
      const response = await fetch('/api/generate-slides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMessage,
          slideCount: finalSlideCount,
          businessContext: businessContext,
          userInfo: {
            name: 'User',
            email: 'user@example.com'
          },
          forceGenerate: true,
          existingSlides: existingSlides || []
        }),
      });
      
      console.log('API response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate slides');
      }
      const data = await response.json();
      console.log('API response received:', data);
      console.log('Slides from API:', data.slides);
      
      if (!data.slides || !Array.isArray(data.slides)) {
        throw new Error('Invalid response format: slides array not found');
      }
      
      // Let the AI response determine the final content
      // The AI should return the complete content based on user intent
      let finalSlides = data.slides;
      
      // Automatically apply the generated slides
      onSubmit(finalSlides, userMessage);
      setIsGenerating(false);
      onClose();
      
    } catch (err) {
      setError(err.message || 'Failed to generate slides');
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  // Full-screen loading overlay when generating
  if (isGenerating) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          textAlign: 'center',
          color: 'white'
        }}>
          <Loader2 size={48} className="animate-spin" />
          <div style={{ fontSize: '20px', fontWeight: '600' }}>
            Generating slides...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFF',
          borderRadius: '24px',
          boxShadow: '0 5px 15px rgba(0,0,0,0.15)',
          width: '100%',
          maxWidth: '520px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          padding: '40px',
          boxSizing: 'border-box',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isGenerating}
          style={{
            position: 'absolute',
            top: '24px',
            right: '24px',
            background: 'none',
            border: 'none',
            cursor: isGenerating ? 'not-allowed' : 'pointer',
            padding: '8px',
            borderRadius: '8px',
            color: '#9CA3AF',
            transition: 'all 0.2s ease',
            opacity: isGenerating ? 0.5 : 1,
            zIndex: 10,
          }}
        >
          <X size={24} />
        </button>

        <h2 style={{
          fontSize: '28px',
          fontWeight: 700,
          color: '#23272F',
          textAlign: 'center',
          margin: 0,
          marginBottom: '8px',
          fontFamily: "'Inter', sans-serif"
        }}>
          AI Prompt
        </h2>
        <div style={{
          fontSize: '17px',
          color: '#7B8493',
          textAlign: 'center',
          marginBottom: '24px',
          fontWeight: 500,
          fontFamily: "'Inter', sans-serif"
        }}>
          {existingSlides && existingSlides.length > 0 
            ? `You have ${existingSlides.length} existing ${mode}. Tell me what you want to do.`
            : 'Describe what you want to create and let AI help you'
          }
        </div>
        {existingSlides && existingSlides.length > 0 && (
          <div style={{
            fontSize: '14px',
            color: '#9CA3AF',
            textAlign: 'center',
            marginBottom: '16px',
            fontFamily: "'Inter', sans-serif",
            padding: '12px',
            backgroundColor: '#F9FAFB',
            borderRadius: '8px',
            border: '1px solid #E5E7EB'
          }}>
            💡 <strong>Tip:</strong> Use "add another slide" to keep existing content, or "create new slides" to start fresh
          </div>
        )}
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={
            existingSlides && existingSlides.length > 0
              ? `e.g., "Add another slide about success", "Make one more motivational slide", "Create new slides about entrepreneurship"...`
              : `e.g., Create a motivational ${mode.slice(0, -1)} about entrepreneurship with a modern design...`
          }
          disabled={isGenerating}
          style={{
            width: '100%',
            minHeight: '100px',
            fontSize: '16px',
            color: '#23272F',
            border: '2px solid #E5E7EB',
            borderRadius: '12px',
            padding: '16px',
            fontFamily: "'Inter', sans-serif",
            marginBottom: '32px',
            boxSizing: 'border-box',
            resize: 'none',
            background: '#FFF',
            outline: 'none',
            transition: 'border-color 0.2s ease',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
          <button
            onClick={handleSubmit}
            disabled={isGenerating || !prompt.trim()}
            style={{
              height: '56px',
              padding: '0 48px',
              borderRadius: '12px',
              border: 'none',
              background: isGenerating || !prompt.trim() ? '#A5B4FC' : '#2563EB',
              color: '#FFF',
              fontWeight: '700',
              fontSize: '18px',
              cursor: isGenerating || !prompt.trim() ? 'not-allowed' : 'pointer',
              fontFamily: "'Inter', sans-serif",
              transition: 'all 0.2s',
              boxShadow: isGenerating || !prompt.trim() ? 'none' : '0 1px 2px rgba(37,99,235,0.08)',
            }}
          >
            Generate
          </button>
        </div>
        {error && (
          <div style={{
            color: '#EF4444',
            fontSize: '14px',
            textAlign: 'center',
            marginTop: '20px',
            maxWidth: '360px',
            fontFamily: "'Inter', sans-serif"
          }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
} 