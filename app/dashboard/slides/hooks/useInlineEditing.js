'use client';

import { useState, useCallback, useRef } from 'react';

export function useInlineEditing({ slides, onSlideUpdate }) {
  const [inlineEditing, setInlineEditing] = useState({ isEditing: false, textIndex: -1, slideIndex: -1 });
  const [inlineEditText, setInlineEditText] = useState('');
  const inlineEditRef = useRef(null);

  const startInlineEditing = useCallback((slideIndex, textIndex) => {
    if (slideIndex === -1 || textIndex === -1 || !slides[slideIndex]?.texts[textIndex]) return;
    
    const currentContent = slides[slideIndex].texts[textIndex].content;
    const textElement = document.querySelectorAll('[data-text-overlay]')[textIndex];
    const textItem = slides[slideIndex].texts[textIndex];

    // If the element is auto-sized, fix its dimensions before editing
    if (textElement && !textItem.width) {
      const rect = textElement.getBoundingClientRect();
      const newTexts = slides[slideIndex].texts.map((text, i) =>
        i === textIndex ? { ...text, width: rect.width, height: rect.height } : text
      );
      onSlideUpdate(slideIndex, { texts: newTexts });
    }

    setInlineEditing({ isEditing: true, textIndex, slideIndex });
    setInlineEditText(currentContent === 'New Text' ? '' : currentContent);
    
    // Focus the input after a short delay to ensure it's rendered
    setTimeout(() => {
      if (inlineEditRef.current) {
        const textarea = inlineEditRef.current;
        textarea.focus();
        textarea.select();
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    }, 10);
  }, [slides, onSlideUpdate]);

  const saveInlineEdit = useCallback(() => {
    if (inlineEditing.isEditing && inlineEditing.textIndex !== -1 && inlineEditing.slideIndex !== -1) {
      const trimmedText = inlineEditText.trim();
      
      if (!trimmedText) {
        // If text is empty, delete it
        const newTexts = slides[inlineEditing.slideIndex].texts.filter((_, i) => i !== inlineEditing.textIndex);
        onSlideUpdate(inlineEditing.slideIndex, { texts: newTexts });
      } else {
        // Otherwise, update it, and reset width/height to allow for reflow
        const newTexts = slides[inlineEditing.slideIndex].texts.map((text, i) => 
          i === inlineEditing.textIndex ? { ...text, content: trimmedText, width: undefined, height: undefined } : text
        );
        onSlideUpdate(inlineEditing.slideIndex, { texts: newTexts });
      }
      
      setInlineEditing({ isEditing: false, textIndex: -1, slideIndex: -1 });
      setInlineEditText('');
    }
  }, [inlineEditing, inlineEditText, slides, onSlideUpdate]);
  
  const handleInlineEditChange = useCallback((e) => {
    setInlineEditText(e.target.value);
  }, []);
  
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveInlineEdit();
    } else if (e.key === 'Escape') {
      setInlineEditing({ isEditing: false, textIndex: -1, slideIndex: -1 });
      setInlineEditText('');
    }
  }, [saveInlineEdit]);

  return {
    inlineEditing,
    inlineEditText,
    inlineEditRef,
    startInlineEditing,
    saveInlineEdit,
    handleInlineEditChange,
    handleKeyDown
  };
} 