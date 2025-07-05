'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2 } from 'lucide-react';

export default function PromptModal({
  isOpen,
  onClose,
  onSubmit,
  businessContext = null
}) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setPrompt('');
      setError('');
      setIsGenerating(false);
    }
  }, [isOpen]);

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
    
    try {
      // Call the generate-slides API for meme generation
      const response = await fetch('/api/generate-slides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMessage,
          slideCount: 1, // Memes only need one slide
          companyName: businessContext?.companyName,
          businessType: businessContext?.businessType,
          productInfo: businessContext?.productInfo
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate meme');
      }
      const data = await response.json();
      console.log('API response received:', data);
      console.log('Meme from API:', data.slides);
      
      if (!data.slides || !Array.isArray(data.slides)) {
        throw new Error('Invalid response format: slides array not found');
      }
      
      // Automatically apply the generated meme (first slide)
      onSubmit(data.slides, userMessage);
      onClose();
      
    } catch (err) {
      setError(err.message || 'Failed to generate meme');
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
            Generating your meme...
          </div>
          <div style={{ fontSize: '16px', opacity: 0.8 }}>
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
        {/* Title */}
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
        {/* Subtitle */}
        <div style={{
          fontSize: '17px',
          color: '#7B8493',
          textAlign: 'center',
          marginBottom: '24px',
          fontWeight: 500,
          fontFamily: "'Inter', sans-serif"
        }}>
          Describe the meme you want to create and let AI help you
        </div>
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="e.g., Create a funny meme about Mondays with a cat and witty caption..."
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
        {/* Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
        }}>
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
              fontWeight: 700,
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